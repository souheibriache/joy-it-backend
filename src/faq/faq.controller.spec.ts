import { Test, TestingModule } from '@nestjs/testing'
import { FaqController } from './faq.controller'
import { FaqService } from './faq.service'
import { CreateFaqDto, UpdateFaqDto } from './dto'

describe('FaqController', () => {
  let controller: FaqController
  let faqService: FaqService

  const mockFaqService = {
    create: jest.fn(),
    update: jest.fn(),
    getAll: jest.fn(),
    delete: jest.fn(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FaqController],
      providers: [
        {
          provide: FaqService,
          useValue: mockFaqService,
        },
      ],
    }).compile()

    controller = module.get<FaqController>(FaqController)
    faqService = module.get<FaqService>(FaqService)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })

  describe('createFaq', () => {
    const createFaqDto: CreateFaqDto = {
      question: 'Test question?',
      answer: 'Test answer',
    }

    it('should create a new FAQ', async () => {
      const expectedResult = {
        id: 'faq-123',
        ...createFaqDto,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockFaqService.create.mockResolvedValue(expectedResult)

      const result = await controller.createFaq(createFaqDto)

      expect(result).toBe(expectedResult)
      expect(mockFaqService.create).toHaveBeenCalledWith(createFaqDto)
    })
  })

  describe('updateFaq', () => {
    const faqId = 'faq-123'
    const updateFaqDto: UpdateFaqDto = {
      question: 'Updated question?',
      answer: 'Updated answer',
    }

    it('should update an existing FAQ', async () => {
      const expectedResult = {
        id: faqId,
        ...updateFaqDto,
        updatedAt: new Date(),
      }

      mockFaqService.update.mockResolvedValue(expectedResult)

      const result = await controller.updateFaq(faqId, updateFaqDto)

      expect(result).toBe(expectedResult)
      expect(mockFaqService.update).toHaveBeenCalledWith(faqId, updateFaqDto)
    })
  })

  describe('getAllFaqs', () => {
    it('should return an array of FAQs', async () => {
      const expectedResult = [
        {
          id: 'faq-1',
          question: 'Question 1?',
          answer: 'Answer 1',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'faq-2',
          question: 'Question 2?',
          answer: 'Answer 2',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]

      mockFaqService.getAll.mockResolvedValue(expectedResult)

      const result = await controller.getAllFaqs()

      expect(result).toBe(expectedResult)
      expect(mockFaqService.getAll).toHaveBeenCalled()
    })
  })

  describe('deleteFaq', () => {
    const faqId = 'faq-123'

    it('should delete an FAQ', async () => {
      const expectedResult = { message: 'FAQ deleted successfully' }

      mockFaqService.delete.mockResolvedValue(expectedResult)

      const result = await controller.deleteFaq(faqId)

      expect(result).toBe(expectedResult)
      expect(mockFaqService.delete).toHaveBeenCalledWith(faqId)
    })
  })
})
