import { Test, TestingModule } from '@nestjs/testing'
import { FaqService } from './faq.service'
import { getRepositoryToken } from '@nestjs/typeorm'
import { Faq } from './entities'
import { Repository } from 'typeorm'
import { CreateFaqDto, UpdateFaqDto } from './dto'
import { NotFoundException } from '@nestjs/common'

describe('FaqService', () => {
  let service: FaqService
  let mockFaqRepository: Partial<Repository<Faq>>

  const mockFaq: Partial<Faq> = {
    id: 'faq-123',
    question: 'Test question?',
    answer: 'Test answer',
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  beforeEach(async () => {
    mockFaqRepository = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      remove: jest.fn(),
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FaqService,
        {
          provide: getRepositoryToken(Faq),
          useValue: mockFaqRepository,
        },
      ],
    }).compile()

    service = module.get<FaqService>(FaqService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('create', () => {
    it('should create a FAQ', async () => {
      const createFaqDto: CreateFaqDto = {
        question: 'Test question?',
        answer: 'Test answer',
      }

      mockFaqRepository.create = jest.fn().mockReturnValue(mockFaq)
      mockFaqRepository.save = jest.fn().mockResolvedValue(mockFaq)

      const result = await service.create(createFaqDto)

      expect(result).toEqual(mockFaq)
      expect(mockFaqRepository.create).toHaveBeenCalledWith(createFaqDto)
      expect(mockFaqRepository.save).toHaveBeenCalledWith(mockFaq)
    })
  })

  describe('update', () => {
    it('should update a FAQ', async () => {
      const faqId = 'faq-123'
      const updateFaqDto: UpdateFaqDto = {
        question: 'Updated question?',
        answer: 'Updated answer',
      }

      mockFaqRepository.findOne = jest.fn().mockResolvedValue(mockFaq)
      mockFaqRepository.save = jest
        .fn()
        .mockImplementation((faq) => Promise.resolve(faq))

      const result = await service.update(faqId, updateFaqDto)

      expect(result).toBeDefined()
      expect(mockFaqRepository.findOne).toHaveBeenCalledWith({
        where: { id: faqId },
      })
      expect(mockFaqRepository.save).toHaveBeenCalled()
      expect(result).toMatchObject(updateFaqDto)
    })

    it('should throw NotFoundException when FAQ not found', async () => {
      const faqId = 'non-existent'
      mockFaqRepository.findOne = jest.fn().mockResolvedValue(null)

      await expect(
        service.update(faqId, { question: 'test', answer: 'test' }),
      ).rejects.toThrow(NotFoundException)
    })
  })

  describe('getAll', () => {
    it('should return all FAQs', async () => {
      const mockFaqs = [mockFaq]
      mockFaqRepository.find = jest.fn().mockResolvedValue(mockFaqs)

      const result = await service.getAll()

      expect(result).toEqual(mockFaqs)
      expect(mockFaqRepository.find).toHaveBeenCalledWith({
        order: { createdAt: 'DESC' },
      })
    })
  })

  describe('delete', () => {
    it('should delete a FAQ', async () => {
      const faqId = 'faq-123'
      mockFaqRepository.findOne = jest.fn().mockResolvedValue(mockFaq)
      mockFaqRepository.remove = jest.fn().mockResolvedValue(mockFaq)

      const result = await service.delete(faqId)

      expect(result).toEqual({ message: 'FAQ deleted successfully' })
      expect(mockFaqRepository.findOne).toHaveBeenCalledWith({
        where: { id: faqId },
      })
      expect(mockFaqRepository.remove).toHaveBeenCalledWith(mockFaq)
    })

    it('should throw NotFoundException when FAQ not found', async () => {
      const faqId = 'non-existent'
      mockFaqRepository.findOne = jest.fn().mockResolvedValue(null)

      await expect(service.delete(faqId)).rejects.toThrow(NotFoundException)
    })
  })
})
