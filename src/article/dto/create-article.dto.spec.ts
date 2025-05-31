import { validate } from 'class-validator'
import { CreateArticleDto } from './create-article.dto'
import { plainToInstance } from 'class-transformer'

describe('CreateArticleDto', () => {
  it('should validate a valid DTO with all fields', async () => {
    const plainDto = {
      title: 'Test Article',
      description: 'Test Description',
      paragraphs: [
        {
          content: 'Test content',
          imageUrl: 'https://example.com/image.jpg',
        },
      ],
      tags: ['tag1', 'tag2'],
    }

    const dto = plainToInstance(CreateArticleDto, plainDto)
    const errors = await validate(dto, { whitelist: true })
    expect(errors.length).toBe(0)
    expect(dto.title).toBe('Test Article')
    expect(dto.description).toBe('Test Description')
    expect(Array.isArray(dto.paragraphs)).toBe(true)
    expect(dto.paragraphs[0].content).toBe('Test content')
    expect(dto.paragraphs[0].imageUrl).toBe('https://example.com/image.jpg')
    expect(dto.tags).toEqual(['tag1', 'tag2'])
  })

  it('should validate with minimum required fields', async () => {
    const plainDto = {
      title: 'Test Article',
      description: 'Test Description',
      paragraphs: [
        {
          content: 'Test content',
        },
      ],
    }

    const dto = plainToInstance(CreateArticleDto, plainDto)
    const errors = await validate(dto, { whitelist: true })
    expect(errors.length).toBe(0)
  })

  it('should fail validation with invalid types', async () => {
    const plainDto = {
      title: 123,
      description: 456,
      paragraphs: 'not an array',
      tags: 'not an array',
    }

    const dto = plainToInstance(CreateArticleDto, plainDto)
    const errors = await validate(dto)
    expect(errors.length).toBeGreaterThan(0)
    expect(
      errors.some(
        (error) => error.property === 'title' && error.constraints?.isString,
      ),
    ).toBe(true)
    expect(
      errors.some(
        (error) =>
          error.property === 'description' && error.constraints?.isString,
      ),
    ).toBe(true)
    expect(
      errors.some(
        (error) =>
          error.property === 'paragraphs' && error.constraints?.isArray,
      ),
    ).toBe(true)
    expect(
      errors.some(
        (error) => error.property === 'tags' && error.constraints?.isArray,
      ),
    ).toBe(true)
  })

  it('should fail validation with empty required fields', async () => {
    const plainDto = {
      title: '',
      description: '',
      paragraphs: [],
    }

    const dto = plainToInstance(CreateArticleDto, plainDto)
    const errors = await validate(dto)
    expect(errors.length).toBeGreaterThan(0)
    expect(
      errors.some(
        (error) => error.property === 'title' && error.constraints?.isNotEmpty,
      ),
    ).toBe(true)
    expect(
      errors.some(
        (error) =>
          error.property === 'description' && error.constraints?.isNotEmpty,
      ),
    ).toBe(true)
    expect(
      errors.some(
        (error) =>
          error.property === 'paragraphs' && error.constraints?.arrayNotEmpty,
      ),
    ).toBe(true)
  })

  it('should fail validation with invalid paragraph structure', async () => {
    const plainDto = {
      title: 'Test Article',
      description: 'Test Description',
      paragraphs: [
        {
          // Missing required content field
          imageUrl: 'https://example.com/image.jpg',
        },
      ],
    }

    const dto = plainToInstance(CreateArticleDto, plainDto)
    const errors = await validate(dto, { whitelist: true })
    expect(errors.length).toBeGreaterThan(0)
    expect(errors.some((error) => error.property === 'paragraphs')).toBe(true)
  })

  it('should fail validation with invalid image URL', async () => {
    const plainDto = {
      title: 'Test Article',
      description: 'Test Description',
      paragraphs: [
        {
          content: 'Test content',
          imageUrl: 'not-a-url',
        },
      ],
    }

    const dto = plainToInstance(CreateArticleDto, plainDto)
    const errors = await validate(dto, { whitelist: true })
    expect(errors.length).toBeGreaterThan(0)
    expect(errors.some((error) => error.property === 'paragraphs')).toBe(true)
  })
})
