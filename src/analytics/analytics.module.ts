import { Module } from '@nestjs/common'
import { AnalyticsService } from './analytics.service'
import { AnalyticsController } from './analytics.controller'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Company } from 'src/company/entities'
import { Schedule } from 'src/schedule/entities'
import { Activity } from 'src/activity/entities'

@Module({
  imports: [TypeOrmModule.forFeature([Company, Schedule, Activity])],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
})
export class AnalyticsModule {}
