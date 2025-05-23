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
    const pricingExists = await this.pricingRepository.find({
      select: {
        employee: true,
        snacking: true,
        wellBeing: true,
        teambuilding: true,
      },
      order: {
        createdAt: 'desc',
      },
    })
    if (!pricingExists.length) {
      return await this.create({})
    }

    return pricingExists[0]
  }

  async update(updatePricingDto: UpdatePricingDto) {
    const pricing = await this.getPricing()
    pricing.employee = updatePricingDto.employee
    pricing.snacking = updatePricingDto.snacking
    pricing.teambuilding = updatePricingDto.teambuilding
    pricing.wellBeing = updatePricingDto.wellBeing
    return await pricing.save()
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

    let totalPrice = (basePrice || 1) * numberOfParticipants * months

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
