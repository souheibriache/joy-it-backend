import { Body, Controller, Get, Post, Put, UseGuards } from '@nestjs/common'
import { PricingService } from './pricing.service'
import { UpdatePricingDto } from './dto/update-pricing.dto'
import { SuperUserGuard } from 'src/auth/guards/super-user.guard'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { AccessTokenGuard } from 'src/auth/guards/access-token.guard'
import { CalculatePricingDto } from './dto/calculate-pricing.dto'

@Controller('pricing')
@ApiTags('Admin', 'Pricing')
// @UseGuards(AccessTokenGuard)
@ApiBearerAuth()
export class PricingController {
  constructor(private readonly pricingService: PricingService) {}

  @Get('')
  @UseGuards(AccessTokenGuard, SuperUserGuard)
  async getPricing() {
    return await this.pricingService.getPricing()
  }

  @Put()
  @UseGuards(AccessTokenGuard, SuperUserGuard)
  async updatePricing(@Body() updatePricingDto: UpdatePricingDto) {
    return await this.pricingService.update(updatePricingDto)
  }

  @Post('calculate')
  async calculatePricing(@Body() calculatePricingDto: CalculatePricingDto) {
    return await this.pricingService.calculatePricing(calculatePricingDto)
  }
}
