import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Schedule } from './entities';
import {
  FindOptionsOrder,
  FindOptionsRelations,
  FindOptionsWhere,
  Repository,
} from 'typeorm';
import { CompanyService } from 'src/company/company.service';
import { ActivityService } from 'src/activity/activity.service';
import { CreateScheduleDto } from './dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
import { ScheduleStatusEnum } from './enums';

@Injectable()
export class ScheduleService {
  constructor(
    @InjectRepository(Schedule)
    private readonly scheduleRepository: Repository<Schedule>,
    private readonly companyService: CompanyService,
    private readonly activityService: ActivityService,
  ) {}

  async create(createScheduleDto: CreateScheduleDto, clientId: string) {
    const { activityId, ...rest } = createScheduleDto;

    const activity = await this.activityService.findOne({ id: activityId });
    const company = await this.companyService.findOne(
      {
        client: { id: clientId },
      },
      { subscription: { plan: { activities: true } } },
    );

    if (
      !company?.subscription?.plan?.activities?.find(
        (activity) => activity.id === activityId,
      )
    )
      throw new BadRequestException('Your plan does not include this activity');

    if (company.credit < activity.creditCost)
      throw new BadRequestException('Unsifficient credit for this activity');

    const schedule = await this.scheduleRepository.create({
      company,
      activity,
      ...rest,
    });

    const savedSchedule = await this.scheduleRepository.save(schedule);
    company.credit = company.credit - activity.creditCost;
    await company.save();
    return await this.findOne(
      { id: savedSchedule.id },
      { company: true, activity: true },
    );
  }

  async findOne(
    where?: FindOptionsWhere<Schedule>,
    relations?: FindOptionsRelations<Schedule>,
    order?: FindOptionsOrder<Schedule>,
  ) {
    const schedule = await this.scheduleRepository.findOne({
      where,
      relations,
      order,
    });
    if (!schedule) throw new NotFoundException('Schedule not found!');

    return schedule;
  }

  async find(
    where?: FindOptionsWhere<Schedule>,
    relations?: FindOptionsRelations<Schedule>,
    order?: FindOptionsOrder<Schedule>,
  ) {
    return await this.scheduleRepository.find({
      where,
      relations,
      order,
    });
  }

  async update(
    id: string,
    updateScheduleDto: UpdateScheduleDto,
    clientId?: string,
  ) {
    const schedule = await this.findOne(
      { id, company: { client: { id: clientId ? clientId : null } } },
      { activity: true, company: true },
    );

    const { activityId, ...rest } = updateScheduleDto;

    let activity = schedule.activity;

    if (activityId) {
      schedule.company.credit =
        schedule.company.credit + schedule.activity.creditCost;

      const newActivity = await this.activityService.findOne({
        id: activityId,
      });

      if (newActivity.creditCost > schedule.company.credit)
        throw new BadRequestException(
          "'Unsifficient credit for this activity'",
        );

      schedule.company.credit =
        schedule.company.credit - newActivity.creditCost;
      await schedule.company.save();
      activity = newActivity;
    }

    await this.scheduleRepository.update(id, { ...rest, activity });

    return await this.findOne({ id }, { activity: true, company: true });
  }

  async cancelSchedule(scheduleId: string, clientId?: string) {
    const schedule = await this.findOne(
      { id: scheduleId, company: { client: { id: clientId } } },
      { company: true, activity: true },
    );
    if (schedule.status !== ScheduleStatusEnum.PENDING)
      throw new BadRequestException('Cannot cancel schedule');

    await this.scheduleRepository.update(scheduleId, {
      status: ScheduleStatusEnum.CANCELED,
    });
    schedule.company.credit =
      schedule.company.credit + schedule.activity.creditCost;
    await schedule.company.save();
    return await this.findOne({ id: scheduleId }, { activity: true });
  }

  async delete(id: string, clientId?: string) {
    await this.findOne({
      id,
      company: { client: { id: clientId ? clientId : null } },
    });
    await this.scheduleRepository.delete(id);
    return true;
  }
}
