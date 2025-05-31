import { validate } from 'class-validator'
import { ActivityFilterDto } from './activity-filter.dto'
import { plainToInstance } from 'class-transformer'
import { ActivityType } from '../enums/activity-type.enum'

describe('ActivityFilterDto', () => {
  it('should validate a valid DTO with all fields', async () => {
    const plainDto = {
      search: 'test activity',
      isAvailable: 'true',
    }

    const dto = plainToInstance(ActivityFilterDto, plainDto)
    const errors = await validate(dto)
    expect(errors.length).toBe(0)
    expect(dto.search).toBe('test activity')
    expect(dto.isAvailable).toBe(true)
  })

  it('should handle undefined search value', async () => {
    const plainDto = {
      isAvailable: 'true',
    }

    const dto = plainToInstance(ActivityFilterDto, plainDto)
    const errors = await validate(dto)
    expect(errors.length).toBe(0)
    expect(dto.search).toBeUndefined()
  })

  it('should handle empty search value', async () => {
    const plainDto = {
      search: '',
    }

    const dto = plainToInstance(ActivityFilterDto, plainDto)
    const errors = await validate(dto)
    expect(errors.length).toBe(0)
    expect(dto.search).toBe('')
  })

  it('should fail validation with non-string search value', async () => {
    const plainDto = {
      search: 123,
    }

    const dto = plainToInstance(ActivityFilterDto, plainDto)
    const errors = await validate(dto)
    expect(errors.length).toBeGreaterThan(0)
    expect(errors.some((error) => error.property === 'search')).toBe(true)
  })

  it('should transform isAvailable to boolean', async () => {
    const plainDto = {
      isAvailable: 'true',
    }

    const dto = plainToInstance(ActivityFilterDto, plainDto)
    const errors = await validate(dto)
    expect(errors.length).toBe(0)
    expect(dto.isAvailable).toBe(true)
  })

  it('should handle undefined isAvailable', async () => {
    const plainDto = {}

    const dto = plainToInstance(ActivityFilterDto, plainDto)
    const errors = await validate(dto)
    expect(errors.length).toBe(0)
    expect(dto.isAvailable).toBeUndefined()
  })

  it('should validate with empty object', async () => {
    const dto = plainToInstance(ActivityFilterDto, {})

    const errors = await validate(dto)
    expect(errors.length).toBe(0)
  })

  it('should transform search string to lowercase and trim', async () => {
    const dto = plainToInstance(ActivityFilterDto, {
      search: '  TEST ACTIVITY  ',
    })

    expect(dto.search).toBe('test activity')
  })

  it('should fail validation with invalid activity type', async () => {
    const dto = plainToInstance(ActivityFilterDto, {
      types: ['INVALID_TYPE'],
    })

    const errors = await validate(dto)
    expect(errors.length).toBeGreaterThan(0)
    expect(errors.some((error) => error.property === 'types')).toBeTruthy()
  })

  it('should transform duration values to numbers', async () => {
    const dto = plainToInstance(ActivityFilterDto, {
      durationMin: '30',
      durationMax: '120',
    })

    expect(typeof dto.durationMin).toBe('number')
    expect(typeof dto.durationMax).toBe('number')
    expect(dto.durationMin).toBe(30)
    expect(dto.durationMax).toBe(120)
  })

  it('should transform invalid duration values to null', async () => {
    const dto = plainToInstance(ActivityFilterDto, {
      durationMin: 'invalid',
      durationMax: 'invalid',
    })

    expect(dto.durationMin).toBeNull()
    expect(dto.durationMax).toBeNull()
  })

  it('should validate with unique activity types', async () => {
    const dto = plainToInstance(ActivityFilterDto, {
      types: [ActivityType.TEAM_BUILDING, ActivityType.BIEN_ETRE],
    })

    const errors = await validate(dto)
    expect(errors.length).toBe(0)
  })

  it('should fail validation with duplicate activity types', async () => {
    const dto = plainToInstance(ActivityFilterDto, {
      types: [ActivityType.TEAM_BUILDING, ActivityType.TEAM_BUILDING],
    })

    const errors = await validate(dto)
    expect(errors.length).toBeGreaterThan(0)
    expect(errors.some((error) => error.property === 'types')).toBeTruthy()
  })
})
