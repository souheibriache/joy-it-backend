import { validate } from 'class-validator'
import { ArticleFilterDto } from './article-filter.dto'
import { plainToInstance } from 'class-transformer'

describe('ArticleFilterDto', () => {
  it('should validate with valid values', async () => {
    const plainDto = {
      search: 'test',
      tags: ['tag1', 'tag2'],
    }

    const dto = plainToInstance(ArticleFilterDto, plainDto)
    const errors = await validate(dto)
    expect(errors.length).toBe(0)
    expect(dto.search).toBe('test')
    expect(dto.tags).toEqual(['tag1', 'tag2'])
  })

  it('should validate with empty values', async () => {
    const plainDto = {}

    const dto = plainToInstance(ArticleFilterDto, plainDto)
    const errors = await validate(dto)
    expect(errors.length).toBe(0)
  })

  it('should transform search value', async () => {
    const plainDto = {
      search: '  TEST SEARCH  ',
    }

    const dto = plainToInstance(ArticleFilterDto, plainDto)
    const errors = await validate(dto)
    expect(errors.length).toBe(0)
    expect(dto.search).toBe('test search')
  })

  it('should transform tags value from string', async () => {
    const plainDto = {
      tags: 'tag1,tag2,tag3',
    }

    const dto = plainToInstance(ArticleFilterDto, plainDto)
    const errors = await validate(dto)
    expect(errors.length).toBe(0)
    expect(dto.tags).toEqual(['tag1', 'tag2', 'tag3'])
  })

  it('should fail validation with non-string search', async () => {
    const plainDto = {
      search: 123,
    }

    const dto = plainToInstance(ArticleFilterDto, plainDto)
    const errors = await validate(dto)
    expect(errors.length).toBeGreaterThan(0)
    expect(
      errors.some(
        (error) => error.property === 'search' && error.constraints?.isString,
      ),
    ).toBe(true)
  })

  it('should fail validation with non-string tags', async () => {
    const plainDto = {
      tags: [123, 456],
    }

    const dto = plainToInstance(ArticleFilterDto, plainDto)
    const errors = await validate(dto)
    expect(errors.length).toBeGreaterThan(0)
    expect(errors.some((error) => error.property === 'tags')).toBe(true)
  })

  it('should fail validation with invalid tags type', async () => {
    const plainDto = {
      tags: 123,
    }

    const dto = plainToInstance(ArticleFilterDto, plainDto)
    const errors = await validate(dto)
    expect(errors.length).toBeGreaterThan(0)
    expect(
      errors.some(
        (error) => error.property === 'tags' && error.constraints?.isArray,
      ),
    ).toBe(true)
  })
})
