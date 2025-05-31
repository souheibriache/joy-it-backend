import { validate } from 'class-validator'
import { plainToInstance } from 'class-transformer'
import { NewsletterFilterDto } from './newsletter-filter.dto'

describe('NewsletterFilterDto', () => {
  it('should validate a valid DTO with all fields', async () => {
    const plainDto = {
      search: 'test newsletter',
    }

    const dto = plainToInstance(NewsletterFilterDto, plainDto)
    const errors = await validate(dto)
    expect(errors.length).toBe(0)
    expect(dto.search).toBe('test newsletter')
  })

  it('should handle undefined search value', async () => {
    const plainDto = {}

    const dto = plainToInstance(NewsletterFilterDto, plainDto)
    const errors = await validate(dto)
    expect(errors.length).toBe(0)
    expect(dto.search).toBeUndefined()
  })

  it('should handle empty search value', async () => {
    const plainDto = {
      search: '',
    }

    const dto = plainToInstance(NewsletterFilterDto, plainDto)
    const errors = await validate(dto)
    expect(errors.length).toBe(0)
    expect(dto.search).toBe('')
  })

  it('should fail validation with non-string search value', async () => {
    const plainDto = {
      search: 123,
    }

    const dto = plainToInstance(NewsletterFilterDto, plainDto)
    const errors = await validate(dto)
    expect(errors.length).toBeGreaterThan(0)
    expect(errors[0].property).toBe('search')
  })

  it('should trim and lowercase search value', async () => {
    const plainDto = {
      search: '  Test Newsletter  ',
    }

    const dto = plainToInstance(NewsletterFilterDto, plainDto)
    const errors = await validate(dto)
    expect(errors.length).toBe(0)
    expect(dto.search).toBe('test newsletter')
  })
})
