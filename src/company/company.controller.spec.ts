import { Test, TestingModule } from '@nestjs/testing'
import { CompanyService } from './company.service'
import { CompanyController } from './controllers/company.controller'
import { UploadService } from '@app/upload'
import { CreateCompanyDto, UpdateCompanyDto } from './dto'
import { IRequestWithUser } from '@app/common/interfaces/request-user.interface.dto'
import { UserRoles } from 'src/user/enums/user-roles.enum'
import { Request } from 'express'

describe('CompanyController', () => {
  let controller: CompanyController
  let companyService: CompanyService
  let uploadService: UploadService

  const mockCompanyService = {
    create: jest.fn(),
    update: jest.fn(),
    updateCompanyLogo: jest.fn(),
    findOne: jest.fn(),
  }

  const mockUploadService = {
    upload: jest.fn(),
  }

  const mockUser = {
    id: 'user-123',
    userName: 'testuser',
    passwords: '',
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    role: UserRoles.CLIENT,
    isSuperUser: false,
    isVerified: true,
    verificationSentAt: new Date(),
    refreshTokens: [],
    articles: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  }

  const createMockRequest = () => {
    const req = {
      user: mockUser,
    } as Partial<Request>
    return req as IRequestWithUser
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CompanyController],
      providers: [
        {
          provide: CompanyService,
          useValue: mockCompanyService,
        },
        {
          provide: UploadService,
          useValue: mockUploadService,
        },
      ],
    }).compile()

    controller = module.get<CompanyController>(CompanyController)
    companyService = module.get<CompanyService>(CompanyService)
    uploadService = module.get<UploadService>(UploadService)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })

  describe('create', () => {
    const mockCreateCompanyDto: CreateCompanyDto = {
      name: 'Test Company',
      address: '123 Test St',
      postalCode: '12345',
      city: 'Test City',
      phoneNumber: '+1234567890',
      siretNumber: '12345678901234',
      employeesNumber: 10,
    }

    const mockFile = {
      fieldname: 'logo',
      originalname: 'test.jpg',
      encoding: '7bit',
      mimetype: 'image/jpeg',
      buffer: Buffer.from('test'),
      size: 1024,
    } as Express.Multer.File

    const mockUploadedFile = {
      url: 'http://example.com/logo.jpg',
      display_name: 'logo.jpg',
      original_filename: 'test',
      resource_type: 'image',
      message: '',
      name: '',
      http_code: 200,
      severity: 'info',
    }

    it('should create a company successfully', async () => {
      const expectedResult = {
        id: 'company-123',
        ...mockCreateCompanyDto,
        logo: mockUploadedFile,
      }

      mockUploadService.upload.mockResolvedValue(mockUploadedFile)
      mockCompanyService.create.mockResolvedValue(expectedResult)

      const result = await controller.create(
        mockCreateCompanyDto,
        createMockRequest(),
        mockFile,
      )

      expect(result).toBe(expectedResult)
      expect(uploadService.upload).toHaveBeenCalledWith(mockFile, 'companies')
      expect(companyService.create).toHaveBeenCalledWith(
        mockCreateCompanyDto,
        mockUploadedFile,
        mockUser.id,
      )
    })
  })

  describe('update', () => {
    const mockUpdateCompanyDto: UpdateCompanyDto = {
      name: 'Updated Company',
      address: '456 Test St',
      postalCode: '54321',
      city: 'Updated City',
      phoneNumber: '+0987654321',
      siretNumber: '43210987654321',
      employeesNumber: 20,
      credit: 0,
    }

    it('should update a company successfully', async () => {
      const expectedResult = {
        id: 'company-123',
        ...mockUpdateCompanyDto,
      }

      mockCompanyService.update.mockResolvedValue(expectedResult)

      const result = await controller.update(
        mockUpdateCompanyDto,
        createMockRequest(),
      )

      expect(result).toBe(expectedResult)
      expect(companyService.update).toHaveBeenCalledWith(mockUpdateCompanyDto, {
        client: { id: mockUser.id },
      })
    })
  })

  describe('updateLogo', () => {
    const mockFile = {
      fieldname: 'logo',
      originalname: 'test.jpg',
      encoding: '7bit',
      mimetype: 'image/jpeg',
      buffer: Buffer.from('test'),
      size: 1024,
    } as Express.Multer.File

    const mockUploadedFile = {
      url: 'http://example.com/logo.jpg',
      display_name: 'logo.jpg',
      original_filename: 'test',
      resource_type: 'image',
      message: '',
      name: '',
      http_code: 200,
      severity: 'info',
    }

    it('should update company logo successfully', async () => {
      const expectedResult = {
        id: 'company-123',
        logo: mockUploadedFile,
      }

      mockUploadService.upload.mockResolvedValue(mockUploadedFile)
      mockCompanyService.updateCompanyLogo.mockResolvedValue(expectedResult)

      const result = await controller.updateLogo(createMockRequest(), mockFile)

      expect(result).toBe(expectedResult)
      expect(uploadService.upload).toHaveBeenCalledWith(mockFile, 'companies')
      expect(companyService.updateCompanyLogo).toHaveBeenCalledWith(
        mockUploadedFile,
        mockUser.id,
      )
    })
  })

  describe('getClientCompany', () => {
    it('should get client company successfully', async () => {
      const expectedResult = {
        id: 'company-123',
        name: 'Test Company',
        client: { id: mockUser.id },
        logo: { url: 'http://example.com/logo.jpg' },
        serviceOrders: [{ id: 'order-1', details: [] }],
      }

      mockCompanyService.findOne.mockResolvedValue(expectedResult)

      const result = await controller.getClientCompany(createMockRequest())

      expect(result).toBe(expectedResult)
      expect(companyService.findOne).toHaveBeenCalledWith({
        where: { client: { id: mockUser.id } },
        relations: {
          client: true,
          logo: true,
          serviceOrders: { details: true },
        },
      })
    })
  })
})
