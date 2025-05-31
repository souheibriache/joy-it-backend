import { Test, TestingModule } from '@nestjs/testing'
import { ScheduleService } from './schedule.service'
import { getRepositoryToken } from '@nestjs/typeorm'
import { Schedule } from './entities/schedule.entity'
import {
  Repository,
  FindOptionsWhere,
  DeleteResult,
  UpdateResult,
} from 'typeorm'
import { CompanyService } from '../company/company.service'
import { ActivityService } from '../activity/activity.service'
import { ServiceOrderService } from '../service-order/service-order.service'
import { NotFoundException, BadRequestException } from '@nestjs/common'
import { ScheduleStatusEnum } from './enums/schedule-status.enum'
import { CreateScheduleDto } from './dto/create-schedule.dto'
import { UpdateScheduleDto } from './dto/update-schedule.dto'
import { Company } from '../company/entities'
import { Activity } from '../activity/entities'

describe('ScheduleService', () => {
  let service: ScheduleService
  let scheduleRepository: jest.Mocked<Repository<Schedule>>
  let companyService: jest.Mocked<CompanyService>
  let activityService: jest.Mocked<ActivityService>
  let serviceOrderService: jest.Mocked<ServiceOrderService>

  beforeEach(async () => {
    const mockScheduleRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    }

    const mockCompanyService = {
      findOne: jest.fn(),
    }

    const mockActivityService = {
      findOne: jest.fn(),
    }

    const mockServiceOrderService = {
      findOne: jest.fn(),
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ScheduleService,
        {
          provide: getRepositoryToken(Schedule),
          useValue: mockScheduleRepository,
        },
        {
          provide: CompanyService,
          useValue: mockCompanyService,
        },
        {
          provide: ActivityService,
          useValue: mockActivityService,
        },
        {
          provide: ServiceOrderService,
          useValue: mockServiceOrderService,
        },
      ],
    }).compile()

    service = module.get<ScheduleService>(ScheduleService)
    scheduleRepository = module.get(getRepositoryToken(Schedule))
    companyService = module.get(CompanyService)
    activityService = module.get(ActivityService)
    serviceOrderService = module.get(ServiceOrderService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('create', () => {
    it('should create a new schedule', async () => {
      const createScheduleDto: CreateScheduleDto = {
        activityId: 'activity-id',
        date: new Date(),
        participants: 1,
      }

      const mockCompany = {
        id: 'company-id',
        name: 'Test Company',
        client: { id: 'client-id' },
        serviceOrders: [
          {
            id: 'order-id',
            status: 'ACTIVE',
            endDate: new Date(Date.now() + 86400000),
            details: [
              {
                serviceType: 'TEST',
                bookingsUsed: 0,
                allowedBookings: 5,
                save: jest.fn(),
              },
            ],
          },
        ],
      } as unknown as Company

      const mockActivity = {
        id: 'activity-id',
        name: 'Test Activity',
        description: 'Test Description',
        type: 'TEST',
        duration: 2,
        participants: 10,
        isAvailable: true,
      } as unknown as Activity

      const mockSchedule = {
        id: 'schedule-id',
        date: createScheduleDto.date,
        participants: createScheduleDto.participants,
        startTime: '09:00',
        endTime: '11:00',
        status: ScheduleStatusEnum.PENDING,
        company: mockCompany,
        activity: mockActivity,
      } as Schedule

      activityService.findOne.mockResolvedValue(mockActivity)
      companyService.findOne.mockResolvedValue(mockCompany)
      scheduleRepository.create.mockReturnValue(mockSchedule)
      scheduleRepository.save.mockResolvedValue(mockSchedule)
      scheduleRepository.findOne.mockResolvedValue(mockSchedule)

      const result = await service.create(createScheduleDto, 'client-id')

      expect(result).toEqual(mockSchedule)
      expect(activityService.findOne).toHaveBeenCalledWith({
        id: createScheduleDto.activityId,
      })
      expect(companyService.findOne).toHaveBeenCalledWith({
        where: { client: { id: 'client-id' } },
        relations: { serviceOrders: { details: true } },
      })
      expect(scheduleRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          company: mockCompany,
          activity: mockActivity,
          date: createScheduleDto.date,
          participants: createScheduleDto.participants,
        }),
      )
      expect(scheduleRepository.save).toHaveBeenCalledWith(mockSchedule)
    })

    it('should throw BadRequestException when no valid orders found', async () => {
      const createScheduleDto: CreateScheduleDto = {
        activityId: 'activity-id',
        date: new Date(),
        participants: 1,
      }

      const mockCompany = {
        id: 'company-id',
        name: 'Test Company',
        client: { id: 'client-id' },
        serviceOrders: [],
      } as unknown as Company

      const mockActivity = {
        id: 'activity-id',
        type: 'TEST',
      } as unknown as Activity

      activityService.findOne.mockResolvedValue(mockActivity)
      companyService.findOne.mockResolvedValue(mockCompany)

      await expect(
        service.create(createScheduleDto, 'client-id'),
      ).rejects.toThrow(BadRequestException)
    })
  })

  describe('find', () => {
    it('should return an array of schedules', async () => {
      const mockSchedules = [
        {
          id: 'schedule-1',
          date: new Date(),
          startTime: '09:00',
          endTime: '17:00',
          status: ScheduleStatusEnum.PENDING,
          participants: 1,
        },
        {
          id: 'schedule-2',
          date: new Date(),
          startTime: '10:00',
          endTime: '18:00',
          status: ScheduleStatusEnum.ONGOING,
          participants: 2,
        },
      ] as Schedule[]

      scheduleRepository.find.mockResolvedValue(mockSchedules)

      const result = await service.find()

      expect(result).toEqual(mockSchedules)
      expect(scheduleRepository.find).toHaveBeenCalledWith({
        where: undefined,
        relations: undefined,
        order: undefined,
      })
    })
  })

  describe('findOne', () => {
    it('should return a schedule by id', async () => {
      const mockSchedule = {
        id: 'schedule-id',
        date: new Date(),
        startTime: '09:00',
        endTime: '17:00',
        status: ScheduleStatusEnum.PENDING,
        participants: 1,
      } as Schedule

      scheduleRepository.findOne.mockResolvedValue(mockSchedule)

      const result = await service.findOne({ id: 'schedule-id' })

      expect(result).toEqual(mockSchedule)
      expect(scheduleRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'schedule-id' },
        relations: undefined,
        order: undefined,
      })
    })

    it('should throw NotFoundException when schedule not found', async () => {
      scheduleRepository.findOne.mockResolvedValue(null)

      await expect(service.findOne({ id: 'non-existent-id' })).rejects.toThrow(
        NotFoundException,
      )
    })
  })

  describe('update', () => {
    it('should update a schedule', async () => {
      const updateScheduleDto: UpdateScheduleDto = {
        date: new Date(Date.now() - 86400000), // Yesterday
        participants: 2,
      }

      const mockSchedule = {
        id: 'schedule-id',
        date: updateScheduleDto.date,
        participants: updateScheduleDto.participants,
        startTime: '09:00',
        endTime: '17:00',
        status: ScheduleStatusEnum.PENDING,
      } as Schedule

      scheduleRepository.findOne.mockResolvedValue(mockSchedule)
      scheduleRepository.update.mockResolvedValue({
        affected: 1,
        raw: [],
        generatedMaps: [],
      } as UpdateResult)
      scheduleRepository.findOne.mockResolvedValueOnce({
        ...mockSchedule,
        ...updateScheduleDto,
      } as Schedule)

      const result = await service.update('schedule-id', updateScheduleDto)

      expect(result).toEqual({ ...mockSchedule, ...updateScheduleDto })
      expect(scheduleRepository.update).toHaveBeenCalledWith(
        'schedule-id',
        updateScheduleDto,
      )
    })

    it('should throw BadRequestException when schedule is in the future', async () => {
      const updateScheduleDto: UpdateScheduleDto = {
        date: new Date(),
        participants: 2,
      }

      const mockSchedule = {
        id: 'schedule-id',
        date: new Date(Date.now() + 86400000), // Tomorrow
        participants: 1,
        startTime: '09:00',
        endTime: '17:00',
        status: ScheduleStatusEnum.PENDING,
      } as Schedule

      scheduleRepository.findOne.mockResolvedValue(mockSchedule)

      await expect(
        service.update('schedule-id', updateScheduleDto),
      ).rejects.toThrow(BadRequestException)
    })

    it('should throw NotFoundException when schedule not found', async () => {
      const updateScheduleDto: UpdateScheduleDto = {
        date: new Date(),
        participants: 2,
      }

      scheduleRepository.findOne.mockResolvedValue(null)

      await expect(
        service.update('schedule-id', updateScheduleDto),
      ).rejects.toThrow(NotFoundException)
    })
  })

  describe('delete', () => {
    it('should delete a schedule', async () => {
      const mockSchedule = {
        id: 'schedule-id',
        date: new Date(),
        startTime: '09:00',
        endTime: '17:00',
        status: ScheduleStatusEnum.PENDING,
        participants: 1,
      } as Schedule

      scheduleRepository.findOne.mockResolvedValue(mockSchedule)
      scheduleRepository.delete.mockResolvedValue({ affected: 1, raw: [] })

      const result = await service.delete('schedule-id')

      expect(result).toBe(true)
      expect(scheduleRepository.delete).toHaveBeenCalledWith('schedule-id')
    })

    it('should throw NotFoundException when schedule not found', async () => {
      scheduleRepository.findOne.mockResolvedValue(null)

      await expect(service.delete('non-existent-id')).rejects.toThrow(
        NotFoundException,
      )
    })
  })

  describe('cancelSchedule', () => {
    it('should cancel a schedule', async () => {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)

      const mockSchedule = {
        id: 'schedule-id',
        date: tomorrow,
        status: ScheduleStatusEnum.PENDING,
        company: null,
        activity: null,
        startTime: '09:00',
        endTime: '11:00',
        participants: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        hasId: () => true,
        remove: jest.fn(),
        softRemove: jest.fn(),
        recover: jest.fn(),
        reload: jest.fn(),
        save: jest.fn(),
      } as unknown as Schedule

      scheduleRepository.findOne.mockResolvedValue(mockSchedule)
      scheduleRepository.update.mockResolvedValue({
        affected: 1,
        raw: [],
        generatedMaps: [],
      })

      await service.cancelSchedule('schedule-id')

      expect(scheduleRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'schedule-id' },
      })
      expect(scheduleRepository.update).toHaveBeenCalledWith('schedule-id', {
        status: ScheduleStatusEnum.CANCELED,
      })
    })

    it('should throw NotFoundException when schedule not found', async () => {
      scheduleRepository.findOne.mockResolvedValue(null)

      await expect(service.cancelSchedule('non-existent-id')).rejects.toThrow(
        NotFoundException,
      )
    })

    it('should throw BadRequestException when trying to cancel past schedule', async () => {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)

      const mockSchedule = {
        id: 'schedule-id',
        date: yesterday,
        status: ScheduleStatusEnum.PENDING,
        company: null,
        activity: null,
        startTime: '09:00',
        endTime: '11:00',
        participants: 1,
      } as unknown as Schedule

      scheduleRepository.findOne.mockResolvedValue(mockSchedule)

      await expect(service.cancelSchedule('schedule-id')).rejects.toThrow(
        BadRequestException,
      )
    })
  })
})
