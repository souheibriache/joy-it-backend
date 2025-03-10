import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Schedule } from './entities'
import {
  FindOptionsOrder,
  FindOptionsRelations,
  FindOptionsWhere,
  Repository,
} from 'typeorm'
import { CompanyService } from 'src/company/company.service'
import { ActivityService } from 'src/activity/activity.service'
import { CreateScheduleDto } from './dto'
import { UpdateScheduleDto } from './dto/update-schedule.dto'
import { ScheduleStatusEnum } from './enums'
import { ServiceOrderService } from 'src/service-order/service-order.service'

@Injectable()
export class ScheduleService {
  constructor(
    @InjectRepository(Schedule)
    private readonly scheduleRepository: Repository<Schedule>,
    private readonly companyService: CompanyService,
    private readonly activityService: ActivityService,
    private readonly serviceOrderService: ServiceOrderService,
  ) {}

  async create(createScheduleDto: CreateScheduleDto, clientId: string) {
    const { activityId, ...rest } = createScheduleDto

    const activity = await this.activityService.findOne({ id: activityId })
    const company = await this.companyService.findOne({
      where: { client: { id: clientId } },
      relations: { serviceOrders: { details: true } },
    })

    const currentOrder = company.serviceOrders.find((order) => {
      if (order.status !== 'ACTIVE' || order.endDate.getTime() > Date.now())
        return false

      order.details.forEach((detail) => {
        if (detail.serviceType === activity.type) {
          if (detail.bookingsUsed < detail.allowedBookings) return true
        }
      })
      return false
    })

    if (!currentOrder)
      throw new BadRequestException("You don't have valid orders")

    const schedule = await this.scheduleRepository.create({
      company,
      activity,
      ...rest,
    })

    const savedSchedule = await this.scheduleRepository.save(schedule)
    const orderServiceDetail = currentOrder.details.find(
      (detail) => detail.serviceType === activity.type,
    )
    orderServiceDetail.bookingsUsed = orderServiceDetail.bookingsUsed + 1
    orderServiceDetail.save()

    return await this.findOne(
      { id: savedSchedule.id },
      { company: true, activity: true },
    )
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
    })
    if (!schedule) throw new NotFoundException('Schedule not found!')

    return schedule
  }

  async find(
    where?: FindOptionsWhere<Schedule>,
    relations?: FindOptionsRelations<Schedule>,
    order?: FindOptionsOrder<Schedule>,
  ) {
    return await this.scheduleRepository.find({ where, relations, order })
  }

  async update(
    id: string,
    updateScheduleDto: UpdateScheduleDto,
    clientId?: string,
  ) {
    const schedule = await this.findOne({
      id,
      company: { client: { id: clientId ? clientId : null } },
    })

    if (!schedule) throw new NotFoundException('Schedule not found!')

    if (schedule.date > new Date())
      throw new BadRequestException('Unable to update this schedule!')

    await this.scheduleRepository.update(id, updateScheduleDto)

    return await this.findOne({ id }, { activity: true, company: true })
  }

  async cancelSchedule(scheduleId: string, clientId?: string) {
    const schedule = await this.findOne(
      { id: scheduleId, company: { client: { id: clientId } } },
      { company: true, activity: true },
    )

    if (!schedule) throw new NotFoundException('Schedule not found')

    if (
      schedule.status !== ScheduleStatusEnum.PENDING ||
      schedule.date > new Date()
    )
      throw new BadRequestException('Cannot cancel schedule')

    await this.scheduleRepository.update(scheduleId, {
      status: ScheduleStatusEnum.CANCELED,
    })

    return await this.findOne({ id: scheduleId }, { activity: true })
  }

  async delete(id: string, clientId?: string) {
    await this.findOne({
      id,
      company: { client: { id: clientId ? clientId : null } },
    })
    await this.scheduleRepository.delete(id)
    return true
  }
}
