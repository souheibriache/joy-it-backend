import { forwardRef, Module } from '@nestjs/common'
import { StripeController } from './stripe.controller'
import { ConfigModule, ConfigService } from '@app/config'
import Stripe from 'stripe'
import { ServiceOrderModule } from 'src/service-order/service-order.module'
@Module({
  imports: [ConfigModule, forwardRef(() => ServiceOrderModule)],
  controllers: [StripeController],
  providers: [
    {
      provide: 'STRIPE_CLIENT',
      useFactory: (configService: ConfigService) => {
        return new Stripe(configService.get<string>('STRIPE_SECRET_KEY'), {
          apiVersion: '2025-01-27.acacia',
        })
      },
      inject: [ConfigService],
    },
  ],
  exports: ['STRIPE_CLIENT'],
})
export class StripeModule {}
