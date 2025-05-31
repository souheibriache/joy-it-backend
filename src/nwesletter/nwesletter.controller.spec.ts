import { Test, TestingModule } from '@nestjs/testing'
import { NwesletterController } from './nwesletter.controller'
import { NwesletterService } from './nwesletter.service'
import { NewsletterEmailDto } from './dto'
import { NewsletterOptionsDto } from './dto'
import { PageDto } from '@app/pagination/dto'
import { INewsLetter } from './interfaces/newsletter.interface'
import { Order } from '@app/pagination/constants'

describe('NwesletterController', () => {
  let controller: NwesletterController
  let service: NwesletterService

  const mockNewsletterService = {
    create: jest.fn(),
    getPaginated: jest.fn(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NwesletterController],
      providers: [
        {
          provide: NwesletterService,
          useValue: mockNewsletterService,
        },
      ],
    }).compile()

    controller = module.get<NwesletterController>(NwesletterController)
    service = module.get<NwesletterService>(NwesletterService)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })

  describe('create', () => {
    it('should create a newsletter subscription', async () => {
      const createNewsletterDto: NewsletterEmailDto = {
        email: 'test@example.com',
      }

      const mockNewsletter = {
        id: 'test-id',
        email: createNewsletterDto.email,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockNewsletterService.create.mockResolvedValue(mockNewsletter)

      const result = await controller.create(createNewsletterDto)

      expect(result).toEqual(mockNewsletter)
      expect(service.create).toHaveBeenCalledWith(createNewsletterDto)
    })
  })

  describe('getPaginatedNewsletter', () => {
    it('should return paginated newsletter subscriptions', async () => {
      const pageOptionsDto: NewsletterOptionsDto = {
        page: 1,
        take: 10,
        search: 'test',
        sort: { createdAt: Order.DESC },
      }

      const mockNewsletters: INewsLetter[] = [
        {
          id: 'test-id-1',
          email: 'test1@example.com',
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
          hasId: () => true,
          save: jest.fn(),
          remove: jest.fn(),
          softRemove: jest.fn(),
          recover: jest.fn(),
          reload: jest.fn(),
        },
        {
          id: 'test-id-2',
          email: 'test2@example.com',
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
          hasId: () => true,
          save: jest.fn(),
          remove: jest.fn(),
          softRemove: jest.fn(),
          recover: jest.fn(),
          reload: jest.fn(),
        },
      ]

      const mockPaginatedResponse: PageDto<INewsLetter> = {
        data: mockNewsletters,
        meta: {
          page: 1,
          take: 10,
          itemCount: 2,
          pageCount: 1,
          hasPreviousPage: false,
          hasNextPage: false,
        },
      }

      mockNewsletterService.getPaginated.mockResolvedValue(
        mockPaginatedResponse,
      )

      const result = await controller.getPaginatedNewsletter(pageOptionsDto)

      expect(result).toEqual(mockPaginatedResponse)
      expect(service.getPaginated).toHaveBeenCalledWith(pageOptionsDto)
    })
  })
})
