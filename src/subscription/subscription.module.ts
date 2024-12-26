import { forwardRef, Module } from '@nestjs/common'
import { SubscriptionService } from './subscription.service'
import { SubscriptionController } from './subscription.controller'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Subscription } from './entities'
import { CompanyModule } from 'src/company/company.module'
import { PlanModule } from 'src/plan/plan.module'
import { StripeModule } from 'src/stripe/stripe.module'
import { ConfigModule } from '@app/config'

@Module({
  imports: [
    TypeOrmModule.forFeature([Subscription]),
    forwardRef(() => CompanyModule),
    PlanModule,
    forwardRef(() => StripeModule),
    ConfigModule,
  ],
  controllers: [SubscriptionController],
  providers: [SubscriptionService],
  exports: [SubscriptionService],
})
export class SubscriptionModule {}
