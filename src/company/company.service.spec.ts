import { Test, TestingModule } from '@nestjs/testing'
import { CompanyService } from './company.service'
import { getRepositoryToken } from '@nestjs/typeorm'
import { Company } from './entities'
import { Repository } from 'typeorm'
import { MediaService } from '@app/media'
import { ClientService } from 'src/client/client.service'
import { BadRequestException, NotFoundException } from '@nestjs/common'
import { Media } from '@app/media/entities'
import { CloudinaryResponse } from '@app/upload/types/cloudinary-response.type'
import Stripe from 'stripe'
import { ILike } from 'typeorm'
import { CreateCompanyDto, UpdateCompanyDto, CompanyOptionsDto } from './dto'
import { Order } from '@app/pagination/constants'

describe('CompanyService', () => {
  let service: CompanyService
  let companyRepository: Repository<Company>
  let mediaService: MediaService
  let clientService: ClientService
  let stripeClient: Stripe

  const mockCompanyRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findAndCount: jest.fn(),
  }

  const mockMediaService = {
    create: jest.fn(),
  }

  const mockClientService = {
    findOne: jest.fn(),
  }

  const mockStripeClient = {
    customers: {
      create: jest.fn(),
    },
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CompanyService,
        {
          provide: getRepositoryToken(Company),
          useValue: mockCompanyRepository,
        },
        {
          provide: MediaService,
          useValue: mockMediaService,
        },
        {
          provide: ClientService,
          useValue: mockClientService,
        },
        {
          provide: 'STRIPE_CLIENT',
          useValue: mockStripeClient,
        },
      ],
    }).compile()

    service = module.get<CompanyService>(CompanyService)
    companyRepository = module.get<Repository<Company>>(
      getRepositoryToken(Company),
    )
    mediaService = module.get<MediaService>(MediaService)
    clientService = module.get<ClientService>(ClientService)
    stripeClient = module.get<Stripe>('STRIPE_CLIENT')
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('create', () => {
    const mockClientId = 'client-123'
    const mockCreateCompanyDto: CreateCompanyDto = {
      name: 'Test Company',
      address: '123 Test St',
      postalCode: '12345',
      city: 'Test City',
      phoneNumber: '+1234567890',
      siretNumber: '12345678901234',
      employeesNumber: 10,
    }
    const mockCloudinaryResponse: CloudinaryResponse = {
      url: 'http://example.com/logo.png',
      display_name: 'logo.png',
      original_filename: 'logo',
      resource_type: 'image',
      message: '',
      name: '',
      http_code: 200,
      severity: 'info',
    }
    const mockMedia = new Media()
    const mockClient = { id: mockClientId, email: 'test@example.com' }

    it('should create a company successfully', async () => {
      mockCompanyRepository.findOne.mockResolvedValue(null)
      mockMediaService.create.mockResolvedValue(mockMedia)
      mockClientService.findOne.mockResolvedValue(mockClient)
      mockCompanyRepository.create.mockReturnValue({
        ...mockCreateCompanyDto,
        logo: mockMedia,
        client: mockClient,
      })
      mockCompanyRepository.save.mockImplementation((company) =>
        Promise.resolve(company),
      )

      const result = await service.create(
        mockCreateCompanyDto,
        mockCloudinaryResponse,
        mockClientId,
      )

      expect(result).toBeDefined()
      expect(result.name).toBe(mockCreateCompanyDto.name)
      expect(result.logo).toBe(mockMedia)
      expect(result.client).toBe(mockClient)
    })

    it('should throw BadRequestException if client already has a company', async () => {
      mockCompanyRepository.findOne.mockResolvedValue({
        id: 'existing-company',
      })

      await expect(
        service.create(
          mockCreateCompanyDto,
          mockCloudinaryResponse,
          mockClientId,
        ),
      ).rejects.toThrow(BadRequestException)
    })
  })

  describe('update', () => {
    const mockCompanyId = '1'
    const mockUpdateDto: UpdateCompanyDto = {
      name: 'Updated Company',
      credit: 100,
    }
    const mockUpdatedCompany = {
      id: mockCompanyId,
      ...mockUpdateDto,
    }

    it('should update company successfully', async () => {
      mockCompanyRepository.findOne.mockResolvedValueOnce({ id: mockCompanyId })
      mockCompanyRepository.update.mockResolvedValue({ affected: 1 })
      mockCompanyRepository.findOne.mockResolvedValueOnce(mockUpdatedCompany)

      const result = await service.update(mockUpdateDto, { id: mockCompanyId })

      expect(result).toEqual(mockUpdatedCompany)
      expect(mockCompanyRepository.update).toHaveBeenCalledWith(
        mockCompanyId,
        mockUpdateDto,
      )
    })
  })

  describe('createStripeCustomer', () => {
    const mockCompany = {
      id: '1',
      name: 'Test Company',
      client: { email: 'test@example.com' },
      stripeCustomerId: null,
      save: jest.fn(),
    }

    it('should create a Stripe customer successfully', async () => {
      const mockStripeCustomerId = 'cus_123'
      mockStripeClient.customers.create.mockResolvedValue({
        id: mockStripeCustomerId,
      })
      mockCompany.save.mockResolvedValue({
        ...mockCompany,
        stripeCustomerId: mockStripeCustomerId,
      })

      const result = await service.createStripeCustomer(mockCompany as any)

      expect(result).toBe(mockStripeCustomerId)
      expect(mockCompany.stripeCustomerId).toBe(mockStripeCustomerId)
      expect(mockCompany.save).toHaveBeenCalled()
    })

    it('should throw error when Stripe customer creation fails', async () => {
      mockStripeClient.customers.create.mockRejectedValue(
        new Error('Stripe API Error'),
      )

      await expect(
        service.createStripeCustomer(mockCompany as any),
      ).rejects.toThrow('Failed to create Stripe customer')
    })
  })

  describe('delete', () => {
    const mockCompanyId = '1'

    it('should delete company successfully', async () => {
      const mockCompany = { id: mockCompanyId }
      mockCompanyRepository.findOne.mockResolvedValue(mockCompany)
      mockCompanyRepository.delete.mockResolvedValue({ affected: 1 })

      const result = await service.delete(mockCompanyId)

      expect(result).toBe(true)
      expect(mockCompanyRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockCompanyId },
      })
      expect(mockCompanyRepository.delete).toHaveBeenCalledWith(mockCompanyId)
    })

    it('should throw NotFoundException when company not found', async () => {
      mockCompanyRepository.findOne.mockResolvedValue(null)

      await expect(service.delete(mockCompanyId)).rejects.toThrow(
        NotFoundException,
      )
    })
  })

  describe('getPaginatedCompanies', () => {
    const mockCompanyOptionsDto: CompanyOptionsDto = {
      skip: 0,
      take: 10,
      name: 'Test',
      isVerified: true,
      sort: { createdAt: Order.ASC },
    }

    const mockCompanies = [
      {
        id: '1',
        name: 'Test Company',
        isVerified: true,
        client: { id: 'client-1' },
        logo: { url: 'logo.jpg' },
        serviceOrders: [{ details: [] }],
      },
    ]

    it('should return paginated companies with filters', async () => {
      mockCompanyRepository.findAndCount.mockResolvedValue([mockCompanies, 1])

      const result = await service.getPaginatedCompanies(mockCompanyOptionsDto)

      expect(result.data).toEqual(mockCompanies)
      expect(result.meta.itemCount).toBe(1)
      expect(result.meta.take).toBe(mockCompanyOptionsDto.take)
      expect(mockCompanyRepository.findAndCount).toHaveBeenCalledWith({
        where: {
          name: ILike(`%${mockCompanyOptionsDto.name}%`),
          isVerified: mockCompanyOptionsDto.isVerified,
        },
        skip: mockCompanyOptionsDto.skip,
        take: mockCompanyOptionsDto.take,
        order: mockCompanyOptionsDto.sort,
        relations: {
          client: true,
          logo: true,
          serviceOrders: { details: true },
        },
      })
    })

    it('should return paginated companies without filters', async () => {
      const optionsWithoutFilters: CompanyOptionsDto = {
        skip: 0,
        take: 10,
        sort: { createdAt: Order.ASC },
      }

      mockCompanyRepository.findAndCount.mockResolvedValue([mockCompanies, 1])

      const result = await service.getPaginatedCompanies(optionsWithoutFilters)

      expect(result.data).toEqual(mockCompanies)
      expect(result.meta.itemCount).toBe(1)
      expect(mockCompanyRepository.findAndCount).toHaveBeenCalledWith({
        where: {},
        skip: optionsWithoutFilters.skip,
        take: optionsWithoutFilters.take,
        order: optionsWithoutFilters.sort,
        relations: {
          client: true,
          logo: true,
          serviceOrders: { details: true },
        },
      })
    })
  })

  describe('find', () => {
    const mockWhere = { isVerified: true }
    const mockRelations = { client: true }
    const mockOrder = { createdAt: Order.ASC }

    it('should find companies with given criteria', async () => {
      const mockCompanies = [
        { id: '1', name: 'Company 1', isVerified: true },
        { id: '2', name: 'Company 2', isVerified: true },
      ]

      mockCompanyRepository.find.mockResolvedValue(mockCompanies)

      const result = await service.find(mockWhere, mockRelations, mockOrder)

      expect(result).toEqual(mockCompanies)
      expect(mockCompanyRepository.find).toHaveBeenCalledWith({
        where: mockWhere,
        relations: mockRelations,
        order: mockOrder,
      })
    })
  })
})
