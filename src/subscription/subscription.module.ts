import { Module } from '@nestjs/common'
import { SubscriptionService } from './subscription.service'
import { SubscriptionController } from './subscription.controller'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Subscription } from './entities'
import { CompanyModule } from 'src/company/company.module'
import { PlanModule } from 'src/plan/plan.module'

@Module({
  imports: [
    TypeOrmModule.forFeature([Subscription]),
    CompanyModule,
    PlanModule,
  ],
  controllers: [SubscriptionController],
  providers: [SubscriptionService],
})
export class SubscriptionModule {}
