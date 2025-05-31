import { Test, TestingModule } from '@nestjs/testing'
import { NwesletterService } from './nwesletter.service'
import { getRepositoryToken } from '@nestjs/typeorm'
import { Newsletter } from './entities'
import { Repository } from 'typeorm'
import { NewsletterEmailDto, NewsletterOptionsDto } from './dto'
import { BadRequestException } from '@nestjs/common'
import { PageDto, PageMetaDto } from '@app/pagination/dto'

describe('NwesletterService', () => {
  let service: NwesletterService
  let newsletterRepository: Repository<Newsletter>

  const mockNewsletterRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    findAndCount: jest.fn(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NwesletterService,
        {
          provide: getRepositoryToken(Newsletter),
          useValue: mockNewsletterRepository,
        },
      ],
    }).compile()

    service = module.get<NwesletterService>(NwesletterService)
    newsletterRepository = module.get<Repository<Newsletter>>(
      getRepositoryToken(Newsletter),
    )
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('create', () => {
    const createNewsletterDto: NewsletterEmailDto = {
      email: 'test@example.com',
    }

    it('should create a new newsletter subscription', async () => {
      const mockNewsletter = {
        id: 'test-id',
        email: createNewsletterDto.email,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockNewsletterRepository.findOne.mockResolvedValue(null)
      mockNewsletterRepository.create.mockReturnValue(mockNewsletter)
      mockNewsletterRepository.save.mockResolvedValue(mockNewsletter)

      const result = await service.create(createNewsletterDto)

      expect(result).toEqual(mockNewsletter)
      expect(newsletterRepository.findOne).toHaveBeenCalledWith({
        where: { email: createNewsletterDto.email },
      })
      expect(newsletterRepository.create).toHaveBeenCalledWith({
        email: createNewsletterDto.email.trim().toLowerCase(),
      })
      expect(newsletterRepository.save).toHaveBeenCalledWith(mockNewsletter)
    })

    it('should return existing newsletter if email already exists', async () => {
      const existingNewsletter = {
        id: 'existing-id',
        email: 'test@example.com',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockNewsletterRepository.findOne.mockResolvedValue(existingNewsletter)

      const result = await service.create(createNewsletterDto)

      expect(result).toEqual(existingNewsletter)
      expect(newsletterRepository.findOne).toHaveBeenCalledWith({
        where: { email: createNewsletterDto.email },
      })
      expect(newsletterRepository.create).not.toHaveBeenCalled()
      expect(newsletterRepository.save).not.toHaveBeenCalled()
    })
  })

  describe('getPaginated', () => {
    const mockPaginationOptions: NewsletterOptionsDto = {
      page: 1,
      take: 10,
      skip: 0,
      search: 'test',
    }

    it('should return paginated newsletter subscriptions', async () => {
      const mockNewsletters = [
        {
          id: 'test-id-1',
          email: 'test1@example.com',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'test-id-2',
          email: 'test2@example.com',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]

      mockNewsletterRepository.findAndCount.mockResolvedValue([
        mockNewsletters,
        mockNewsletters.length,
      ])

      const result = await service.getPaginated(mockPaginationOptions)

      expect(result.data).toEqual(mockNewsletters)
      expect(result.meta.itemCount).toBe(mockNewsletters.length)
      expect(result.meta.page).toBe(mockPaginationOptions.page)
      expect(result.meta.take).toBe(mockPaginationOptions.take)
      expect(newsletterRepository.findAndCount).toHaveBeenCalledWith({
        where: { email: expect.any(Object) },
        order: undefined,
        take: mockPaginationOptions.take,
        skip: mockPaginationOptions.skip,
      })
    })
  })
})
