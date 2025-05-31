import { Test, TestingModule } from '@nestjs/testing'
import { ActivityController } from './activity.controller'
import { ActivityService } from './activity.service'
import { UploadService } from '@app/upload'
import { getRepositoryToken } from '@nestjs/typeorm'
import { Activity } from './entities/activity.entity'
import { ActivityImage } from './entities/activity-image.entity'
import {
  CreateActivityDto,
  updateActivityDto,
  UpdateActivityImagesDto,
  UpdateActivityMainImageDto,
} from './dto'
import { CloudinaryResponse } from '@app/upload/types/cloudinary-response.type'
import { ActivityType } from './enums/activity-type.enum'
import { Order } from '@app/pagination/constants'
import { NotFoundException } from '@nestjs/common'

describe('ActivityController', () => {
  let controller: ActivityController
  let activityService: ActivityService
  let uploadService: UploadService

  const mockActivityService = {
    create: jest.fn(),
    update: jest.fn(),
    updateMainImage: jest.fn(),
    updateImages: jest.fn(),
    delete: jest.fn(),
    deleteImage: jest.fn(),
    findOne: jest.fn(),
    getPaginatedActivities: jest.fn(),
  }

  const mockUploadService = {
    uploadMany: jest.fn(),
  }

  const mockActivityRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  }

  const mockActivityImageRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ActivityController],
      providers: [
        {
          provide: ActivityService,
          useValue: mockActivityService,
        },
        {
          provide: UploadService,
          useValue: mockUploadService,
        },
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

    controller = module.get<ActivityController>(ActivityController)
    activityService = module.get<ActivityService>(ActivityService)
    uploadService = module.get<UploadService>(UploadService)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })

  describe('create', () => {
    const createActivityDto: CreateActivityDto = {
      name: 'Test Activity',
      description: 'Test Description',
      duration: 2,
      participants: 5,
      type: ActivityType.TEAM_BUILDING,
      keyWords: [],
      isAvailable: true,
      isInsideCompany: false,
      mainImageIndex: 0,
    }

    const mockFile = {
      fieldname: 'images',
      originalname: 'test.jpg',
      encoding: '7bit',
      mimetype: 'image/jpeg',
      buffer: Buffer.from('test'),
      size: 1024,
      stream: null,
      destination: '',
      filename: 'test.jpg',
      path: '/tmp/test.jpg',
    } as Express.Multer.File

    const mockUploadedFiles: CloudinaryResponse[] = [
      {
        message: 'Upload successful',
        name: 'test.jpg',
        http_code: 200,
        severity: 'info',
        asset_id: 'test-asset',
        public_id: 'test-public',
        version: 1,
        version_id: 'test-version',
        signature: 'test-signature',
        width: 100,
        height: 100,
        format: 'jpg',
        resource_type: 'image',
        created_at: new Date().toISOString(),
        tags: [],
        bytes: 1024,
        type: 'upload',
        etag: 'test-etag',
        placeholder: false,
        url: 'http://test.com/image.jpg',
        secure_url: 'https://test.com/image.jpg',
        folder: 'activities',
        original_filename: 'test',
      },
    ]

    it('should create a new activity with images', async () => {
      const expectedResult = {
        id: 'activity-123',
        ...createActivityDto,
        images: mockUploadedFiles.map((file) => ({
          id: 'image-123',
          url: file.secure_url,
          publicId: file.public_id,
        })),
      }

      mockUploadService.uploadMany.mockResolvedValue(mockUploadedFiles)
      mockActivityService.create.mockResolvedValue(expectedResult)

      const result = await controller.create(createActivityDto, [mockFile])

      expect(result).toEqual(expectedResult)
      expect(mockUploadService.uploadMany).toHaveBeenCalledWith(
        [mockFile],
        'activities',
      )
      expect(mockActivityService.create).toHaveBeenCalledWith(
        createActivityDto,
        mockUploadedFiles,
      )
    })

    it('should handle file upload failure', async () => {
      const uploadError = new Error('Upload failed')
      mockUploadService.uploadMany.mockRejectedValue(uploadError)

      await expect(
        controller.create(createActivityDto, [mockFile]),
      ).rejects.toThrow(uploadError)

      expect(mockActivityService.create).not.toHaveBeenCalled()
    })

    it('should handle empty file array', async () => {
      const expectedResult = {
        id: 'activity-123',
        ...createActivityDto,
        images: [],
      }

      mockActivityService.create.mockResolvedValue(expectedResult)

      const result = await controller.create(createActivityDto, [])

      expect(result).toEqual(expectedResult)
      expect(mockUploadService.uploadMany).not.toHaveBeenCalled()
      expect(mockActivityService.create).toHaveBeenCalledWith(
        createActivityDto,
        [],
      )
    })
  })

  describe('update', () => {
    const activityId = 'activity-123'
    const updateActivityDto: updateActivityDto = {
      name: 'Updated Activity',
      description: 'Updated Description',
    }

    it('should update an activity', async () => {
      const expectedResult = {
        id: activityId,
        ...updateActivityDto,
      }

      mockActivityService.update.mockResolvedValue(expectedResult)

      const result = await controller.update(updateActivityDto, activityId)

      expect(result).toEqual(expectedResult)
      expect(mockActivityService.update).toHaveBeenCalledWith(
        activityId,
        updateActivityDto,
      )
    })
  })

  describe('updateMainImage', () => {
    const activityId = 'activity-123'
    const updateMainImageDto: UpdateActivityMainImageDto = {
      imageId: 'image-123',
    }

    it('should update the main image of an activity', async () => {
      const expectedResult = {
        id: activityId,
        mainImage: {
          id: updateMainImageDto.imageId,
          url: 'https://test.com/image.jpg',
        },
      }

      mockActivityService.updateMainImage.mockResolvedValue(expectedResult)

      const result = await controller.updateMainImage(
        updateMainImageDto,
        activityId,
      )

      expect(result).toEqual(expectedResult)
      expect(mockActivityService.updateMainImage).toHaveBeenCalledWith(
        activityId,
        updateMainImageDto,
      )
    })
  })

  describe('updateActivityImages', () => {
    const activityId = 'activity-123'
    const updateImagesDto: UpdateActivityImagesDto = {
      mainImageIndex: 0,
      retainedImageIds: ['image-1', 'image-2'],
    }

    const mockFile = {
      fieldname: 'images',
      originalname: 'test.jpg',
      encoding: '7bit',
      mimetype: 'image/jpeg',
      buffer: Buffer.from('test'),
      size: 1024,
      stream: null,
      destination: '',
      filename: 'test.jpg',
      path: '/tmp/test.jpg',
    } as Express.Multer.File

    const mockUploadedFiles: CloudinaryResponse[] = [
      {
        message: 'Upload successful',
        name: 'test.jpg',
        http_code: 200,
        severity: 'info',
        asset_id: 'test-asset',
        public_id: 'test-public',
        version: 1,
        version_id: 'test-version',
        signature: 'test-signature',
        width: 100,
        height: 100,
        format: 'jpg',
        resource_type: 'image',
        created_at: new Date().toISOString(),
        tags: [],
        bytes: 1024,
        type: 'upload',
        etag: 'test-etag',
        placeholder: false,
        url: 'http://test.com/image.jpg',
        secure_url: 'https://test.com/image.jpg',
        folder: 'activities',
        original_filename: 'test',
      },
    ]

    it('should update activity images', async () => {
      const expectedResult = {
        id: activityId,
        images: [
          {
            id: 'image-1',
            url: 'https://test.com/image1.jpg',
          },
          {
            id: 'image-2',
            url: 'https://test.com/image2.jpg',
          },
        ],
      }

      mockUploadService.uploadMany.mockResolvedValue(mockUploadedFiles)
      mockActivityService.updateImages.mockResolvedValue(expectedResult)

      const result = await controller.updateActivityImages(
        activityId,
        updateImagesDto,
        [mockFile],
      )

      expect(result).toEqual(expectedResult)
      expect(mockUploadService.uploadMany).toHaveBeenCalledWith(
        [mockFile],
        'activities',
      )
      expect(mockActivityService.updateImages).toHaveBeenCalledWith(
        activityId,
        updateImagesDto,
        mockUploadedFiles,
      )
    })

    it('should handle invalid image index', async () => {
      const invalidUpdateImagesDto: UpdateActivityImagesDto = {
        mainImageIndex: 5, // Index larger than array length
      }

      await expect(
        controller.updateActivityImages(activityId, invalidUpdateImagesDto, [
          mockFile,
        ]),
      ).rejects.toThrow()
    })

    it('should handle file type validation failure', async () => {
      const invalidFile = {
        ...mockFile,
        mimetype: 'application/pdf',
      } as Express.Multer.File

      await expect(
        controller.updateActivityImages(activityId, updateImagesDto, [
          invalidFile,
        ]),
      ).rejects.toThrow()
    })
  })

  describe('delete', () => {
    const activityId = 'activity-123'

    it('should delete an activity', async () => {
      const expectedResult = { message: 'Activity deleted successfully' }

      mockActivityService.delete.mockResolvedValue(expectedResult)

      const result = await controller.delet(activityId)

      expect(result).toEqual(expectedResult)
      expect(mockActivityService.delete).toHaveBeenCalledWith(activityId)
    })
  })

  describe('deleteImage', () => {
    const activityId = 'activity-123'
    const imageId = 'image-123'

    it('should delete an activity image', async () => {
      const expectedResult = { message: 'Image deleted successfully' }

      mockActivityService.deleteImage.mockResolvedValue(expectedResult)

      const result = await controller.deleteImage(activityId, imageId)

      expect(result).toEqual(expectedResult)
      expect(mockActivityService.deleteImage).toHaveBeenCalledWith(
        activityId,
        imageId,
      )
    })
  })

  describe('findOneById', () => {
    const activityId = 'activity-123'

    it('should find an activity by id', async () => {
      const expectedResult = {
        id: activityId,
        name: 'Test Activity',
        description: 'Test Description',
        images: [
          {
            id: 'image-1',
            url: 'https://test.com/image1.jpg',
          },
        ],
      }

      mockActivityService.findOne.mockResolvedValue(expectedResult)

      const result = await controller.findOneById(activityId)

      expect(result).toEqual(expectedResult)
      expect(mockActivityService.findOne).toHaveBeenCalledWith(
        { id: activityId },
        { images: true },
      )
    })

    it('should handle non-existent activity', async () => {
      mockActivityService.findOne.mockRejectedValue(
        new NotFoundException('Activity not found'),
      )

      await expect(controller.findOneById('non-existent-id')).rejects.toThrow(
        NotFoundException,
      )
    })

    it('should return activity with nested relations', async () => {
      const expectedResult = {
        id: 'activity-123',
        name: 'Test Activity',
        description: 'Test Description',
        images: [
          {
            id: 'image-1',
            url: 'https://test.com/image1.jpg',
            isMain: true,
          },
          {
            id: 'image-2',
            url: 'https://test.com/image2.jpg',
            isMain: false,
          },
        ],
        schedules: [],
      }

      mockActivityService.findOne.mockResolvedValue(expectedResult)

      const result = await controller.findOneById('activity-123')

      expect(result).toEqual(expectedResult)
      expect(mockActivityService.findOne).toHaveBeenCalledWith(
        { id: 'activity-123' },
        { images: true },
      )
    })
  })

  describe('getPaginatedActivities', () => {
    const pageOptionsDto = {
      page: 1,
      take: 10,
      skip: 0,
      search: '',
      type: ActivityType.TEAM_BUILDING,
      durationMin: 0,
      durationMax: 1000,
      isAvailable: true,
      sort: {
        createdAt: Order.DESC,
      },
    }

    it('should return paginated activities', async () => {
      const expectedResult = {
        data: [
          {
            id: 'activity-1',
            name: 'Activity 1',
            description: 'Description 1',
          },
          {
            id: 'activity-2',
            name: 'Activity 2',
            description: 'Description 2',
          },
        ],
        meta: {
          page: 1,
          take: 10,
          itemCount: 2,
          pageCount: 1,
          hasPreviousPage: false,
          hasNextPage: false,
        },
      }

      mockActivityService.getPaginatedActivities.mockResolvedValue(
        expectedResult,
      )

      const result = await controller.getPaginatedActivities(pageOptionsDto)

      expect(result).toEqual(expectedResult)
      expect(mockActivityService.getPaginatedActivities).toHaveBeenCalledWith(
        pageOptionsDto,
      )
    })

    it('should handle invalid page parameters', async () => {
      const invalidPageOptionsDto = {
        page: -1,
        take: -10,
        skip: -10,
        search: '',
        type: ActivityType.TEAM_BUILDING,
      }

      await expect(
        controller.getPaginatedActivities(invalidPageOptionsDto),
      ).rejects.toThrow()
    })

    it('should handle search with special characters', async () => {
      const pageOptionsDto = {
        page: 1,
        take: 10,
        skip: 0,
        search: "test's activity & more",
        type: ActivityType.TEAM_BUILDING,
      }

      const expectedResult = {
        data: [],
        meta: {
          page: 1,
          take: 10,
          itemCount: 0,
          pageCount: 0,
          hasPreviousPage: false,
          hasNextPage: false,
        },
      }

      mockActivityService.getPaginatedActivities.mockResolvedValue(
        expectedResult,
      )

      const result = await controller.getPaginatedActivities(pageOptionsDto)

      expect(result).toEqual(expectedResult)
      expect(mockActivityService.getPaginatedActivities).toHaveBeenCalledWith(
        pageOptionsDto,
      )
    })

    it('should handle multiple activity types filter', async () => {
      const pageOptionsDto = {
        page: 1,
        take: 10,
        skip: 0,
        search: '',
        types: [ActivityType.TEAM_BUILDING, ActivityType.NOURRITURE],
      }

      const expectedResult = {
        data: [
          {
            id: 'activity-1',
            type: ActivityType.TEAM_BUILDING,
          },
          {
            id: 'activity-2',
            type: ActivityType.NOURRITURE,
          },
        ],
        meta: {
          page: 1,
          take: 10,
          itemCount: 2,
          pageCount: 1,
          hasPreviousPage: false,
          hasNextPage: false,
        },
      }

      mockActivityService.getPaginatedActivities.mockResolvedValue(
        expectedResult,
      )

      const result = await controller.getPaginatedActivities(pageOptionsDto)

      expect(result).toEqual(expectedResult)
      expect(result.data.length).toBe(2)
      expect(mockActivityService.getPaginatedActivities).toHaveBeenCalledWith(
        pageOptionsDto,
      )
    })
  })
})
