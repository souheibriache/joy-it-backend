import { validate } from 'class-validator'
import { plainToInstance } from 'class-transformer'
import { NewsletterOptionsDto } from './newsletter-options.dto'
import { OrderOptionsDto } from '@app/pagination/dto'
import { Order } from '@app/pagination/constants'

describe('NewsletterOptionsDto', () => {
  it('should validate a valid DTO with all fields', async () => {
    const plainDto = {
      page: 1,
      take: 10,
      search: 'test newsletter',
      sort: {
        createdAt: Order.DESC,
      },
    }

    const dto = plainToInstance(NewsletterOptionsDto, plainDto)
    const errors = await validate(dto)
    expect(errors.length).toBe(0)
    expect(dto.page).toBe(1)
    expect(dto.take).toBe(10)
    expect(dto.search).toBe('test newsletter')
    expect(dto.sort).toEqual({ createdAt: Order.DESC })
  })

  it('should handle undefined optional fields', async () => {
    const plainDto = {
      page: 1,
      take: 10,
    }

    const dto = plainToInstance(NewsletterOptionsDto, plainDto)
    const errors = await validate(dto)
    expect(errors.length).toBe(0)
    expect(dto.search).toBeUndefined()
    expect(dto.sort).toBeUndefined()
  })

  it('should fail validation with invalid page number', async () => {
    const plainDto = {
      page: -1,
      take: 10,
    }

    const dto = plainToInstance(NewsletterOptionsDto, plainDto)
    const errors = await validate(dto)
    expect(errors.length).toBeGreaterThan(0)
    expect(errors[0].property).toBe('page')
  })

  it('should fail validation with invalid take number', async () => {
    const plainDto = {
      page: 1,
      take: 0,
    }

    const dto = plainToInstance(NewsletterOptionsDto, plainDto)
    const errors = await validate(dto)
    expect(errors.length).toBeGreaterThan(0)
    expect(errors[0].property).toBe('take')
  })

  it('should fail validation with non-string search value', async () => {
    const plainDto = {
      page: 1,
      take: 10,
      search: 123,
    }

    const dto = plainToInstance(NewsletterOptionsDto, plainDto)
    const errors = await validate(dto)
    expect(errors.length).toBeGreaterThan(0)
    expect(errors[0].property).toBe('search')
  })

  it('should handle empty search value', async () => {
    const plainDto = {
      page: 1,
      take: 10,
      search: '',
    }

    const dto = plainToInstance(NewsletterOptionsDto, plainDto)
    const errors = await validate(dto)
    expect(errors.length).toBe(0)
    expect(dto.search).toBe('')
  })

  it('should validate sort options', async () => {
    const plainDto = {
      page: 1,
      take: 10,
      sort: {
        createdAt: Order.ASC,
        email: Order.DESC,
      },
    }

    const dto = plainToInstance(NewsletterOptionsDto, plainDto)
    const errors = await validate(dto)
    expect(errors.length).toBe(0)
    expect(dto.sort).toEqual({
      createdAt: Order.ASC,
      email: Order.DESC,
    })
  })
})
