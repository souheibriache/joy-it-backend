import { Test, TestingModule } from '@nestjs/testing'
import { AnalyticsService } from './analytics.service'
import { getRepositoryToken } from '@nestjs/typeorm'
import { Company } from '../company/entities'
import { Schedule } from '../schedule/entities'
import { Activity } from '../activity/entities'
import { Repository } from 'typeorm'
import { ScheduleStatusEnum } from '../schedule/enums'

describe('AnalyticsService', () => {
  let service: AnalyticsService
  let companyRepository: Repository<Company>
  let scheduleRepository: Repository<Schedule>
  let activityRepository: Repository<Activity>

  const mockCompanyRepository = {
    count: jest.fn(),
  }

  const mockScheduleRepository = {
    find: jest.fn(),
  }

  const mockActivityRepository = {
    count: jest.fn(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        {
          provide: getRepositoryToken(Company),
          useValue: mockCompanyRepository,
        },
        {
          provide: getRepositoryToken(Schedule),
          useValue: mockScheduleRepository,
        },
        {
          provide: getRepositoryToken(Activity),
          useValue: mockActivityRepository,
        },
      ],
    }).compile()

    service = module.get<AnalyticsService>(AnalyticsService)
    companyRepository = module.get<Repository<Company>>(
      getRepositoryToken(Company),
    )
    scheduleRepository = module.get<Repository<Schedule>>(
      getRepositoryToken(Schedule),
    )
    activityRepository = module.get<Repository<Activity>>(
      getRepositoryToken(Activity),
    )
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('getApplicationAnalytics', () => {
    it('should return analytics data', async () => {
      // Mock company repository responses
      mockCompanyRepository.count.mockImplementation((options) => {
        if (options?.where?.isVerified === true) {
          return Promise.resolve(7) // verified companies
        }
        return Promise.resolve(10) // total companies
      })

      // Mock schedule repository response
      mockScheduleRepository.find.mockResolvedValue([
        { status: ScheduleStatusEnum.COMPLETED },
        { status: ScheduleStatusEnum.COMPLETED },
        { status: ScheduleStatusEnum.PENDING },
        { status: ScheduleStatusEnum.CANCELED },
      ])

      // Mock activity repository response
      mockActivityRepository.count.mockResolvedValue(15)

      const result = await service.getApplicationAnalytics()

      expect(result).toEqual({
        totalCompanies: 10,
        verifiedCompanies: 7,
        unverifiedCompanies: 3,
        totalSchedules: 4,
        completedSchedules: 2,
        pendingSchedules: 1,
        canceledSchedules: 1,
        totalActivities: 15,
      })

      expect(companyRepository.count).toHaveBeenCalledTimes(2)
      expect(scheduleRepository.find).toHaveBeenCalled()
      expect(activityRepository.count).toHaveBeenCalled()
    })
  })
})
