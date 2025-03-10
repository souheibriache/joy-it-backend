import { Module } from '@nestjs/common'
import { ScheduleService } from './schedule.service'
import { ScheduleController } from './schedule.controller'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Schedule } from './entities'
import { ActivityModule } from 'src/activity/activity.module'
import { CompanyModule } from 'src/company/company.module'
import { ServiceOrderModule } from 'src/service-order/service-order.module'

@Module({
  imports: [
    TypeOrmModule.forFeature([Schedule]),
    ActivityModule,
    CompanyModule,
    ServiceOrderModule,
  ],
  controllers: [ScheduleController],
  providers: [ScheduleService],
  exports: [ScheduleService],
})
export class ScheduleModule {}
