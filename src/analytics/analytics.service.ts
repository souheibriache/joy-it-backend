import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Company } from 'src/company/entities'
import { Schedule } from 'src/schedule/entities'
import { Activity } from 'src/activity/entities'
import { AnalyticsResponseDto } from './dto/analytics.dto'
import { ScheduleStatusEnum } from 'src/schedule/enums'

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
    @InjectRepository(Schedule)
    private readonly scheduleRepository: Repository<Schedule>,
    @InjectRepository(Activity)
    private readonly activityRepository: Repository<Activity>,
  ) {}

  async getApplicationAnalytics(): Promise<AnalyticsResponseDto> {
    const totalCompanies = await this.companyRepository.count()
    const verifiedCompanies = await this.companyRepository.count({
      where: { isVerified: true },
    })
    const unverifiedCompanies = totalCompanies - verifiedCompanies

    const schedules = await this.scheduleRepository.find()
    const totalSchedules = schedules.length
    const completedSchedules = schedules.filter(
      (s) => s.status === ScheduleStatusEnum.COMPLETED,
    ).length
    const pendingSchedules = schedules.filter(
      (s) => s.status === ScheduleStatusEnum.PENDING,
    ).length
    const canceledSchedules = schedules.filter(
      (s) => s.status === ScheduleStatusEnum.CANCELED,
    ).length

    const totalActivities = await this.activityRepository.count()

    return {
      totalCompanies,
      verifiedCompanies,
      unverifiedCompanies,
      totalSchedules,
      completedSchedules,
      pendingSchedules,
      canceledSchedules,
      totalActivities,
    }
  }
}
