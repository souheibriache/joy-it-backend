import { Test, TestingModule } from '@nestjs/testing'
import { JwtStrategy } from './jwt.strategy'
import { ConfigService } from '@nestjs/config'
import { UserService } from 'src/user/user.service'
import { UnauthorizedException } from '@nestjs/common'

describe('JwtStrategy', () => {
  let strategy: JwtStrategy
  let userService: UserService

  const mockConfigService = {
    get: jest.fn().mockReturnValue('test-secret'),
  }

  const mockUserService = {
    getOneById: jest.fn(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: UserService,
          useValue: mockUserService,
        },
      ],
    }).compile()

    strategy = module.get<JwtStrategy>(JwtStrategy)
    userService = module.get<UserService>(UserService)
  })

  it('should be defined', () => {
    expect(strategy).toBeDefined()
  })

  describe('validate', () => {
    it('should return user for valid payload', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
      }

      const payload = {
        sub: mockUser.id,
        email: mockUser.email,
      }

      mockUserService.getOneById.mockResolvedValue(mockUser)

      const result = await strategy.validate(payload)

      expect(result).toEqual(mockUser)
      expect(mockUserService.getOneById).toHaveBeenCalledWith(mockUser.id)
    })

    it('should return null when user not found', async () => {
      const payload = {
        sub: 'non-existent-id',
        email: 'test@example.com',
      }

      mockUserService.getOneById.mockResolvedValue(null)

      const result = await strategy.validate(payload)

      expect(result).toBeNull()
      expect(mockUserService.getOneById).toHaveBeenCalledWith('non-existent-id')
    })

    it('should handle service errors gracefully', async () => {
      const payload = {
        sub: 'user-123',
        email: 'test@example.com',
      }

      mockUserService.getOneById.mockRejectedValue(new Error('Database error'))

      await expect(strategy.validate(payload)).rejects.toThrow(Error)
      expect(mockUserService.getOneById).toHaveBeenCalledWith('user-123')
    })
  })
})
