import { Test, TestingModule } from '@nestjs/testing'
import { MediaService } from './media.service'
import { getRepositoryToken } from '@nestjs/typeorm'
import { Media } from './entities'
import { Repository } from 'typeorm'
import { CreateMediaDto } from './dto/create-media.dto'
import { ResourceTypeEnum } from './enums/resource-type.enum'
import { NotFoundException } from '@nestjs/common'

describe('MediaService', () => {
  let service: MediaService
  let mediaRepository: Repository<Media>

  const mockMediaRepository = {
    create: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MediaService,
        {
          provide: getRepositoryToken(Media),
          useValue: mockMediaRepository,
        },
      ],
    }).compile()

    service = module.get<MediaService>(MediaService)
    mediaRepository = module.get<Repository<Media>>(getRepositoryToken(Media))
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('create', () => {
    const createMediaDto: CreateMediaDto = {
      name: 'test.jpg',
      originalName: 'test',
      fullUrl: 'http://test.com/image.jpg',
      placeHolder: 'Test Image',
      resourceType: ResourceTypeEnum.IMAGE,
    }

    const mockMedia = {
      id: 'test-id',
      ...createMediaDto,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    it('should create a new media', async () => {
      mockMediaRepository.create.mockReturnValue(mockMedia)
      mockMediaRepository.save.mockResolvedValue(mockMedia)

      const result = await service.create(createMediaDto)

      expect(result).toEqual(mockMedia)
      expect(mediaRepository.create).toHaveBeenCalledWith(createMediaDto)
      expect(mediaRepository.save).toHaveBeenCalledWith(mockMedia)
    })
  })

  describe('delete', () => {
    const mediaId = 'test-id'

    it('should delete a media', async () => {
      mockMediaRepository.delete.mockResolvedValue({ affected: 1 })

      const result = await service.delete(mediaId)

      expect(result).toBe(true)
      expect(mediaRepository.delete).toHaveBeenCalledWith(mediaId)
    })

    it('should throw NotFoundException if media not found', async () => {
      mockMediaRepository.delete.mockResolvedValue({ affected: 0 })

      await expect(service.delete(mediaId)).rejects.toThrow(NotFoundException)
      expect(mediaRepository.delete).toHaveBeenCalledWith(mediaId)
    })
  })
})
