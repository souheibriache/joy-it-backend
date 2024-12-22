import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Request,
  UseGuards,
} from '@nestjs/common'
import { ScheduleService } from './schedule.service'
import { AccessTokenGuard } from 'src/auth/guards/access-token.guard'
import { SuperUserGuard } from 'src/auth/guards/super-user.guard'
import { CreateScheduleDto } from './dto'
import { IRequestWithUser } from '@app/common/interfaces/request-user.interface.dto'
import { UpdateScheduleDto } from './dto/update-schedule.dto'
import { ApiBearerAuth } from '@nestjs/swagger'

@Controller('schedule')
@ApiBearerAuth()
export class ScheduleController {
  constructor(private readonly scheduleService: ScheduleService) {}

  @Post()
  @UseGuards(AccessTokenGuard)
  async create(
    @Body() createScheduleDto: CreateScheduleDto,
    @Request() req: IRequestWithUser,
  ) {
    const clientId = req?.user?.id

    return await this.scheduleService.create(createScheduleDto, clientId)
  }

  @Get()
  @UseGuards(AccessTokenGuard)
  async getAll(@Request() req: IRequestWithUser) {
    const clientId = req?.user?.id
    return await this.scheduleService.find(
      { company: { client: { id: clientId } } },
      { activity: true },
    )
  }

  @Get(':scheduleId')
  @UseGuards(AccessTokenGuard)
  async getOne(
    @Request() req: IRequestWithUser,
    @Param('scheduleId') scheduleId: string,
  ) {
    return await this.scheduleService.findOne(
      { id: scheduleId },
      { activity: true },
    )
  }

  @Get('/admin/company/:companyId')
  @UseGuards(AccessTokenGuard, SuperUserGuard)
  async getCompanySchedules(@Param('companyId') companyId: string) {
    return await this.scheduleService.find({ company: { id: companyId } })
  }

  @Get('/admin/:scheduleId')
  @UseGuards(AccessTokenGuard, SuperUserGuard)
  async adminGetOneById(@Param('scheduleId') scheduleId: string) {
    return await this.scheduleService.findOne(
      { id: scheduleId },
      { activity: true, company: true },
    )
  }

  @Put(':scheduleId')
  @UseGuards(AccessTokenGuard)
  async update(
    @Body() updateScheduleDto: UpdateScheduleDto,
    @Request() req: IRequestWithUser,
    @Param('scheduleId') scheduleId: string,
  ) {
    const clientid = req?.user?.id
    return await this.scheduleService.update(
      scheduleId,
      updateScheduleDto,
      clientid,
    )
  }

  @Put(':scheduleId/cancel')
  @UseGuards(AccessTokenGuard)
  async cancelSchedule(
    @Request() req: IRequestWithUser,
    @Param('scheduleId') scheduleId: string,
  ) {
    const clientid = req?.user?.id
    return await this.scheduleService.cancelSchedule(scheduleId, clientid)
  }

  @Put('/admin/:scheduleId')
  @UseGuards(AccessTokenGuard, SuperUserGuard)
  async updateByAdmin(
    @Body() updateScheduleDto: UpdateScheduleDto,
    @Param('scheduleId') scheduleId: string,
  ) {
    return await this.scheduleService.update(scheduleId, updateScheduleDto)
  }

  @Delete(':scheduleId')
  @UseGuards(AccessTokenGuard)
  async delete(
    @Param('scheduleId') scheduleId: string,
    @Request() req: IRequestWithUser,
  ) {
    const clientId = req?.user?.id
    return await this.scheduleService.delete(scheduleId, clientId)
  }
}
