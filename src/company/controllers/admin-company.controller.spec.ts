import { Test, TestingModule } from '@nestjs/testing'
import { CompanyAdminController } from './admin-company.controller'
import { CompanyService } from '../company.service'
import { CompanyOptionsDto } from '../dto'
import { PageDto, PageMetaDto } from '@app/pagination/dto'
import { updateCompanyByAdmin } from '../dto/update-company-by-admin.dto'

describe('CompanyAdminController', () => {
  let controller: CompanyAdminController
  let companyService: CompanyService

  const mockCompanyService = {
    getPaginatedCompanies: jest.fn(),
    findOne: jest.fn(),
    verifyCompany: jest.fn(),
    update: jest.fn(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CompanyAdminController],
      providers: [
        {
          provide: CompanyService,
          useValue: mockCompanyService,
        },
      ],
    }).compile()

    controller = module.get<CompanyAdminController>(CompanyAdminController)
    companyService = module.get<CompanyService>(CompanyService)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('getPaginatedCompanies', () => {
    const mockPageOptionsDto: CompanyOptionsDto = {
      skip: 0,
      take: 10,
      name: 'Test',
      isVerified: true,
    }

    const mockPageMetaDto = new PageMetaDto({
      itemCount: 1,
      pageOptionsDto: mockPageOptionsDto,
    })

    const mockCompanies = [
      {
        id: 'company-1',
        name: 'Test Company',
        isVerified: true,
      },
    ]

    const mockPageDto = new PageDto(mockCompanies, mockPageMetaDto)

    it('should return paginated companies', async () => {
      mockCompanyService.getPaginatedCompanies.mockResolvedValue(mockPageDto)

      const result = await controller.getPaginatedCompanies(mockPageOptionsDto)

      expect(result).toEqual(mockPageDto)
      expect(companyService.getPaginatedCompanies).toHaveBeenCalledWith(
        mockPageOptionsDto,
      )
    })
  })

  describe('getCompanyById', () => {
    const mockCompanyId = 'company-1'
    const mockCompany = {
      id: mockCompanyId,
      name: 'Test Company',
      isVerified: true,
      client: { id: 'client-1' },
      logo: { url: 'logo.jpg' },
      serviceOrders: [{ id: 'order-1', details: [] }],
    }

    it('should return a company by id', async () => {
      mockCompanyService.findOne.mockResolvedValue(mockCompany)

      const result = await controller.getCompanyById(mockCompanyId)

      expect(result).toEqual(mockCompany)
      expect(companyService.findOne).toHaveBeenCalledWith({
        where: { id: mockCompanyId },
        relations: {
          client: true,
          logo: true,
          serviceOrders: { details: true },
        },
      })
    })
  })

  describe('verifyCompany', () => {
    const mockCompanyId = 'company-1'
    const mockVerifiedCompany = {
      id: mockCompanyId,
      isVerified: true,
    }

    it('should verify a company', async () => {
      mockCompanyService.verifyCompany.mockResolvedValue(mockVerifiedCompany)

      const result = await controller.verifyCompany(mockCompanyId)

      expect(result).toEqual(mockVerifiedCompany)
      expect(companyService.verifyCompany).toHaveBeenCalledWith(mockCompanyId)
    })
  })

  describe('updateCompanyByAdmin', () => {
    const mockCompanyId = 'company-1'
    const mockUpdateDto: updateCompanyByAdmin = {
      name: 'Updated Company',
      isVerified: true,
    }
    const mockUpdatedCompany = {
      id: mockCompanyId,
      ...mockUpdateDto,
    }

    it('should update a company by admin', async () => {
      mockCompanyService.update.mockResolvedValue(mockUpdatedCompany)

      const result = await controller.updateCompanyByAdmin(
        mockUpdateDto,
        mockCompanyId,
      )

      expect(result).toEqual(mockUpdatedCompany)
      expect(companyService.update).toHaveBeenCalledWith(mockUpdateDto, {
        id: mockCompanyId,
      })
    })
  })
})
