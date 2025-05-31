import { Test, TestingModule } from '@nestjs/testing'
import { AnalyticsController } from './analytics.controller'
import { AnalyticsService } from './analytics.service'
import { getRepositoryToken } from '@nestjs/typeorm'
import { Company } from '../company/entities'
import { Schedule } from '../schedule/entities'
import { Activity } from '../activity/entities'
import { Repository } from 'typeorm'
import { AnalyticsResponseDto } from './dto/analytics.dto'

describe('AnalyticsController', () => {
  let controller: AnalyticsController
  let analyticsService: AnalyticsService

  const mockAnalyticsService = {
    getApplicationAnalytics: jest.fn(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AnalyticsController],
      providers: [
        {
          provide: AnalyticsService,
          useValue: mockAnalyticsService,
        },
        {
          provide: getRepositoryToken(Company),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(Schedule),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(Activity),
          useClass: Repository,
        },
      ],
    }).compile()

    controller = module.get<AnalyticsController>(AnalyticsController)
    analyticsService = module.get<AnalyticsService>(AnalyticsService)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })

  describe('getAnalytics', () => {
    it('should return analytics data', async () => {
      const mockAnalytics: AnalyticsResponseDto = {
        totalCompanies: 10,
        verifiedCompanies: 7,
        unverifiedCompanies: 3,
        totalSchedules: 20,
        completedSchedules: 12,
        pendingSchedules: 5,
        canceledSchedules: 3,
        totalActivities: 15,
      }

      mockAnalyticsService.getApplicationAnalytics.mockResolvedValue(
        mockAnalytics,
      )

      const result = await controller.getAnalytics()

      expect(result).toEqual(mockAnalytics)
      expect(mockAnalyticsService.getApplicationAnalytics).toHaveBeenCalled()
    })
  })
})
