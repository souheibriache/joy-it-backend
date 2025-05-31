import { validate } from 'class-validator'
import { UpdateParagraphDto } from './update-paragraph.dto'
import { plainToInstance } from 'class-transformer'

describe('UpdateParagraphDto', () => {
  it('should validate with valid values', async () => {
    const plainDto = {
      content: 'Updated content',
      imageUrl: 'https://example.com/image.jpg',
    }

    const dto = plainToInstance(UpdateParagraphDto, plainDto)
    const errors = await validate(dto)
    expect(errors.length).toBe(0)
    expect(dto.content).toBe('Updated content')
    expect(dto.imageUrl).toBe('https://example.com/image.jpg')
  })

  it('should validate with only content field', async () => {
    const plainDto = {
      content: 'Updated content',
    }

    const dto = plainToInstance(UpdateParagraphDto, plainDto)
    const errors = await validate(dto)
    expect(errors.length).toBe(0)
    expect(dto.content).toBe('Updated content')
  })

  it('should validate with only imageUrl field', async () => {
    const plainDto = {
      imageUrl: 'https://example.com/image.jpg',
    }

    const dto = plainToInstance(UpdateParagraphDto, plainDto)
    const errors = await validate(dto)
    expect(errors.length).toBe(0)
    expect(dto.imageUrl).toBe('https://example.com/image.jpg')
  })

  it('should fail validation with empty content', async () => {
    const plainDto = {
      content: '',
    }

    const dto = plainToInstance(UpdateParagraphDto, plainDto)
    const errors = await validate(dto)
    expect(errors.length).toBeGreaterThan(0)
    expect(
      errors.some(
        (error) =>
          error.property === 'content' && error.constraints?.isNotEmpty,
      ),
    ).toBe(true)
  })

  it('should fail validation with invalid content type', async () => {
    const plainDto = {
      content: 123,
    }

    const dto = plainToInstance(UpdateParagraphDto, plainDto)
    const errors = await validate(dto)
    expect(errors.length).toBeGreaterThan(0)
    expect(
      errors.some(
        (error) => error.property === 'content' && error.constraints?.isString,
      ),
    ).toBe(true)
  })

  it('should fail validation with invalid imageUrl type', async () => {
    const plainDto = {
      imageUrl: 123,
    }

    const dto = plainToInstance(UpdateParagraphDto, plainDto)
    const errors = await validate(dto)
    expect(errors.length).toBeGreaterThan(0)
    expect(
      errors.some(
        (error) => error.property === 'imageUrl' && error.constraints?.isString,
      ),
    ).toBe(true)
  })

  it('should fail validation with invalid imageUrl format', async () => {
    const plainDto = {
      imageUrl: 'not-a-url',
    }

    const dto = plainToInstance(UpdateParagraphDto, plainDto)
    const errors = await validate(dto)
    expect(errors.length).toBeGreaterThan(0)
    expect(
      errors.some(
        (error) => error.property === 'imageUrl' && error.constraints?.isUrl,
      ),
    ).toBe(true)
  })
})
