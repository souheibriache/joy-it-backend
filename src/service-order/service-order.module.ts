import { forwardRef, Module } from '@nestjs/common'
import { ServiceOrderService } from './service-order.service'
import { ServiceOrderController } from './service-order.controller'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ServiceOrder } from './entities'
import { PricingModule } from 'src/pricing/pricing.module'
import { CompanyModule } from 'src/company/company.module'
import { StripeModule } from 'src/stripe/stripe.module'

@Module({
  imports: [
    TypeOrmModule.forFeature([ServiceOrder]),
    PricingModule,
    forwardRef(() => CompanyModule),
    forwardRef(() => StripeModule),
  ],
  controllers: [ServiceOrderController],
  providers: [ServiceOrderService],
  exports: [ServiceOrderService],
})
export class ServiceOrderModule {}
