import { validate } from 'class-validator'
import { ArticleOptionsDto } from './article-options.dto'
import { plainToInstance } from 'class-transformer'
import { OrderOptionsDto } from '@app/pagination/dto'
import { ArticleFilterDto } from './article-filter.dto'
import { Order } from '@app/pagination/constants'

describe('ArticleOptionsDto', () => {
  it('should validate a valid DTO with all fields', async () => {
    const dto = plainToInstance(ArticleOptionsDto, {
      page: 1,
      take: 10,
      query: {
        search: 'test article',
        tags: ['tag1', 'tag2'],
      },
      sort: {
        createdAt: Order.DESC,
      },
      orderBy: 'title',
    })

    const errors = await validate(dto)
    expect(errors.length).toBe(0)
    expect(dto.skip).toBe(0)
  })

  it('should validate with only pagination fields', async () => {
    const dto = plainToInstance(ArticleOptionsDto, {
      page: 1,
      take: 10,
    })

    const errors = await validate(dto)
    expect(errors.length).toBe(0)
    expect(dto.skip).toBe(0)
  })

  it('should validate with query filter', async () => {
    const dto = plainToInstance(ArticleOptionsDto, {
      page: 1,
      take: 10,
      query: {
        search: 'test article',
        tags: ['tag1', 'tag2'],
      },
    })

    const errors = await validate(dto)
    expect(errors.length).toBe(0)
  })

  it('should validate with sort options', async () => {
    const dto = plainToInstance(ArticleOptionsDto, {
      page: 1,
      take: 10,
      sort: {
        createdAt: Order.ASC,
        id: Order.DESC,
      },
    })

    const errors = await validate(dto)
    expect(errors.length).toBe(0)
  })

  it('should validate with orderBy field', async () => {
    const dto = plainToInstance(ArticleOptionsDto, {
      page: 1,
      take: 10,
      orderBy: 'title',
    })

    const errors = await validate(dto)
    expect(errors.length).toBe(0)
  })

  it('should fail validation with invalid query type', async () => {
    const dto = plainToInstance(ArticleOptionsDto, {
      page: 1,
      take: 10,
      query: 'invalid-query',
    })

    const errors = await validate(dto)
    expect(errors.length).toBeGreaterThan(0)
    expect(errors.some((error) => error.property === 'query')).toBe(true)
  })

  it('should fail validation with invalid sort type', async () => {
    const dto = plainToInstance(ArticleOptionsDto, {
      page: 1,
      take: 10,
      sort: 'invalid-sort',
    })

    const errors = await validate(dto)
    expect(errors.length).toBeGreaterThan(0)
    expect(errors.some((error) => error.property === 'sort')).toBe(true)
  })

  it('should fail validation with invalid orderBy type', async () => {
    const dto = plainToInstance(ArticleOptionsDto, {
      page: 1,
      take: 10,
      orderBy: 123,
    })

    const errors = await validate(dto)
    expect(errors.length).toBeGreaterThan(0)
    expect(
      errors.some(
        (error) => error.property === 'orderBy' && error.constraints?.isString,
      ),
    ).toBe(true)
  })
})
