import { Inject, Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Plan } from './entities'
import {
  FindOptionsOrder,
  FindOptionsRelations,
  FindOptionsSelect,
  FindOptionsWhere,
  In,
  Repository,
} from 'typeorm'
import { CreatePlanDto, UpdatePlanDto } from './dto'
import { Activity } from 'src/activity/entities'
import { ActivityService } from 'src/activity/activity.service'
import Stripe from 'stripe'

@Injectable()
export class PlanService {
  constructor(
    @InjectRepository(Plan)
    private readonly planRepository: Repository<Plan>,
    private readonly activityService: ActivityService,
    @Inject('STRIPE_CLIENT') private stripeClient: Stripe,
  ) {}

  async create(createPlanDto: CreatePlanDto) {
    const { activities: activitiesIds, name, price, ...rest } = createPlanDto
    let activities: Activity[] = []
    if (activitiesIds && activitiesIds.length) {
      activities = await this.activityService.find({ id: In(activitiesIds) })
    }

    const stripeProduct = await this.stripeClient.products.create({
      name,
      description: `Subscription plan: ${name}`,
    })

    const stripePrice = await this.stripeClient.prices.create({
      unit_amount: Math.round(price * 100), // Convert price to cents
      currency: 'eur',
      recurring: { interval: 'month' },
      product: stripeProduct.id,
    })

    const plan = this.planRepository.create({
      activities,
      name,
      price,
      stripePriceId: stripePrice.id,
      stripeProductId: stripeProduct.id,
      ...rest,
    })
    return await this.planRepository.save(plan)
  }

  async findOne(
    where?: FindOptionsWhere<Plan>,
    relations?: FindOptionsRelations<Plan>,
    order?: FindOptionsOrder<Plan>,
    select?: FindOptionsSelect<Plan>,
  ) {
    const plan = await this.planRepository.findOne({
      where,
      relations,
      order,
      select,
    })
    if (!plan) throw new NotFoundException('Plan not found!')

    return plan
  }

  async find(
    where?: FindOptionsWhere<Plan>,
    relations?: FindOptionsRelations<Plan>,
    order?: FindOptionsOrder<Plan>,
  ) {
    return await this.planRepository.find({ where, relations, order })
  }

  async update(planId: string, updatePlanDto: UpdatePlanDto) {
    const plan = await this.findOne({ id: planId })
    if (!plan) {
      throw new NotFoundException('Plan not found')
    }

    const { activities: activitiesIds, ...rest } = updatePlanDto

    let stripePriceId = plan.stripePriceId
    if (updatePlanDto.price !== plan.price) {
      const stripePrice = await this.stripeClient.prices.create({
        unit_amount: Math.round(updatePlanDto.price * 100),
        currency: 'eur',
        recurring: { interval: 'month' },
        product: plan.stripeProductId,
      })
      stripePriceId = stripePrice.id
    }

    // Update basic properties of the plan
    await this.planRepository.update(plan.id, { stripePriceId, ...rest })

    const updatedPlan = await this.findOne(
      { id: plan.id },
      { activities: true },
    )

    // Handle many-to-many relationship for activities
    if (activitiesIds) {
      const activities = await this.activityService.find({
        id: In(activitiesIds),
      })
      if (activities.length !== activitiesIds.length) {
        throw new NotFoundException('Some activities are not found!')
      }
      updatedPlan.activities = activities // Update activities relation
      await this.planRepository.save(updatedPlan) // Save the updated relation
    }

    // Return updated plan with relations
    return this.findOne({ id: plan.id })
  }

  async delete(planId: string) {
    await this.findOne({ id: planId })
    await this.planRepository.delete(planId)
    return true
  }
}
