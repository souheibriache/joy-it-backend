import { Test, TestingModule } from '@nestjs/testing'
import { SupportVisitorController } from './support-visitor.controller'
import { SupportService } from './support.service'
import { PostQuestionVisitorDto } from './dto'
import { PostQuestionUserDto } from './dto/post-question-user.dto'
import { SupportCategory } from './enums/support-category.enum'
import { Request } from 'express'
import { IRequestWithUser } from '@app/common/interfaces/request-user.interface.dto'

describe('SupportVisitorController', () => {
  let controller: SupportVisitorController
  let supportService: SupportService

  const mockSupportService = {
    postQuestion: jest.fn(),
    postQuestionByUser: jest.fn(),
  }

  const mockQuestionAttachments: Express.Multer.File[] = [
    {
      fieldname: 'questionAttachments',
      originalname: 'test.pdf',
      encoding: '7bit',
      mimetype: 'application/pdf',
      size: 1024,
      destination: '/tmp',
      filename: 'test-123.pdf',
      path: '/tmp/test-123.pdf',
      buffer: Buffer.from('test'),
      stream: null,
    },
  ]

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SupportVisitorController],
      providers: [
        {
          provide: SupportService,
          useValue: mockSupportService,
        },
      ],
    }).compile()

    controller = module.get<SupportVisitorController>(SupportVisitorController)
    supportService = module.get<SupportService>(SupportService)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })

  describe('postQuestion', () => {
    const mockPostQuestionDto: PostQuestionVisitorDto = {
      email: 'test@example.com',
      firstName: 'John',
      lastName: 'Doe',
      phoneNumber: '+1234567890',
      subject: 'Test Subject',
      question: 'Test Question',
      companyName: 'Test Company',
    }

    it('should successfully post a question without attachments', async () => {
      const expectedResponse = {
        id: 'question-123',
        ...mockPostQuestionDto,
        category: SupportCategory.VISITOR,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockSupportService.postQuestion.mockResolvedValue(expectedResponse)

      const result = await controller.postQuestion(mockPostQuestionDto, [])

      expect(result).toEqual(expectedResponse)
      expect(mockSupportService.postQuestion).toHaveBeenCalledWith({
        ...mockPostQuestionDto,
        questionAttachments: [],
      })
    })

    it('should successfully post a question with attachments', async () => {
      const expectedResponse = {
        id: 'question-123',
        ...mockPostQuestionDto,
        category: SupportCategory.VISITOR,
        questionAttachments: mockQuestionAttachments,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockSupportService.postQuestion.mockResolvedValue(expectedResponse)

      const result = await controller.postQuestion(
        mockPostQuestionDto,
        mockQuestionAttachments,
      )

      expect(result).toEqual(expectedResponse)
      expect(mockSupportService.postQuestion).toHaveBeenCalledWith({
        ...mockPostQuestionDto,
        questionAttachments: mockQuestionAttachments,
      })
    })
  })

  describe('postUserQuestion', () => {
    const mockPostUserQuestionDto: PostQuestionUserDto = {
      subject: 'Test Subject',
      question: 'Test Question',
    }

    const mockRequest = {
      user: {
        id: 'user-123',
        email: 'user@example.com',
      },
    } as IRequestWithUser

    it('should successfully post a question for authenticated user without attachments', async () => {
      const expectedResponse = {
        id: 'question-123',
        ...mockPostUserQuestionDto,
        category: SupportCategory.VISITOR,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockSupportService.postQuestionByUser.mockResolvedValue(expectedResponse)

      const result = await controller.postUserQuestion(
        mockPostUserQuestionDto,
        mockRequest,
        [],
      )

      expect(result).toEqual(expectedResponse)
      expect(mockSupportService.postQuestionByUser).toHaveBeenCalledWith(
        {
          ...mockPostUserQuestionDto,
          questionAttachments: [],
        },
        mockRequest.user.id,
      )
    })

    it('should successfully post a question for authenticated user with attachments', async () => {
      const expectedResponse = {
        id: 'question-123',
        ...mockPostUserQuestionDto,
        category: SupportCategory.VISITOR,
        questionAttachments: mockQuestionAttachments,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockSupportService.postQuestionByUser.mockResolvedValue(expectedResponse)

      const result = await controller.postUserQuestion(
        mockPostUserQuestionDto,
        mockRequest,
        mockQuestionAttachments,
      )

      expect(result).toEqual(expectedResponse)
      expect(mockSupportService.postQuestionByUser).toHaveBeenCalledWith(
        {
          ...mockPostUserQuestionDto,
          questionAttachments: mockQuestionAttachments,
        },
        mockRequest.user.id,
      )
    })
  })
})
