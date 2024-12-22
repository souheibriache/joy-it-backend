import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Plan } from 'src/plan/entities'
import { Company } from 'src/company/entities'
import { Subscription } from 'src/subscription/entities'
import { Schedule } from 'src/schedule/entities'
import { Activity } from 'src/activity/entities'
import { AnalyticsResponseDto } from './dto/analytics.dto'
import { ScheduleStatusEnum } from 'src/schedule/enums'

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(Plan)
    private readonly planRepository: Repository<Plan>,
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
    @InjectRepository(Subscription)
    private readonly subscriptionRepository: Repository<Subscription>,
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

    const totalPlans = await this.planRepository.count()

    const subscriptions = await this.subscriptionRepository.find({
      relations: { plan: true },
    })

    const subscriptionsPerPlan = subscriptions.reduce(
      (acc, sub) => {
        const planName = sub.plan.name
        acc[planName] = (acc[planName] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    const totalSubscriptions = subscriptions.length

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

    const totalCreditsConsumed = schedules.reduce((total, schedule) => {
      return total + (schedule.activity?.creditCost || 0)
    }, 0)

    return {
      totalCompanies,
      verifiedCompanies,
      unverifiedCompanies,
      totalPlans,
      subscriptionsPerPlan,
      totalSubscriptions,
      totalSchedules,
      completedSchedules,
      pendingSchedules,
      canceledSchedules,
      totalActivities,
      totalCreditsConsumed,
    }
  }
}
