import { Test, TestingModule } from '@nestjs/testing'
import { PricingService } from './pricing.service'
import { getRepositoryToken } from '@nestjs/typeorm'
import { Pricing } from './entities/pricing-entity'
import { Repository } from 'typeorm'
import { CreatePricingDto } from './dto/create-pricing-dto'
import { UpdatePricingDto } from './dto/update-pricing.dto'
import { CalculatePricingDto } from './dto/calculate-pricing.dto'
import { BadRequestException, NotFoundException } from '@nestjs/common'

describe('PricingService', () => {
  let service: PricingService
  let pricingRepository: jest.Mocked<Repository<Pricing>>

  const createMockPricing = (data: Partial<Pricing> = {}): Pricing =>
    ({
      id: 'pricing-id',
      employee: 0,
      month: 0,
      snacking: 0,
      wellBeing: 0,
      teambuilding: 0,
      basePrice: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      hasId: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
      softRemove: jest.fn(),
      recover: jest.fn(),
      reload: jest.fn(),
      ...data,
    }) as Pricing

  beforeEach(async () => {
    const mockPricingRepository = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PricingService,
        {
          provide: getRepositoryToken(Pricing),
          useValue: mockPricingRepository,
        },
      ],
    }).compile()

    service = module.get<PricingService>(PricingService)
    pricingRepository = module.get(getRepositoryToken(Pricing))
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('create', () => {
    it('should create a new pricing', async () => {
      const createPricingDto: CreatePricingDto = {
        employee: 100,
        month: 1,
        snacking: 10,
        wellBeing: 20,
        teambuilding: 50,
      }

      const mockPricing = createMockPricing(createPricingDto)

      pricingRepository.create.mockReturnValue(mockPricing)
      pricingRepository.save.mockResolvedValue(mockPricing)

      const result = await service.create(createPricingDto)

      expect(result).toEqual(mockPricing)
      expect(pricingRepository.create).toHaveBeenCalledWith(createPricingDto)
      expect(pricingRepository.save).toHaveBeenCalledWith(mockPricing)
    })

    it('should throw BadRequestException when saving fails', async () => {
      const createPricingDto: CreatePricingDto = {
        employee: 100,
        month: 1,
        snacking: 10,
        teambuilding: 50,
        wellBeing: 20,
      }

      pricingRepository.create.mockReturnValue(createMockPricing())
      pricingRepository.save.mockRejectedValue(new Error('Database error'))

      await expect(service.create(createPricingDto)).rejects.toThrow(
        BadRequestException,
      )
    })
  })

  describe('getPricing', () => {
    it('should return existing pricing configuration', async () => {
      const mockPricing = createMockPricing({
        employee: 100,
        month: 1,
        snacking: 10,
        wellBeing: 20,
        teambuilding: 50,
      })

      pricingRepository.find.mockResolvedValue([mockPricing])

      const result = await service.getPricing()

      expect(result).toEqual(mockPricing)
      expect(pricingRepository.find).toHaveBeenCalledWith({
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
    })

    it('should create default pricing when no configuration exists', async () => {
      const defaultPricing = createMockPricing()

      pricingRepository.find.mockResolvedValue([])
      pricingRepository.create.mockReturnValue(defaultPricing)
      pricingRepository.save.mockResolvedValue(defaultPricing)

      const result = await service.getPricing()

      expect(result).toEqual(defaultPricing)
      expect(pricingRepository.create).toHaveBeenCalledWith({})
      expect(pricingRepository.save).toHaveBeenCalledWith(defaultPricing)
    })
  })

  describe('update', () => {
    it('should update an existing pricing', async () => {
      const updatePricingDto: UpdatePricingDto = {
        employee: 150,
        snacking: 15,
        wellBeing: 25,
        teambuilding: 55,
      }

      const existingPricing = createMockPricing({
        employee: 100,
        month: 1,
        snacking: 10,
        wellBeing: 20,
        teambuilding: 50,
      })

      const updatedPricing = createMockPricing({
        ...existingPricing,
        ...updatePricingDto,
      })

      pricingRepository.find.mockResolvedValue([existingPricing])
      ;(existingPricing.save as jest.Mock).mockResolvedValue(updatedPricing)

      const result = await service.update(updatePricingDto)

      expect(result).toEqual(updatedPricing)
      expect(pricingRepository.find).toHaveBeenCalled()
    })

    it('should throw NotFoundException when no pricing exists', async () => {
      const updatePricingDto: UpdatePricingDto = {
        employee: 150,
        snacking: 15,
        wellBeing: 25,
        teambuilding: 55,
      }

      pricingRepository.find.mockResolvedValue([])

      await expect(service.update(updatePricingDto)).rejects.toThrow(
        NotFoundException,
      )
    })
  })

  describe('calculatePricing', () => {
    const mockPricing = createMockPricing({
      employee: 100,
      month: 1,
      snacking: 10,
      wellBeing: 20,
      teambuilding: 50,
      basePrice: 100,
    })

    beforeEach(() => {
      pricingRepository.find.mockResolvedValue([mockPricing])
    })

    it('should calculate total price with all services', async () => {
      const calculatePricingDto: CalculatePricingDto = {
        snackingFrequency: 2,
        wellBeingFrequency: 1,
        numberOfParticipants: 10,
        months: 6,
        snacking: true,
        teambuilding: true,
        wellBeing: true,
      }

      const result = await service.calculatePricing(calculatePricingDto)

      const basePrice =
        mockPricing.basePrice *
        calculatePricingDto.numberOfParticipants *
        calculatePricingDto.months
      const snackingPrice =
        calculatePricingDto.numberOfParticipants *
        calculatePricingDto.months *
        calculatePricingDto.snackingFrequency *
        mockPricing.snacking
      const teambuildingPrice =
        calculatePricingDto.numberOfParticipants *
        calculatePricingDto.months *
        mockPricing.teambuilding
      const wellBeingPrice =
        calculatePricingDto.numberOfParticipants *
        calculatePricingDto.months *
        calculatePricingDto.wellBeingFrequency *
        mockPricing.wellBeing

      const expectedTotal =
        basePrice + snackingPrice + teambuildingPrice + wellBeingPrice

      expect(result).toBe(expectedTotal)
    })

    it('should calculate price with only base price when no services selected', async () => {
      const calculatePricingDto: CalculatePricingDto = {
        snackingFrequency: 0,
        wellBeingFrequency: 0,
        numberOfParticipants: 10,
        months: 6,
        snacking: false,
        teambuilding: false,
        wellBeing: false,
      }

      const result = await service.calculatePricing(calculatePricingDto)

      const expectedTotal =
        mockPricing.basePrice *
        calculatePricingDto.numberOfParticipants *
        calculatePricingDto.months

      expect(result).toBe(expectedTotal)
    })

    it('should throw NotFoundException when no pricing configuration exists', async () => {
      pricingRepository.find.mockResolvedValue([])

      const calculatePricingDto: CalculatePricingDto = {
        snackingFrequency: 2,
        wellBeingFrequency: 1,
        numberOfParticipants: 10,
        months: 6,
        snacking: true,
        teambuilding: true,
        wellBeing: true,
      }

      await expect(
        service.calculatePricing(calculatePricingDto),
      ).rejects.toThrow(NotFoundException)
    })

    it('should throw BadRequestException for invalid input values', async () => {
      const calculatePricingDto: CalculatePricingDto = {
        snackingFrequency: -1,
        wellBeingFrequency: 1,
        numberOfParticipants: 0,
        months: 6,
        snacking: true,
        teambuilding: true,
        wellBeing: true,
      }

      await expect(
        service.calculatePricing(calculatePricingDto),
      ).rejects.toThrow(BadRequestException)
    })
  })
})
