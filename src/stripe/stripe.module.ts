import { forwardRef, Module } from '@nestjs/common'
import { StripeController } from './stripe.controller'
import { ConfigModule, ConfigService } from '@app/config'
import Stripe from 'stripe'
import { SubscriptionModule } from 'src/subscription/subscription.module'
@Module({
  imports: [ConfigModule, forwardRef(() => SubscriptionModule)],
  controllers: [StripeController],
  providers: [
    {
      provide: 'STRIPE_CLIENT',
      useFactory: (configService: ConfigService) => {
        return new Stripe(configService.get<string>('STRIPE_SECRET_KEY'), {
          apiVersion: '2024-12-18.acacia',
        })
      },
      inject: [ConfigService],
    },
  ],
  exports: ['STRIPE_CLIENT'],
})
export class StripeModule {}
