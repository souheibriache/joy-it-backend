import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Subscription } from './entities'
import { Repository } from 'typeorm'
import { CompanyService } from 'src/company/company.service'
import { PlanService } from 'src/plan/plan.service'

@Injectable()
export class SubscriptionService {
  constructor(
    @InjectRepository(Subscription)
    private readonly subscriptionRepository: Repository<Subscription>,
    private readonly companyService: CompanyService,
    private readonly planService: PlanService,
  ) {}

  async create(planId: string, clientId: string) {
    const company = await this.companyService.findOne({
      client: { id: clientId },
    })
    const plan = await this.planService.findOne({ id: planId })

    const startDate = new Date()
    const endDate = new Date(startDate.getTime() + 1000 * 60 * 60 * 24 * 30)

    const subscription = await this.subscriptionRepository.create({
      plan,
      company,
      startDate,
      endDate,
    })

    const savedSubscription =
      await this.subscriptionRepository.save(subscription)

    await this.companyService.update(
      { credit: company.credit + plan.credit },
      { id: company.id },
    )
    company.subscription = savedSubscription
    await company.save()

    return savedSubscription
  }

  async createByAdmin(planId: string, companyId: string) {
    const company = await this.companyService.findOne({
      id: companyId,
    })
    const plan = await this.planService.findOne({ id: planId })

    const startDate = new Date()
    const endDate = new Date(startDate.getTime() + 1000 * 60 * 60 * 24 * 30)

    const subscription = await this.subscriptionRepository.create({
      plan,
      company,
      startDate,
      endDate,
    })

    await this.companyService.update(
      { credit: company.credit + plan.credit },
      { id: company.id },
    )
    return await this.subscriptionRepository.save(subscription)
  }
}
