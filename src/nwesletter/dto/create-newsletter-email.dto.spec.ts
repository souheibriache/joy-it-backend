import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { NewsletterEmailDto } from './create-newsletter-email.dto'

describe('NewsletterEmailDto', () => {
  it('should pass validation with valid email', async () => {
    const dto = plainToInstance(NewsletterEmailDto, {
      email: 'test@example.com',
    })

    const errors = await validate(dto)
    expect(errors.length).toBe(0)
  })

  it('should fail validation with missing email', async () => {
    const dto = plainToInstance(NewsletterEmailDto, {})

    const errors = await validate(dto)
    expect(errors.length).toBeGreaterThan(0)
    expect(errors[0].property).toBe('email')
    expect(errors[0].constraints).toHaveProperty('isEmail')
  })

  it('should fail validation with invalid email format', async () => {
    const dto = plainToInstance(NewsletterEmailDto, {
      email: 'invalid-email',
    })

    const errors = await validate(dto)
    expect(errors.length).toBeGreaterThan(0)
    expect(errors[0].property).toBe('email')
    expect(errors[0].constraints).toHaveProperty('isEmail')
  })

  it('should fail validation with non-string email', async () => {
    const dto = plainToInstance(NewsletterEmailDto, {
      email: 123,
    })

    const errors = await validate(dto)
    expect(errors.length).toBeGreaterThan(0)
    expect(errors[0].property).toBe('email')
    expect(errors[0].constraints).toHaveProperty('isString')
  })

  it('should handle undefined email', async () => {
    const dto = plainToInstance(NewsletterEmailDto, {
      email: undefined,
    })

    const errors = await validate(dto)
    expect(errors.length).toBeGreaterThan(0)
    expect(errors[0].property).toBe('email')
  })

  it('should validate various email formats', async () => {
    const validEmails = [
      'simple@example.com',
      'very.common@example.com',
      'disposable.style.email.with+symbol@example.com',
      'other.email-with-hyphen@example.com',
      'fully-qualified-domain@example.com',
      'user.name+tag+sorting@example.com',
      'x@example.com',
      'example-indeed@strange-example.com',
      'example@s.example',
    ]

    for (const email of validEmails) {
      const dto = plainToInstance(NewsletterEmailDto, { email })
      const errors = await validate(dto)
      expect(errors.length).toBe(0)
    }
  })

  it('should reject invalid email formats', async () => {
    const invalidEmails = [
      'Abc.example.com',
      'A@b@c@example.com',
      'a"b(c)d,e:f;g<h>i[j\\k]l@example.com',
      'just"not"right@example.com',
      'this is"not\\allowed@example.com',
      'this\\ still\\"not\\\\allowed@example.com',
      'i_like_underscore@but_its_not_allowed_in_this_part.example.com',
    ]

    for (const email of invalidEmails) {
      const dto = plainToInstance(NewsletterEmailDto, { email })
      const errors = await validate(dto)
      expect(errors.length).toBeGreaterThan(0)
      expect(errors[0].property).toBe('email')
      expect(errors[0].constraints).toHaveProperty('isEmail')
    }
  })
})
