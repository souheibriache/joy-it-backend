import { validate } from 'class-validator'
import { SignupDto } from './sign-up.dto'
import { LoginDto } from './login.dto'

describe('Auth DTOs', () => {
  describe('SignupDto', () => {
    it('should validate a valid signup DTO', async () => {
      const dto = new SignupDto()
      dto.userName = 'johndoe'
      dto.firstName = 'John'
      dto.lastName = 'Doe'
      dto.email = 'john@example.com'
      dto.password = 'Password123!'

      const errors = await validate(dto)
      expect(errors.length).toBe(0)
    })

    it('should fail validation when userName is missing', async () => {
      const dto = new SignupDto()
      dto.firstName = 'John'
      dto.lastName = 'Doe'
      dto.email = 'john@example.com'
      dto.password = 'Password123!'

      const errors = await validate(dto)
      expect(errors.length).toBeGreaterThan(0)
      expect(errors[0].property).toBe('userName')
    })

    it('should fail validation when firstName is missing', async () => {
      const dto = new SignupDto()
      dto.userName = 'johndoe'
      dto.lastName = 'Doe'
      dto.email = 'john@example.com'
      dto.password = 'Password123!'

      const errors = await validate(dto)
      expect(errors.length).toBeGreaterThan(0)
      expect(errors[0].property).toBe('firstName')
    })

    it('should fail validation when lastName is missing', async () => {
      const dto = new SignupDto()
      dto.userName = 'johndoe'
      dto.firstName = 'John'
      dto.email = 'john@example.com'
      dto.password = 'Password123!'

      const errors = await validate(dto)
      expect(errors.length).toBeGreaterThan(0)
      expect(errors[0].property).toBe('lastName')
    })

    it('should fail validation when email is missing', async () => {
      const dto = new SignupDto()
      dto.userName = 'johndoe'
      dto.firstName = 'John'
      dto.lastName = 'Doe'
      dto.password = 'Password123!'

      const errors = await validate(dto)
      expect(errors.length).toBeGreaterThan(0)
      expect(errors[0].property).toBe('email')
    })

    it('should fail validation when password is missing', async () => {
      const dto = new SignupDto()
      dto.userName = 'johndoe'
      dto.firstName = 'John'
      dto.lastName = 'Doe'
      dto.email = 'john@example.com'

      const errors = await validate(dto)
      expect(errors.length).toBeGreaterThan(0)
      expect(errors[0].property).toBe('password')
    })

    it('should fail validation when fields are not strings', async () => {
      const dto = new SignupDto()
      ;(dto as any).userName = 123
      ;(dto as any).firstName = true
      ;(dto as any).lastName = {}
      ;(dto as any).email = []
      ;(dto as any).password = null

      const errors = await validate(dto)
      expect(errors.length).toBe(5)
      expect(errors.map((error) => error.property)).toEqual([
        'userName',
        'firstName',
        'lastName',
        'email',
        'password',
      ])
    })
  })

  describe('LoginDto', () => {
    it('should validate a valid login DTO', async () => {
      const dto = new LoginDto()
      dto.login = 'johndoe'
      dto.password = 'Password123!'

      const errors = await validate(dto)
      expect(errors.length).toBe(0)
    })

    it('should fail validation when login is missing', async () => {
      const dto = new LoginDto()
      dto.password = 'Password123!'

      const errors = await validate(dto)
      expect(errors.length).toBeGreaterThan(0)
      expect(errors[0].property).toBe('login')
    })

    it('should fail validation when password is missing', async () => {
      const dto = new LoginDto()
      dto.login = 'johndoe'

      const errors = await validate(dto)
      expect(errors.length).toBeGreaterThan(0)
      expect(errors[0].property).toBe('password')
    })

    it('should fail validation when fields are not strings', async () => {
      const dto = new LoginDto()
      ;(dto as any).login = 123
      ;(dto as any).password = true

      const errors = await validate(dto)
      expect(errors.length).toBe(2)
      expect(errors.map((error) => error.property)).toEqual([
        'login',
        'password',
      ])
    })
  })
})
