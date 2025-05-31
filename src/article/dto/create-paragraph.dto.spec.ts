import { validate } from 'class-validator'
import { CreateParagraphDto } from './create-paragraph.dto'
import { plainToInstance } from 'class-transformer'

describe('CreateParagraphDto', () => {
  it('should validate a valid DTO with all fields', async () => {
    const dto = plainToInstance(CreateParagraphDto, {
      title: 'Test Paragraph',
      content: 'Test Content',
      subtitle: 'Test Subtitle',
      imageIndex: 1,
      imageUrl: 'http://example.com/image.jpg',
    })

    const errors = await validate(dto)
    expect(errors.length).toBe(0)
  })

  it('should validate with only required fields', async () => {
    const dto = plainToInstance(CreateParagraphDto, {
      title: 'Test Paragraph',
      content: 'Test Content',
    })

    const errors = await validate(dto)
    expect(errors.length).toBe(0)
  })

  it('should fail validation with missing required fields', async () => {
    const dto = plainToInstance(CreateParagraphDto, {})

    const errors = await validate(dto)
    expect(errors.length).toBeGreaterThan(0)
    expect(errors.map((error) => error.property)).toContain('title')
    expect(errors.map((error) => error.property)).toContain('content')
  })

  it('should fail validation with empty required fields', async () => {
    const dto = plainToInstance(CreateParagraphDto, {
      title: '',
      content: '',
    })

    const errors = await validate(dto)
    expect(errors.length).toBeGreaterThan(0)
    expect(
      errors.some(
        (error) => error.property === 'title' && error.constraints?.isNotEmpty,
      ),
    ).toBeTruthy()
    expect(
      errors.some(
        (error) =>
          error.property === 'content' && error.constraints?.isNotEmpty,
      ),
    ).toBeTruthy()
  })

  it('should fail validation with invalid types', async () => {
    const dto = plainToInstance(CreateParagraphDto, {
      title: 123,
      content: {},
      subtitle: [],
      imageIndex: 'not-a-number',
      imageUrl: true,
    })

    const errors = await validate(dto)
    expect(errors.length).toBeGreaterThan(0)
    expect(
      errors.some(
        (error) => error.property === 'title' && error.constraints?.isString,
      ),
    ).toBeTruthy()
    expect(
      errors.some(
        (error) => error.property === 'content' && error.constraints?.isString,
      ),
    ).toBeTruthy()
    expect(
      errors.some(
        (error) => error.property === 'subtitle' && error.constraints?.isString,
      ),
    ).toBeTruthy()
    expect(
      errors.some(
        (error) =>
          error.property === 'imageIndex' && error.constraints?.isNumber,
      ),
    ).toBeTruthy()
    expect(
      errors.some(
        (error) => error.property === 'imageUrl' && error.constraints?.isString,
      ),
    ).toBeTruthy()
  })

  it('should validate with optional fields as undefined', async () => {
    const dto = plainToInstance(CreateParagraphDto, {
      title: 'Test Paragraph',
      content: 'Test Content',
      subtitle: undefined,
      imageIndex: undefined,
      imageUrl: undefined,
    })

    const errors = await validate(dto)
    expect(errors.length).toBe(0)
  })

  it('should validate with optional fields as null', async () => {
    const dto = plainToInstance(CreateParagraphDto, {
      title: 'Test Paragraph',
      content: 'Test Content',
      subtitle: null,
      imageIndex: null,
      imageUrl: null,
    })

    const errors = await validate(dto)
    expect(errors.length).toBe(0)
  })
})
