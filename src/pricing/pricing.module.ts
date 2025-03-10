import { Module } from '@nestjs/common'
import { PricingService } from './pricing.service'
import { PricingController } from './pricing.controller'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Pricing } from './entities/pricing-entity'

@Module({
  imports: [TypeOrmModule.forFeature([Pricing])],
  controllers: [PricingController],
  providers: [PricingService],
  exports: [PricingService],
})
export class PricingModule {}
