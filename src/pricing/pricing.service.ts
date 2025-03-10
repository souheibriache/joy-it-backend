import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Pricing } from './entities/pricing-entity'
import { CreatePricingDto } from './dto/create-pricing-dto'
import { UpdatePricingDto } from './dto/update-pricing.dto'
import { CalculatePricingDto } from './dto/calculate-pricing.dto'

@Injectable()
export class PricingService {
  constructor(
    @InjectRepository(Pricing)
    private readonly pricingRepository: Repository<Pricing>,
  ) {
    this.getPricing()
  }

  async create(createPricingDto: CreatePricingDto) {
    const pricing = await this.pricingRepository.create(createPricingDto)
    return await this.pricingRepository.save(pricing)
  }

  async getPricing() {
    const pricingExists = await this.pricingRepository.find()
    if (!pricingExists.length) {
      return await this.create({})
    }

    return pricingExists[0]
  }

  async update(updatePricingDto: UpdatePricingDto) {
    const pricing = await this.getPricing()
    await this.pricingRepository.update(pricing.id, updatePricingDto)
    return await this.getPricing()
  }

  async calculatePricing(parameters: CalculatePricingDto): Promise<number> {
    const {
      snackingFrequency,
      wellBeingFrequency,
      numberOfParticipants,
      months,
      snacking: snackingSelected,
      teambuilding: teambuildingSelected,
      wellBeing: wellBeingSelected,
    } = parameters

    const pricing = await this.getPricing()
    const { snacking, teambuilding, wellBeing, basePrice } = pricing

    let totalPrice = basePrice * numberOfParticipants * months

    if (snackingSelected) {
      totalPrice += numberOfParticipants * months * snackingFrequency * snacking
    }

    if (teambuildingSelected) {
      totalPrice += numberOfParticipants * months * teambuilding
    }

    if (wellBeingSelected) {
      totalPrice +=
        numberOfParticipants * months * wellBeingFrequency * wellBeing
    }

    return totalPrice
  }
}
