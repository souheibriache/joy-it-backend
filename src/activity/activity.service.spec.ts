import { Test, TestingModule } from '@nestjs/testing'
import { ActivityService } from './activity.service'
import { getRepositoryToken } from '@nestjs/typeorm'
import { Activity } from './entities/activity.entity'
import { ActivityImage } from './entities/activity-image.entity'
import { Repository, Brackets } from 'typeorm'
import { NotFoundException } from '@nestjs/common'
import {
  CreateActivityDto,
  updateActivityDto,
  UpdateActivityImagesDto,
  UpdateActivityMainImageDto,
  ActivityOptionsDto,
} from './dto'
import { ActivityType } from './enums/activity-type.enum'
import { CloudinaryResponse } from '@app/upload/types/cloudinary-response.type'
import { PageDto, PageMetaDto } from '@app/pagination/dto'
import { Order } from '@app/pagination/constants'
import { ResourceTypeEnum } from '@app/media/enums/resource-type.enum'

describe('ActivityService', () => {
  let service: ActivityService
  let activityRepository: Repository<Activity>
  let activityImageRepository: Repository<ActivityImage>

  const mockActivityRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    createQueryBuilder: jest.fn(),
  }

  const mockActivityImageRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ActivityService,
        {
          provide: getRepositoryToken(Activity),
          useValue: mockActivityRepository,
        },
        {
          provide: getRepositoryToken(ActivityImage),
          useValue: mockActivityImageRepository,
        },
      ],
    }).compile()

    service = module.get<ActivityService>(ActivityService)
    activityRepository = module.get<Repository<Activity>>(
      getRepositoryToken(Activity),
    )
    activityImageRepository = module.get<Repository<ActivityImage>>(
      getRepositoryToken(ActivityImage),
    )
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('create', () => {
    const createActivityDto: CreateActivityDto = {
      name: 'Test Activity',
      description: 'Test Description',
      type: ActivityType.TEAM_BUILDING,
      duration: 120,
      city: 'Test City',
      address: 'Test Address',
      postalCode: '12345',
      keyWords: ['test', 'activity'],
      mainImageIndex: 0,
      participants: 10,
      isAvailable: true,
      isInsideCompany: false,
    }

    const mockUploadedFiles: CloudinaryResponse[] = [
      {
        url: 'http://test.com/image1.jpg',
        original_filename: 'image1',
        display_name: 'Image 1',
        placeholder: 'placeholder1',
        resource_type: ResourceTypeEnum.IMAGE,
        message: 'Upload successful',
        name: 'test1.jpg',
        http_code: 200,
        severity: 'info',
      },
      {
        url: 'http://test.com/image2.jpg',
        original_filename: 'image2',
        display_name: 'Image 2',
        placeholder: 'placeholder2',
        resource_type: ResourceTypeEnum.IMAGE,
        message: 'Upload successful',
        name: 'test2.jpg',
        http_code: 200,
        severity: 'info',
      },
    ]

    const mockActivity = {
      ...createActivityDto,
      id: 'test-id',
      images: [],
      save: jest.fn(),
    }

    it('should create an activity with images', async () => {
      mockActivityRepository.create.mockReturnValue(mockActivity)
      mockActivityRepository.save.mockResolvedValue(mockActivity)
      mockActivity.save.mockResolvedValue(mockActivity)

      const mockImage = {
        id: 'image-id',
        fullUrl: mockUploadedFiles[0].url,
        isMain: true,
        activity: mockActivity,
        originalName: mockUploadedFiles[0].original_filename,
        name: mockUploadedFiles[0].display_name,
        placeHolder: mockUploadedFiles[0].placeholder,
        resourceType: mockUploadedFiles[0].resource_type,
      }

      mockActivityImageRepository.create.mockReturnValue(mockImage)
      mockActivityImageRepository.save.mockResolvedValue(mockImage)

      const result = await service.create(createActivityDto, mockUploadedFiles)

      expect(result).toBeDefined()
      expect(mockActivityRepository.create).toHaveBeenCalledWith(
        createActivityDto,
      )
      expect(mockActivityRepository.save).toHaveBeenCalled()
      expect(mockActivityImageRepository.create).toHaveBeenCalled()
      expect(mockActivityImageRepository.save).toHaveBeenCalled()
    })

    it('should handle image creation failure', async () => {
      mockActivityRepository.create.mockReturnValue(mockActivity)
      mockActivityRepository.save.mockResolvedValue(mockActivity)
      mockActivity.save.mockResolvedValue(mockActivity)

      mockActivityImageRepository.create.mockReturnValue({})
      mockActivityImageRepository.save.mockRejectedValue(
        new Error('Failed to save image'),
      )

      await expect(
        service.create(createActivityDto, mockUploadedFiles),
      ).rejects.toThrow('Failed to save image')
    })

    it('should handle activity creation without images', async () => {
      mockActivityRepository.create.mockReturnValue(mockActivity)
      mockActivityRepository.save.mockResolvedValue(mockActivity)
      mockActivity.save.mockResolvedValue(mockActivity)

      const result = await service.create(createActivityDto, [])

      expect(result).toBeDefined()
      expect(result.images).toEqual([])
      expect(mockActivityImageRepository.create).not.toHaveBeenCalled()
      expect(mockActivityImageRepository.save).not.toHaveBeenCalled()
    })
  })

  describe('find', () => {
    it('should return an array of activities', async () => {
      const mockActivities = [
        { id: '1', name: 'Activity 1' },
        { id: '2', name: 'Activity 2' },
      ]

      mockActivityRepository.find.mockResolvedValue(mockActivities)

      const result = await service.find()

      expect(result).toEqual(mockActivities)
      expect(mockActivityRepository.find).toHaveBeenCalled()
    })

    it('should return activities with specified relations', async () => {
      const mockActivities = [
        { id: '1', name: 'Activity 1', images: [] },
        { id: '2', name: 'Activity 2', images: [] },
      ]

      mockActivityRepository.find.mockResolvedValue(mockActivities)

      const result = await service.find(undefined, { images: true })

      expect(result).toEqual(mockActivities)
      expect(mockActivityRepository.find).toHaveBeenCalledWith({
        where: undefined,
        relations: { images: true },
        order: undefined,
      })
    })
  })

  describe('findOne', () => {
    it('should return an activity', async () => {
      const mockActivity = { id: '1', name: 'Activity 1' }

      mockActivityRepository.findOne.mockResolvedValue(mockActivity)

      const result = await service.findOne({ id: '1' })

      expect(result).toEqual(mockActivity)
      expect(mockActivityRepository.findOne).toHaveBeenCalledWith({
        where: { id: '1' },
        relations: undefined,
        order: undefined,
      })
    })

    it('should throw NotFoundException when activity not found', async () => {
      mockActivityRepository.findOne.mockResolvedValue(null)

      await expect(service.findOne({ id: '1' })).rejects.toThrow(
        NotFoundException,
      )
    })
  })

  describe('update', () => {
    const updateDto: updateActivityDto = {
      name: 'Updated Activity',
      description: 'Updated Description',
    }

    it('should update an activity', async () => {
      const mockActivity = {
        id: '1',
        name: 'Activity 1',
        images: [],
      }

      mockActivityRepository.findOne.mockResolvedValue(mockActivity)
      mockActivityRepository.update.mockResolvedValue({ affected: 1 })
      mockActivityRepository.findOne.mockResolvedValue({
        ...mockActivity,
        ...updateDto,
      })

      const result = await service.update('1', updateDto)

      expect(result).toBeDefined()
      expect(mockActivityRepository.update).toHaveBeenCalledWith('1', updateDto)
    })

    it('should throw NotFoundException when activity not found', async () => {
      mockActivityRepository.findOne.mockResolvedValue(null)

      await expect(service.update('1', updateDto)).rejects.toThrow(
        NotFoundException,
      )
    })
  })

  describe('delete', () => {
    it('should delete an activity', async () => {
      const mockActivity = { id: '1', name: 'Activity 1' }

      mockActivityRepository.findOne.mockResolvedValue(mockActivity)
      mockActivityRepository.delete.mockResolvedValue({ affected: 1 })

      const result = await service.delete('1')

      expect(result).toBe(true)
      expect(mockActivityRepository.delete).toHaveBeenCalledWith('1')
    })

    it('should throw NotFoundException when activity not found', async () => {
      mockActivityRepository.findOne.mockResolvedValue(null)

      await expect(service.delete('1')).rejects.toThrow(NotFoundException)
    })
  })

  describe('getPaginatedActivities', () => {
    const mockQueryBuilder = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn(),
    }

    const activityOptionsDto = new ActivityOptionsDto()
    Object.assign(activityOptionsDto, {
      page: 1,
      take: 10,
      search: 'test',
      types: [ActivityType.TEAM_BUILDING],
      durationMin: 60,
      durationMax: 120,
      isAvailable: true,
      sort: {
        createdAt: Order.DESC,
      },
    })

    beforeEach(() => {
      mockActivityRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder,
      )
    })

    it('should return paginated activities', async () => {
      const mockActivities = [
        { id: '1', name: 'Activity 1' },
        { id: '2', name: 'Activity 2' },
      ]

      mockQueryBuilder.getManyAndCount.mockResolvedValue([mockActivities, 2])

      const result = await service.getPaginatedActivities(activityOptionsDto)

      expect(result).toBeInstanceOf(PageDto)
      expect(result.data).toEqual(mockActivities)
      expect(result.meta).toBeInstanceOf(PageMetaDto)
      expect(mockActivityRepository.createQueryBuilder).toHaveBeenCalledWith(
        'activity',
      )
    })

    it('should apply search filters correctly', async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0])

      await service.getPaginatedActivities(activityOptionsDto)

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        expect.any(Brackets),
      )
    })

    it('should apply types filter correctly', async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0])

      await service.getPaginatedActivities(activityOptionsDto)

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'activity.type = ANY(:types)',
        { types: activityOptionsDto.types },
      )
    })

    it('should apply duration filters correctly', async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0])

      await service.getPaginatedActivities(activityOptionsDto)

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'activity.duration >= :durationMin',
        { durationMin: activityOptionsDto.durationMin },
      )
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'activity.duration <= :durationMax',
        { durationMax: activityOptionsDto.durationMax },
      )
    })
  })

  describe('updateMainImage', () => {
    const updateMainImageDto: UpdateActivityMainImageDto = {
      imageId: 'test-image-id',
    }

    it('should update main image successfully', async () => {
      const mockImage = {
        id: updateMainImageDto.imageId,
        isMain: false,
        save: jest
          .fn()
          .mockResolvedValue({ id: updateMainImageDto.imageId, isMain: true }),
      }

      mockActivityImageRepository.findOne.mockResolvedValue(mockImage)
      mockActivityImageRepository.update.mockResolvedValue({ affected: 1 })

      const result = await service.updateMainImage(
        'test-activity-id',
        updateMainImageDto,
      )

      expect(result.isMain).toBe(true)
      expect(mockActivityImageRepository.update).toHaveBeenCalledWith(
        { activity: { id: 'test-activity-id' } },
        { isMain: false },
      )
    })

    it('should throw NotFoundException when image not found', async () => {
      mockActivityImageRepository.findOne.mockResolvedValue(null)

      await expect(
        service.updateMainImage('test-activity-id', updateMainImageDto),
      ).rejects.toThrow(NotFoundException)
    })
  })

  describe('queryActivities', () => {
    const mockQueryBuilder = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn(),
    }

    beforeEach(() => {
      mockActivityRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder,
      )
    })

    it('should handle empty search results', async () => {
      const activityOptionsDto = new ActivityOptionsDto()
      Object.assign(activityOptionsDto, {
        page: 1,
        take: 10,
        search: 'nonexistent',
      })

      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0])

      const result = await service.getPaginatedActivities(activityOptionsDto)

      expect(result).toBeInstanceOf(PageDto)
      expect(result.data).toEqual([])
      expect(result.meta.itemCount).toBe(0)
      expect(result.meta.pageCount).toBe(0)
    })

    it('should handle multiple sort criteria', async () => {
      const activityOptionsDto = new ActivityOptionsDto()
      Object.assign(activityOptionsDto, {
        page: 1,
        take: 10,
        sort: {
          createdAt: Order.DESC,
          name: Order.ASC,
        },
      })

      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0])

      await service.getPaginatedActivities(activityOptionsDto)

      expect(mockQueryBuilder.addOrderBy).toHaveBeenCalledTimes(2)
    })

    it('should handle special characters in search term', async () => {
      const activityOptionsDto = new ActivityOptionsDto()
      Object.assign(activityOptionsDto, {
        page: 1,
        take: 10,
        search: "test's activity",
      })

      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0])

      await service.getPaginatedActivities(activityOptionsDto)

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        expect.any(Brackets),
      )
    })
  })

  describe('deleteImage', () => {
    it('should delete an activity image', async () => {
      const mockActivity = {
        id: '1',
        name: 'Activity 1',
        images: [{ id: 'img1' }],
      }

      mockActivityRepository.findOne.mockResolvedValue(mockActivity)
      mockActivityImageRepository.delete.mockResolvedValue({ affected: 1 })

      const result = await service.deleteImage('1', 'img1')

      expect(result).toBe(true)
      expect(mockActivityImageRepository.delete).toHaveBeenCalledWith('img1')
    })

    it('should throw NotFoundException when image not found', async () => {
      mockActivityRepository.findOne.mockResolvedValue(null)

      await expect(service.deleteImage('1', 'img1')).rejects.toThrow(
        NotFoundException,
      )
    })
  })
})
