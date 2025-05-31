import { Test, TestingModule } from '@nestjs/testing'
import { ServiceOrderService } from './service-order.service'
import { getRepositoryToken } from '@nestjs/typeorm'
import { ServiceOrder } from './entities'
import { Repository } from 'typeorm'
import { PricingService } from 'src/pricing/pricing.service'
import { CompanyService } from 'src/company/company.service'
import { ServiceOrderStatus } from './enums/service-order-status.enum'
import { ActivityType } from 'src/activity/enums/activity-type.enum'
import { Company } from 'src/company/entities'
import { CreateServiceOrderDto } from './dto'
import Stripe from 'stripe'
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common'

describe('ServiceOrderService', () => {
  let service: ServiceOrderService
  let serviceOrderRepository: Repository<ServiceOrder>
  let pricingService: PricingService
  let companyService: CompanyService
  let stripeClient: Stripe

  const mockCompany: Partial<Company> = {
    id: 'company-id',
    name: 'Test Company',
    siretNumber: '123456789',
    employeesNumber: 100,
    address: '123 Test St',
    city: 'Test City',
    postalCode: '12345',
    phoneNumber: '1234567890',
    isVerified: true,
    stripeCustomerId: 'cus_123',
    credit: 0,
    client: null,
    serviceOrders: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    logo: null,
    hasId: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
    softRemove: jest.fn(),
    recover: jest.fn(),
    reload: jest.fn(),
  }

  const mockServiceOrder: Partial<ServiceOrder> = {
    id: 'test-id',
    participants: 5,
    totalCost: 1000,
    duration: 3,
    details: [],
    company: mockCompany as Company,
    status: ServiceOrderStatus.PENDING,
    startDate: new Date(),
    endDate: new Date(),
    stripeCheckoutSession: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    hasId: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
    softRemove: jest.fn(),
    recover: jest.fn(),
    reload: jest.fn(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ServiceOrderService,
        {
          provide: getRepositoryToken(ServiceOrder),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
          },
        },
        {
          provide: PricingService,
          useValue: {
            calculatePricing: jest.fn(),
          },
        },
        {
          provide: CompanyService,
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: 'STRIPE_CLIENT',
          useValue: {
            checkout: {
              sessions: {
                create: jest.fn(),
                retrieve: jest.fn(),
              },
            },
          },
        },
      ],
    }).compile()

    service = module.get<ServiceOrderService>(ServiceOrderService)
    serviceOrderRepository = module.get<Repository<ServiceOrder>>(
      getRepositoryToken(ServiceOrder),
    )
    pricingService = module.get<PricingService>(PricingService)
    companyService = module.get<CompanyService>(CompanyService)
    stripeClient = module.get<Stripe>('STRIPE_CLIENT')
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('create', () => {
    const createServiceOrderDto: CreateServiceOrderDto = {
      participants: 5,
      duration: 3,
      details: [
        {
          serviceType: ActivityType.NOURRITURE,
          frequency: 2,
        },
      ],
    }

    it('should create a service order', async () => {
      jest.spyOn(pricingService, 'calculatePricing').mockResolvedValue(1000)
      jest.spyOn(companyService, 'findOne').mockResolvedValue({
        ...mockCompany,
        serviceOrders: [],
        save: jest.fn(),
      } as any)
      jest
        .spyOn(serviceOrderRepository, 'create')
        .mockReturnValue(mockServiceOrder as ServiceOrder)
      jest
        .spyOn(serviceOrderRepository, 'save')
        .mockResolvedValue(mockServiceOrder as ServiceOrder)

      const result = await service.create(createServiceOrderDto, 'client-id')

      expect(result).toEqual(mockServiceOrder)
      expect(pricingService.calculatePricing).toHaveBeenCalled()
      expect(companyService.findOne).toHaveBeenCalled()
      expect(serviceOrderRepository.create).toHaveBeenCalled()
      expect(serviceOrderRepository.save).toHaveBeenCalled()
    })

    it('should throw BadRequestException when company not found', async () => {
      jest.spyOn(companyService, 'findOne').mockResolvedValue(null)

      await expect(
        service.create(createServiceOrderDto, 'client-id'),
      ).rejects.toThrow(BadRequestException)
    })

    it('should throw UnprocessableEntityException when pricing calculation fails', async () => {
      jest.spyOn(companyService, 'findOne').mockResolvedValue({
        ...mockCompany,
        serviceOrders: [],
        save: jest.fn(),
      } as any)
      jest
        .spyOn(pricingService, 'calculatePricing')
        .mockRejectedValue(new Error('Pricing error'))

      await expect(
        service.create(createServiceOrderDto, 'client-id'),
      ).rejects.toThrow(UnprocessableEntityException)
    })

    it('should throw UnprocessableEntityException when save fails', async () => {
      jest.spyOn(pricingService, 'calculatePricing').mockResolvedValue(1000)
      jest.spyOn(companyService, 'findOne').mockResolvedValue({
        ...mockCompany,
        serviceOrders: [],
        save: jest.fn(),
      } as any)
      jest
        .spyOn(serviceOrderRepository, 'create')
        .mockReturnValue(mockServiceOrder as ServiceOrder)
      jest
        .spyOn(serviceOrderRepository, 'save')
        .mockRejectedValue(new Error('Save error'))

      await expect(
        service.create(createServiceOrderDto, 'client-id'),
      ).rejects.toThrow(UnprocessableEntityException)
    })
  })

  describe('findOne', () => {
    it('should return a service order', async () => {
      jest
        .spyOn(serviceOrderRepository, 'findOne')
        .mockResolvedValue(mockServiceOrder as ServiceOrder)

      const result = await service.findOne({ id: 'test-id' })

      expect(result).toEqual(mockServiceOrder)
      expect(serviceOrderRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'test-id' },
        relations: undefined,
      })
    })

    it('should throw NotFoundException when service order not found', async () => {
      jest.spyOn(serviceOrderRepository, 'findOne').mockResolvedValue(null)

      await expect(service.findOne({ id: 'test-id' })).rejects.toThrow(
        NotFoundException,
      )
    })

    it('should include specified relations', async () => {
      jest
        .spyOn(serviceOrderRepository, 'findOne')
        .mockResolvedValue(mockServiceOrder as ServiceOrder)

      await service.findOne({ id: 'test-id' }, { company: true, details: true })

      expect(serviceOrderRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'test-id' },
        relations: { company: true, details: true },
      })
    })
  })

  describe('createCheckoutSession', () => {
    it('should create a Stripe checkout session', async () => {
      const mockSession = {
        id: 'cs_test_123',
        url: 'https://checkout.stripe.com/test',
      }

      jest
        .spyOn(companyService, 'findOne')
        .mockResolvedValue(mockCompany as any)
      jest
        .spyOn(serviceOrderRepository, 'findOne')
        .mockResolvedValue(mockServiceOrder as ServiceOrder)
      jest
        .spyOn(stripeClient.checkout.sessions, 'create')
        .mockResolvedValue(mockSession as any)
      jest.spyOn(serviceOrderRepository, 'save').mockResolvedValue({
        ...mockServiceOrder,
        stripeCheckoutSession: mockSession.id,
      } as ServiceOrder)

      const result = await service.createCheckoutSession('test-id', 'user-id')

      expect(result).toEqual(mockSession)
      expect(companyService.findOne).toHaveBeenCalled()
      expect(serviceOrderRepository.findOne).toHaveBeenCalled()
      expect(stripeClient.checkout.sessions.create).toHaveBeenCalled()
      expect(serviceOrderRepository.save).toHaveBeenCalled()
    })

    it('should throw NotFoundException when service order not found', async () => {
      jest.spyOn(serviceOrderRepository, 'findOne').mockResolvedValue(null)

      await expect(
        service.createCheckoutSession('test-id', 'user-id'),
      ).rejects.toThrow(NotFoundException)
    })

    it('should throw BadRequestException when company not found', async () => {
      jest
        .spyOn(serviceOrderRepository, 'findOne')
        .mockResolvedValue(mockServiceOrder as ServiceOrder)
      jest.spyOn(companyService, 'findOne').mockResolvedValue(null)

      await expect(
        service.createCheckoutSession('test-id', 'user-id'),
      ).rejects.toThrow(BadRequestException)
    })

    it('should throw UnprocessableEntityException when Stripe session creation fails', async () => {
      jest
        .spyOn(companyService, 'findOne')
        .mockResolvedValue(mockCompany as any)
      jest
        .spyOn(serviceOrderRepository, 'findOne')
        .mockResolvedValue(mockServiceOrder as ServiceOrder)
      jest
        .spyOn(stripeClient.checkout.sessions, 'create')
        .mockRejectedValue(new Error('Stripe error'))

      await expect(
        service.createCheckoutSession('test-id', 'user-id'),
      ).rejects.toThrow(UnprocessableEntityException)
    })
  })

  describe('confirmPayment', () => {
    // ... existing code ...
  })

  describe('expirePastOrders', () => {
    // ... existing code ...
  })

  describe('find', () => {
    it('should return all service orders', async () => {
      const mockServiceOrders = [mockServiceOrder, mockServiceOrder]
      jest
        .spyOn(serviceOrderRepository, 'find')
        .mockResolvedValue(mockServiceOrders as ServiceOrder[])

      const result = await service.find()

      expect(result).toEqual(mockServiceOrders)
      expect(serviceOrderRepository.find).toHaveBeenCalled()
    })

    it('should include specified relations', async () => {
      const mockServiceOrders = [mockServiceOrder, mockServiceOrder]
      jest
        .spyOn(serviceOrderRepository, 'find')
        .mockResolvedValue(mockServiceOrders as ServiceOrder[])

      await service.find(undefined, { company: true, details: true })

      expect(serviceOrderRepository.find).toHaveBeenCalledWith({
        relations: { company: true, details: true },
      })
    })

    it('should handle empty result', async () => {
      jest.spyOn(serviceOrderRepository, 'find').mockResolvedValue([])

      const result = await service.find()

      expect(result).toEqual([])
    })
  })
})
