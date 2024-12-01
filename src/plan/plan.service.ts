import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Plan } from './entities';
import {
  FindOptionsOrder,
  FindOptionsRelations,
  FindOptionsWhere,
  In,
  Repository,
} from 'typeorm';
import { CreatePlanDto } from './dto';
import { Activity } from 'src/activity/entities';
import { ActivityService } from 'src/activity/activity.service';

@Injectable()
export class PlanService {
  constructor(
    @InjectRepository(Plan)
    private readonly planRepository: Repository<Plan>,
    private readonly activityService: ActivityService,
  ) {}

  async create(createPlanDto: CreatePlanDto) {
    const { activities: activitiesIds, ...rest } = createPlanDto;
    let activities: Activity[] = [];
    if (activitiesIds && activitiesIds.length) {
      activities = await this.activityService.find({ id: In(activitiesIds) });
    }

    const plan = this.planRepository.create({ activities, ...rest });
    return await this.planRepository.save(plan);
  }

  async findOne(
    where?: FindOptionsWhere<Plan>,
    relations?: FindOptionsRelations<Plan>,
    order?: FindOptionsOrder<Plan>,
  ) {
    const plan = await this.planRepository.findOne({ where, relations, order });
    if (!plan) throw new NotFoundException('Plan not found!');

    return plan;
  }

  async find(
    where?: FindOptionsWhere<Plan>,
    relations?: FindOptionsRelations<Plan>,
    order?: FindOptionsOrder<Plan>,
  ) {
    return await this.planRepository.find({ where, relations, order });
  }

  async update(planId: string, updatePlanDto) {
    const plan = await this.findOne({ id: planId });

    const { activities: activitiesIds, ...rest } = updatePlanDto;

    const updateObject = { ...rest };
    let activities = [];
    if (activitiesIds) {
      activities = await this.activityService.find({ id: In(activitiesIds) });
      updateObject.activities = activities;
    }

    await this.planRepository.update(plan.id, { ...rest, updateObject });

    return await this.findOne({ id: plan.id });
  }

  async delete(planId: string) {
    await this.findOne({ id: planId });
    await this.planRepository.delete(planId);
    return true;
  }
}
