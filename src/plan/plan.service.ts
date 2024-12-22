import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Plan } from './entities'
import {
  FindOptionsOrder,
  FindOptionsRelations,
  FindOptionsWhere,
  In,
  Repository,
} from 'typeorm'
import { CreatePlanDto, UpdatePlanDto } from './dto'
import { Activity } from 'src/activity/entities'
import { ActivityService } from 'src/activity/activity.service'

@Injectable()
export class PlanService {
  constructor(
    @InjectRepository(Plan)
    private readonly planRepository: Repository<Plan>,
    private readonly activityService: ActivityService,
  ) {}

  async create(createPlanDto: CreatePlanDto) {
    const { activities: activitiesIds, ...rest } = createPlanDto
    let activities: Activity[] = []
    if (activitiesIds && activitiesIds.length) {
      activities = await this.activityService.find({ id: In(activitiesIds) })
    }

    const plan = this.planRepository.create({ activities, ...rest })
    return await this.planRepository.save(plan)
  }

  async findOne(
    where?: FindOptionsWhere<Plan>,
    relations?: FindOptionsRelations<Plan>,
    order?: FindOptionsOrder<Plan>,
  ) {
    const plan = await this.planRepository.findOne({ where, relations, order })
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

    // Update basic properties of the plan
    await this.planRepository.update(plan.id, {
      ...rest,
    })

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
