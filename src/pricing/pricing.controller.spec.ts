import { Test, TestingModule } from '@nestjs/testing'
import { PricingController } from './pricing.controller'
import { PricingService } from './pricing.service'
import { getRepositoryToken } from '@nestjs/typeorm'
import { Pricing } from './entities/pricing-entity'
import { UpdatePricingDto } from './dto/update-pricing.dto'
import { CalculatePricingDto } from './dto/calculate-pricing.dto'
import { BadRequestException, NotFoundException } from '@nestjs/common'

describe('PricingController', () => {
  let controller: PricingController
  let service: PricingService

  const mockPricingService = {
    getPricing: jest.fn(),
    update: jest.fn(),
    calculatePricing: jest.fn(),
    create: jest.fn(),
  }

  beforeEach(async () => {
    const mockPricingRepository = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
    }

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PricingController],
      providers: [
        {
          provide: PricingService,
          useValue: mockPricingService,
        },
        {
          provide: getRepositoryToken(Pricing),
          useValue: mockPricingRepository,
        },
      ],
    }).compile()

    controller = module.get<PricingController>(PricingController)
    service = module.get<PricingService>(PricingService)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })

  describe('getPricing', () => {
    it('should return pricing', async () => {
      const mockPricing = {
        id: 'pricing-id',
        employee: 100,
        snacking: 10,
        wellBeing: 20,
        teambuilding: 50,
        basePrice: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Pricing

      mockPricingService.getPricing.mockResolvedValue(mockPricing)

      const result = await controller.getPricing()

      expect(result).toEqual(mockPricing)
      expect(service.getPricing).toHaveBeenCalled()
    })

    it('should handle errors when getting pricing', async () => {
      mockPricingService.getPricing.mockRejectedValue(
        new BadRequestException('Failed to get pricing'),
      )

      await expect(controller.getPricing()).rejects.toThrow(BadRequestException)
    })
  })

  describe('updatePricing', () => {
    it('should update pricing', async () => {
      const updatePricingDto: UpdatePricingDto = {
        employee: 150,
        snacking: 15,
        teambuilding: 75,
        wellBeing: 25,
      }

      const updatedPricing = {
        id: 'pricing-id',
        ...updatePricingDto,
        basePrice: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Pricing

      mockPricingService.update.mockResolvedValue(updatedPricing)

      const result = await controller.updatePricing(updatePricingDto)

      expect(result).toEqual(updatedPricing)
      expect(service.update).toHaveBeenCalledWith(updatePricingDto)
    })

    it('should handle not found error when updating pricing', async () => {
      const updatePricingDto: UpdatePricingDto = {
        employee: 150,
        snacking: 15,
        teambuilding: 75,
        wellBeing: 25,
      }

      mockPricingService.update.mockRejectedValue(
        new NotFoundException('Pricing not found'),
      )

      await expect(controller.updatePricing(updatePricingDto)).rejects.toThrow(
        NotFoundException,
      )
    })

    it('should handle validation errors when updating pricing', async () => {
      const updatePricingDto: UpdatePricingDto = {
        employee: -1, // Invalid value
        snacking: 15,
        teambuilding: 75,
        wellBeing: 25,
      }

      mockPricingService.update.mockRejectedValue(
        new BadRequestException('Invalid input values'),
      )

      await expect(controller.updatePricing(updatePricingDto)).rejects.toThrow(
        BadRequestException,
      )
    })
  })

  describe('calculatePricing', () => {
    it('should calculate pricing', async () => {
      const calculatePricingDto: CalculatePricingDto = {
        snackingFrequency: 2,
        wellBeingFrequency: 1,
        numberOfParticipants: 10,
        months: 6,
        snacking: true,
        teambuilding: true,
        wellBeing: true,
      }

      const expectedTotal = 10000

      mockPricingService.calculatePricing.mockResolvedValue(expectedTotal)

      const result = await controller.calculatePricing(calculatePricingDto)

      expect(result).toBe(expectedTotal)
      expect(service.calculatePricing).toHaveBeenCalledWith(calculatePricingDto)
    })

    it('should handle not found error when calculating pricing', async () => {
      const calculatePricingDto: CalculatePricingDto = {
        snackingFrequency: 2,
        wellBeingFrequency: 1,
        numberOfParticipants: 10,
        months: 6,
        snacking: true,
        teambuilding: true,
        wellBeing: true,
      }

      mockPricingService.calculatePricing.mockRejectedValue(
        new NotFoundException('Pricing configuration not found'),
      )

      await expect(
        controller.calculatePricing(calculatePricingDto),
      ).rejects.toThrow(NotFoundException)
    })

    it('should handle validation errors when calculating pricing', async () => {
      const calculatePricingDto: CalculatePricingDto = {
        snackingFrequency: -1, // Invalid value
        wellBeingFrequency: 1,
        numberOfParticipants: 10,
        months: 6,
        snacking: true,
        teambuilding: true,
        wellBeing: true,
      }

      mockPricingService.calculatePricing.mockRejectedValue(
        new BadRequestException('Invalid input values'),
      )

      await expect(
        controller.calculatePricing(calculatePricingDto),
      ).rejects.toThrow(BadRequestException)
    })
  })
})
