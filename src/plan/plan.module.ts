import { forwardRef, Module } from '@nestjs/common'
import { PlanService } from './plan.service'
import { PlanController } from './plan.controller'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Plan } from './entities'
import { ActivityModule } from 'src/activity/activity.module'
import { StripeModule } from 'src/stripe/stripe.module'

@Module({
  imports: [
    TypeOrmModule.forFeature([Plan]),
    ActivityModule,
    forwardRef(() => StripeModule),
  ],
  controllers: [PlanController],
  providers: [PlanService],
  exports: [PlanService],
})
export class PlanModule {}
