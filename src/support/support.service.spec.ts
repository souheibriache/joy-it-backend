import { Test, TestingModule } from '@nestjs/testing'
import { SupportService } from './support.service'
import { getRepositoryToken } from '@nestjs/typeorm'
import { Support } from './entities'
import { MediaService } from '@app/media'
import { MailerService } from '@app/mailer'
import { UploadService } from '@app/upload'
import { ClientService } from 'src/client/client.service'
import { Repository } from 'typeorm'
import { CreateSupportQuestionDto } from './dto/create-support-question.dto'
import { SupportCategory } from './enums/support-category.enum'
import {
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common'
import { ResourceTypeEnum } from '@app/media/enums/resource-type.enum'
import { PostQuestionUserDto } from './dto/post-question-user.dto'
import { AnswerSupportQuestionDto } from './dto'
import { User } from 'src/user/entities'
import { PageDto, PageMetaDto } from '@app/pagination/dto'
import { ISupport } from './interfaces/support.interface'
import { ConfigModule, ConfigService } from '@nestjs/config'
import * as Joi from 'joi'
import { Readable } from 'stream'
import { SupportSubjectEnum } from './enums'
import * as archiver from 'archiver'
import { Media } from '@app/media/entities'
import { CloudinaryResponse } from '@app/upload/types/cloudinary-response.type'
import {
  FindOptionsOrder,
  FindOptionsRelations,
  FindOptionsWhere,
  ILike,
  In,
  IsNull,
  Not,
} from 'typeorm'
import { SupportFilterDto } from './dto/support-filter.dto'
import { SupportOptionsDto } from './dto/support-options.dto'

// Mock environment variables
process.env.NODE_ENV = 'test'
process.env.PORT = '3000'
process.env.JWT_AUTH_KEY = 'test-jwt-key'
process.env.RESET_PASSWORD_SECRET_KEY = 'test-reset-key'
process.env.DB_HOST = 'localhost'
process.env.DB_PORT = '5432'
process.env.DB_USER = 'test'
process.env.DB_PASSWORD = 'test-password'
process.env.DB_NAME_DEV = 'test_db'
process.env.ADMIN_DASHBOARD_HOST = 'http://localhost:3000'
process.env.FRONTEND_HOST = 'http://localhost:3000'
process.env.SWAGGER_ENDPOINT = 'doc'
process.env.SWAGGER_USERNAME = 'test'
process.env.SWAGGER_PASSWORD = 'test'

jest.mock('@nestjs/config', () => ({
  ConfigService: jest.fn().mockImplementation(() => ({
    get: jest.fn((key: string) => {
      const config = {
        JWT_AUTH_KEY: 'test-jwt-key',
        RESET_PASSWORD_SECRET_KEY: 'test-reset-key',
        DB_HOST: 'localhost',
        DB_PORT: 5432,
        DB_USER: 'test',
        DB_PASSWORD: 'test-password',
        DB_NAME_DEV: 'test_db',
        FRONTEND_HOST: 'http://localhost:3000',
        SENDGRID_API_KEY: 'test-sendgrid-key',
        CONFIRM_ACCOUNT_SECRET_KEY: 'test-confirm-key',
        REDIS_HOST: 'localhost',
        REDIS_PORT: 6379,
        REDIS_PASSWORD: 'test-redis-password',
      }
      return config[key]
    }),
  })),
  ConfigModule: {
    forRoot: jest.fn().mockReturnValue({
      module: class DynamicModule {},
      providers: [],
    }),
  },
}))

describe('SupportService', () => {
  let service: SupportService
  let supportRepository: Repository<Support>
  let mediaService: MediaService
  let mailerService: MailerService
  let uploadService: UploadService
  let clientService: ClientService

  const mockSupportRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    findAndCount: jest.fn(),
    update: jest.fn(),
    createQueryBuilder: jest.fn(),
  }

  const mockMediaService = {
    create: jest.fn(),
    delete: jest.fn(),
  }

  const mockMailerService = {
    sendSingle: jest.fn().mockImplementation(async (options) => {
      // Validate email options
      if (!options.to || !options.subject || !options.templateId) {
        throw new Error('Invalid email options')
      }
      return true
    }),
    sendSupportConfirmation: jest.fn().mockImplementation(async (options) => {
      // Validate confirmation email options
      if (!options.to || !options.supportId || !options.firstName) {
        throw new Error('Invalid confirmation email options')
      }
      return true
    }),
    sendSupportAnswer: jest.fn().mockImplementation(async (options) => {
      // Validate answer email options
      if (!options.to || !options.supportId || !options.answer) {
        throw new Error('Invalid answer email options')
      }
      return true
    }),
  }

  const mockUploadService = {
    upload: jest
      .fn()
      .mockImplementation(async (file: Express.Multer.File, folder: string) => {
        if (!file || !folder) {
          return null
        }
        const response: CloudinaryResponse = {
          url: `https://example.com/${folder}/${file.originalname}`,
          display_name: file.originalname,
          original_filename: file.originalname,
          resource_type: file.mimetype.startsWith('image/') ? 'image' : 'auto',
          message: 'Upload successful',
          name: 'Success',
          http_code: 200,
        }
        return response
      }),
    deleteFile: jest.fn().mockImplementation(async (publicId: string) => {
      if (!publicId) {
        throw new Error('Invalid public ID')
      }
      return true
    }),
  }

  const mockClientService = {
    findOne: jest.fn(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
        }),
      ],
      providers: [
        SupportService,
        {
          provide: getRepositoryToken(Support),
          useValue: mockSupportRepository,
        },
        {
          provide: MediaService,
          useValue: mockMediaService,
        },
        {
          provide: MailerService,
          useValue: mockMailerService,
        },
        {
          provide: UploadService,
          useValue: mockUploadService,
        },
        {
          provide: ClientService,
          useValue: mockClientService,
        },
      ],
    }).compile()

    service = module.get<SupportService>(SupportService)
    supportRepository = module.get<Repository<Support>>(
      getRepositoryToken(Support),
    )
    mediaService = module.get<MediaService>(MediaService)
    mailerService = module.get<MailerService>(MailerService)
    uploadService = module.get<UploadService>(UploadService)
    clientService = module.get<ClientService>(ClientService)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('create', () => {
    const mockFile: Express.Multer.File = {
      fieldname: 'questionAttachments',
      originalname: 'test.pdf',
      encoding: '7bit',
      mimetype: 'application/pdf',
      size: 12345,
      destination: '/tmp',
      filename: 'test.pdf',
      path: '/tmp/test.pdf',
      buffer: Buffer.from('test'),
      stream: null as any,
    }

    const mockCreateDto: CreateSupportQuestionDto = {
      question: 'Test question',
      subject: SupportSubjectEnum.OTHER,
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      category: SupportCategory.VISITOR,
      questionAttachments: [mockFile],
    }

    const mockUploadResult: CloudinaryResponse = {
      url: 'https://example.com/support/support_attachments/questions/test.pdf',
      display_name: 'test.pdf',
      original_filename: 'test.pdf',
      resource_type: 'auto',
      message: 'Upload successful',
      name: 'Success',
      http_code: 200,
    }

    const mockMediaResult: Media = {
      id: '1',
      fullUrl: mockUploadResult.url,
      name: mockUploadResult.display_name,
      originalName: mockUploadResult.original_filename,
      placeHolder: 'test',
      resourceType: ResourceTypeEnum.AUTO,
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

    it('should create a support question with attachments', async () => {
      const mockSupport: Support = {
        id: '1',
        ...mockCreateDto,
        questionAttachments: [mockMediaResult],
        attachments: [],
        answeredAt: null,
        answeredBy: null,
        adminAnswer: null,
        askedBy: null,
        seenAt: null,
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

      mockSupportRepository.create.mockReturnValue(mockSupport)
      mockSupportRepository.save.mockResolvedValue(mockSupport)
      mockUploadService.upload.mockResolvedValue(mockUploadResult)
      mockMediaService.create.mockResolvedValue(mockMediaResult)
      mockMailerService.sendSingle.mockResolvedValue(true)

      const result = await service.create(mockCreateDto)

      expect(result).toEqual(mockSupport)
      expect(mockUploadService.upload).toHaveBeenCalledWith(
        mockFile,
        'support/support_attachments/questions',
      )
      expect(mockMediaService.create).toHaveBeenCalledWith({
        fullUrl: mockUploadResult.url,
        name: mockUploadResult.display_name,
        originalName: mockUploadResult.original_filename,
        placeHolder: 'test',
        resourceType: ResourceTypeEnum.AUTO,
      })
      expect(mockMailerService.sendSingle).toHaveBeenCalledWith({
        to: mockCreateDto.email,
        subject: `Joy-it support - ${mockSupport.id}`,
        dynamicTemplateData: {
          firstName: mockCreateDto.firstName,
          lastName: mockCreateDto.lastName,
          supportId: mockSupport.id,
        },
        templateId: 'd-afc29d8a685e462ea83ce9789f2fd6ce',
      })
    })

    it('should throw InternalServerErrorException when file upload fails', async () => {
      const mockSupportWithoutAttachments: Support = {
        id: '1',
        ...mockCreateDto,
        questionAttachments: [],
        attachments: [],
        answeredAt: null,
        answeredBy: null,
        adminAnswer: null,
        askedBy: null,
        seenAt: null,
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

      mockSupportRepository.create.mockReturnValue(
        mockSupportWithoutAttachments,
      )
      mockSupportRepository.save.mockResolvedValue(
        mockSupportWithoutAttachments,
      )
      mockUploadService.upload.mockResolvedValue(null)

      await expect(service.create(mockCreateDto)).rejects.toThrow(
        InternalServerErrorException,
      )
    })
  })

  describe('getSupportById', () => {
    const mockSupport = {
      id: 'support-123',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      question: 'Test Question',
      seenAt: null,
      save: jest.fn(),
    }

    it('should return a support question and update seenAt', async () => {
      mockSupportRepository.findOne.mockResolvedValue(mockSupport)
      mockSupportRepository.update.mockResolvedValue({ affected: 1 })

      const result = await service.getSupportById(mockSupport.id)

      expect(result).toEqual(mockSupport)
      expect(mockSupportRepository.update).toHaveBeenCalledWith(
        mockSupport.id,
        expect.objectContaining({
          seenAt: expect.any(Date),
        }),
      )
    })

    it('should throw NotFoundException when support not found', async () => {
      mockSupportRepository.findOne.mockResolvedValue(null)

      await expect(service.getSupportById('non-existent')).rejects.toThrow(
        NotFoundException,
      )
    })
  })

  describe('postQuestionByUser', () => {
    const postQuestionUserDto: PostQuestionUserDto = {
      subject: 'Test Subject',
      question: 'Test Question',
    }

    const mockUser = {
      id: 'user-123',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      company: {
        name: 'Test Company',
        phoneNumber: '1234567890',
      },
    }

    it('should create a support question for authenticated user', async () => {
      mockClientService.findOne.mockResolvedValue(mockUser)
      const createSpy = jest.spyOn(service, 'create')

      await service.postQuestionByUser(postQuestionUserDto, mockUser.id)

      expect(mockClientService.findOne).toHaveBeenCalledWith(
        { id: mockUser.id },
        { company: true },
      )
      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          ...postQuestionUserDto,
          firstName: mockUser.firstName,
          lastName: mockUser.lastName,
          email: mockUser.email,
          companyName: mockUser.company.name,
          phoneNumber: mockUser.company.phoneNumber,
          category: SupportCategory.VISITOR,
        }),
      )
    })
  })

  describe('answerSupportQuestion', () => {
    const mockAnswerDto: AnswerSupportQuestionDto = {
      adminAnswer: 'Test answer',
      attachments: [
        {
          fieldname: 'attachments',
          originalname: 'test.pdf',
          encoding: '7bit',
          mimetype: 'application/pdf',
          size: 12345,
          destination: '/tmp',
          filename: 'test.pdf',
          path: '/tmp/test.pdf',
          buffer: Buffer.from('test'),
        } as Express.Multer.File,
      ],
    }

    const mockUser: Partial<User> = {
      id: '1',
      email: 'admin@example.com',
    }

    it('should answer a support question', async () => {
      const mockSupport = {
        id: '1',
        question: 'Test question',
        email: 'test@example.com',
        answeredAt: null,
        save: jest.fn(),
      }

      const mockUploadResult = {
        url: 'https://example.com/test.pdf',
        display_name: 'test.pdf',
        original_filename: 'test.pdf',
        placeholder: 'test',
        resource_type: 'auto',
      }

      const mockMediaResult = {
        id: '1',
        fullUrl: mockUploadResult.url,
        name: mockUploadResult.display_name,
        originalName: mockUploadResult.original_filename,
        placeHolder: mockUploadResult.placeholder,
        resourceType: ResourceTypeEnum.AUTO,
      }

      mockSupportRepository.findOne.mockResolvedValue(mockSupport)
      mockUploadService.upload.mockResolvedValue(mockUploadResult)
      mockMediaService.create.mockResolvedValue(mockMediaResult)
      mockMailerService.sendSupportAnswer.mockResolvedValue(true)

      const result = await service.answerSupportQuestion(
        '1',
        mockAnswerDto,
        mockUser as User,
      )

      expect(result.answeredAt).toBeDefined()
      expect(result.adminAnswer).toBe(mockAnswerDto.adminAnswer)
      expect(result.answeredBy).toEqual(mockUser)
      expect(mockUploadService.upload).toHaveBeenCalled()
      expect(mockMediaService.create).toHaveBeenCalled()
      expect(mockMailerService.sendSupportAnswer).toHaveBeenCalled()
    })

    it('should throw BadRequestException when question already answered', async () => {
      const mockSupport = {
        id: '1',
        question: 'Test question',
        email: 'test@example.com',
        answeredAt: new Date(),
      }

      mockSupportRepository.findOne.mockResolvedValue(mockSupport)

      await expect(
        service.answerSupportQuestion('1', mockAnswerDto, mockUser as User),
      ).rejects.toThrow(BadRequestException)
    })
  })

  describe('getAllSupports', () => {
    const supportOptionsDto = {
      take: 10,
      skip: 0,
      query: {
        email: 'test@example.com',
        isAnswered: true,
      },
    }

    const mockSupport: Partial<ISupport> = {
      id: 'support-123',
      firstName: 'John',
      lastName: 'Doe',
      email: 'test@example.com',
      question: 'Test Question',
      answeredAt: new Date(),
      subject: 'Test Subject',
      category: SupportCategory.VISITOR,
      createdAt: new Date(),
      updatedAt: new Date(),
      answeredBy: null,
      seenAt: null,
      attachments: [],
      questionAttachments: [],
      companyName: 'Test Company',
      adminAnswer: null,
      askedBy: null,
    }

    it('should return paginated support questions', async () => {
      const mockPageMetaDto = new PageMetaDto({
        itemCount: 1,
        pageOptionsDto: supportOptionsDto,
      })

      const expectedPageDto = new PageDto<ISupport>(
        [mockSupport as ISupport],
        mockPageMetaDto,
      )

      mockSupportRepository.findAndCount.mockResolvedValue([[mockSupport], 1])

      const result = await service.getAllSupports(supportOptionsDto)

      expect(result).toBeInstanceOf(PageDto)
      expect(result.data).toEqual([mockSupport])
      expect(result.meta).toEqual(mockPageMetaDto)
      expect(mockSupportRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: supportOptionsDto.skip,
          take: supportOptionsDto.take,
        }),
      )
    })
  })

  describe('downloadAllAttachments', () => {
    it('should return a stream with attachments', async () => {
      const mockSupport: Support = {
        id: '1',
        questionAttachments: [
          {
            id: 'qa1',
            fullUrl: 'https://example.com/question.pdf',
            name: 'question.pdf',
            originalName: 'question.pdf',
            placeHolder: 'test',
            resourceType: ResourceTypeEnum.AUTO,
            createdAt: new Date(),
            updatedAt: new Date(),
            deletedAt: null,
            hasId: jest.fn(),
            save: jest.fn(),
            remove: jest.fn(),
            softRemove: jest.fn(),
            recover: jest.fn(),
            reload: jest.fn(),
          },
        ],
        attachments: [
          {
            id: 'a1',
            fullUrl: 'https://example.com/answer.pdf',
            name: 'answer.pdf',
            originalName: 'answer.pdf',
            placeHolder: 'test',
            resourceType: ResourceTypeEnum.AUTO,
            createdAt: new Date(),
            updatedAt: new Date(),
            deletedAt: null,
            hasId: jest.fn(),
            save: jest.fn(),
            remove: jest.fn(),
            softRemove: jest.fn(),
            recover: jest.fn(),
            reload: jest.fn(),
          },
        ],
        question: 'Test question',
        subject: SupportSubjectEnum.OTHER,
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        category: SupportCategory.VISITOR,
        answeredAt: null,
        answeredBy: null,
        adminAnswer: null,
        askedBy: null,
        seenAt: null,
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

      mockSupportRepository.findOne.mockResolvedValue(mockSupport)

      // Create a mock archiver instance
      const mockArchiver = archiver('zip')
      const mockReadable = new Readable({
        read() {
          this.push(Buffer.from('test data'))
          this.push(null)
        },
      })

      // Mock archiver methods
      mockArchiver.append = jest.fn().mockReturnThis()
      mockArchiver.finalize = jest.fn().mockResolvedValue(undefined)
      mockArchiver.pipe = jest.fn().mockReturnValue(mockReadable)

      // Mock archiver.create
      jest.spyOn(archiver, 'create').mockReturnValue(mockArchiver)

      const result = await service.downloadAllAttachments('1')

      expect(result.stream).toBeDefined()
      expect(result.fileName).toBe('attachments.zip')
      expect(mockArchiver.append).toHaveBeenCalledTimes(2) // One for each attachment
    })

    it('should throw NotFoundException when support question not found', async () => {
      mockSupportRepository.findOne.mockResolvedValue(null)

      await expect(service.downloadAllAttachments('1')).rejects.toThrow(
        NotFoundException,
      )
    })
  })
})
