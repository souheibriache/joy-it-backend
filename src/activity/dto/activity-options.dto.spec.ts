import { validate } from 'class-validator'
import { ActivityOptionsDto } from './activity-options.dto'
import { plainToInstance } from 'class-transformer'
import { ActivityType } from '../enums/activity-type.enum'
import { Order } from '@app/pagination/constants'

describe('ActivityOptionsDto', () => {
  it('should validate with valid values', async () => {
    const plainDto = {
      page: 1,
      take: 10,
      search: 'test',
      sort: { createdAt: Order.DESC },
      type: ActivityType.TEAM_BUILDING,
    }

    const dto = plainToInstance(ActivityOptionsDto, plainDto)
    const errors = await validate(dto)
    expect(errors.length).toBe(0)
  })

  it('should validate with empty values', async () => {
    const plainDto = {}

    const dto = plainToInstance(ActivityOptionsDto, plainDto)
    const errors = await validate(dto)
    expect(errors.length).toBe(0)
  })

  it('should transform search value', async () => {
    const plainDto = {
      search: '  TEST SEARCH  ',
    }

    const dto = plainToInstance(ActivityOptionsDto, plainDto)
    const errors = await validate(dto)
    expect(errors.length).toBe(0)
    expect(dto.search).toBe('test search')
  })

  it('should fail validation with invalid sort type', async () => {
    const plainDto = {
      sort: 'invalid-sort',
    }

    const dto = plainToInstance(ActivityOptionsDto, plainDto)
    const errors = await validate(dto)
    expect(errors.length).toBeGreaterThan(0)
    expect(errors.some((error) => error.property === 'sort')).toBe(true)
  })

  it('should fail validation with invalid activity type', async () => {
    const plainDto = {
      type: 'invalid-type',
    }

    const dto = plainToInstance(ActivityOptionsDto, plainDto)
    const errors = await validate(dto)
    expect(errors.length).toBeGreaterThan(0)
    expect(
      errors.some(
        (error) => error.property === 'type' && error.constraints?.isEnum,
      ),
    ).toBe(true)
  })

  it('should fail validation with invalid number types', async () => {
    const plainDto = {
      page: '1',
      take: '10',
    }

    const dto = plainToInstance(ActivityOptionsDto, plainDto)
    const errors = await validate(dto)
    expect(errors.length).toBeGreaterThan(0)
    expect(
      errors.some(
        (error) => error.property === 'page' && error.constraints?.isNumber,
      ),
    ).toBe(true)
    expect(
      errors.some(
        (error) => error.property === 'take' && error.constraints?.isNumber,
      ),
    ).toBe(true)
  })

  it('should fail validation with negative numbers', async () => {
    const plainDto = {
      page: -1,
      take: -10,
    }

    const dto = plainToInstance(ActivityOptionsDto, plainDto)
    const errors = await validate(dto)
    expect(errors.length).toBeGreaterThan(0)
    expect(
      errors.some(
        (error) => error.property === 'page' && error.constraints?.min,
      ),
    ).toBe(true)
    expect(
      errors.some(
        (error) => error.property === 'take' && error.constraints?.min,
      ),
    ).toBe(true)
  })

  it('should fail validation with invalid search type', async () => {
    const plainDto = {
      search: 123,
    }

    const dto = plainToInstance(ActivityOptionsDto, plainDto)
    const errors = await validate(dto)
    expect(errors.length).toBeGreaterThan(0)
    expect(
      errors.some(
        (error) => error.property === 'search' && error.constraints?.isString,
      ),
    ).toBe(true)
  })
})
