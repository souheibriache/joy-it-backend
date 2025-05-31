import { Test, TestingModule } from '@nestjs/testing'
import { SupportController } from './support.controller'
import { SupportService } from './support.service'
import { UserService } from 'src/user/user.service'
import { Support } from './entities'
import { AnswerSupportQuestionDto, SupportOptionsDto } from './dto'
import { AccessTokenGuard } from 'src/auth/guards/access-token.guard'
import { SuperUserGuard } from 'src/auth/guards/super-user.guard'
import { User } from 'src/user/entities'
import { Readable } from 'stream'
import { Response } from 'express'
import { Order } from '@app/pagination/constants'

describe('SupportController', () => {
  let controller: SupportController
  let supportService: SupportService
  let userService: UserService

  const mockSupportService = {
    getAllSupports: jest.fn(),
    getSupportById: jest.fn(),
    answerSupportQuestion: jest.fn(),
    downloadAllAttachments: jest.fn(),
  }

  const mockUserService = {
    findOne: jest.fn(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SupportController],
      providers: [
        {
          provide: SupportService,
          useValue: mockSupportService,
        },
        {
          provide: UserService,
          useValue: mockUserService,
        },
      ],
    })
      .overrideGuard(AccessTokenGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(SuperUserGuard)
      .useValue({ canActivate: () => true })
      .compile()

    controller = module.get<SupportController>(SupportController)
    supportService = module.get<SupportService>(SupportService)
    userService = module.get<UserService>(UserService)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })

  describe('getAllSupportQuestions', () => {
    it('should return paginated support questions', async () => {
      const mockOptionsDto: SupportOptionsDto = {
        page: 1,
        take: 10,
        skip: 0,
        sort: {
          createdAt: Order.ASC,
        },
      }

      const mockResult = {
        data: [
          {
            id: '1',
            question: 'Test question',
            email: 'test@example.com',
          },
        ],
        meta: {
          page: 1,
          take: 10,
          itemCount: 1,
          pageCount: 1,
          hasPreviousPage: false,
          hasNextPage: false,
        },
      }

      mockSupportService.getAllSupports.mockResolvedValue(mockResult)

      const result = await controller.getAllSupportQuestions(mockOptionsDto)

      expect(result).toEqual(mockResult)
      expect(mockSupportService.getAllSupports).toHaveBeenCalledWith(
        mockOptionsDto,
      )
    })
  })

  describe('findOne', () => {
    it('should return a single support question', async () => {
      const mockSupport = {
        id: '1',
        question: 'Test question',
        email: 'test@example.com',
      }

      mockSupportService.getSupportById.mockResolvedValue(mockSupport)

      const result = await controller.findOne('1')

      expect(result).toEqual(mockSupport)
      expect(mockSupportService.getSupportById).toHaveBeenCalledWith('1')
    })
  })

  describe('answerSupportQuestion', () => {
    const mockAnswerDto: AnswerSupportQuestionDto = {
      adminAnswer: 'Test answer',
    }

    const mockUser: Partial<User> = {
      id: '1',
      email: 'admin@example.com',
    }

    const mockAttachments = [
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
    ]

    it('should answer a support question with attachments', async () => {
      const mockSupport = {
        id: '1',
        question: 'Test question',
        adminAnswer: mockAnswerDto.adminAnswer,
        answeredBy: mockUser,
      }

      mockUserService.findOne.mockResolvedValue(mockUser)
      mockSupportService.answerSupportQuestion.mockResolvedValue(mockSupport)

      const result = await controller.answerSupportQuestion(
        { user: mockUser } as any,
        mockAnswerDto,
        '1',
        mockAttachments,
      )

      expect(result).toEqual(mockSupport)
      expect(mockUserService.findOne).toHaveBeenCalledWith({
        where: { id: mockUser.id },
      })
      expect(mockSupportService.answerSupportQuestion).toHaveBeenCalledWith(
        '1',
        { ...mockAnswerDto, attachments: mockAttachments },
        mockUser,
      )
    })
  })

  describe('downloadAllAttachments', () => {
    it('should download attachments as zip', async () => {
      const mockStream = new Readable()
      const mockFileName = 'attachments.zip'
      const mockResponse = {
        set: jest.fn(),
        pipe: jest.fn(),
      } as unknown as Response

      mockSupportService.downloadAllAttachments.mockResolvedValue({
        stream: mockStream,
        fileName: mockFileName,
      })

      await controller.downloadAllAttachments('1', 'all', mockResponse)

      expect(mockResponse.set).toHaveBeenCalledWith({
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${mockFileName}"`,
      })
      expect(mockStream.pipe).toHaveBeenCalledWith(mockResponse)
      expect(mockSupportService.downloadAllAttachments).toHaveBeenCalledWith(
        '1',
        'all',
      )
    })
  })
})
