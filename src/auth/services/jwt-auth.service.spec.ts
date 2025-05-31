import { Test, TestingModule } from '@nestjs/testing'
import { JwtAuthService } from './jwt-auth.service'
import { getRepositoryToken } from '@nestjs/typeorm'
import { RefreshToken } from '../entities/refresh-token.entity'
import { JwtService, TokenExpiredError } from '@nestjs/jwt'
import { ConfigService } from '@app/config'
import { UserService } from 'src/user/user.service'
import { CACHE_MANAGER } from '@nestjs/cache-manager'
import { Cache } from 'cache-manager'
import { Repository } from 'typeorm'
import { UserDto } from '../dto/user.dto'
import { UserRoles } from 'src/user/enums/user-roles.enum'
import { RedisTokenTypes } from '../enums/token-types.enum'
import {
  ForbiddenException,
  UnprocessableEntityException,
} from '@nestjs/common'
import Redis from 'ioredis'

describe('JwtAuthService', () => {
  let service: JwtAuthService
  let refreshTokenRepository: Repository<RefreshToken>
  let jwtService: JwtService
  let configService: ConfigService
  let userService: UserService
  let cacheService: Cache
  let redisClient: Redis

  const mockRefreshTokenRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
  }

  const mockJwtService = {
    signAsync: jest.fn(),
    verifyAsync: jest.fn(),
    verify: jest.fn(),
  }

  const mockConfigService = {
    get: jest.fn(),
  }

  const mockUserService = {
    getOneById: jest.fn(),
  }

  const mockCacheService = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtAuthService,
        {
          provide: getRepositoryToken(RefreshToken),
          useValue: mockRefreshTokenRepository,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: UserService,
          useValue: mockUserService,
        },
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheService,
        },
      ],
    }).compile()

    service = module.get<JwtAuthService>(JwtAuthService)
    refreshTokenRepository = module.get<Repository<RefreshToken>>(
      getRepositoryToken(RefreshToken),
    )
    jwtService = module.get<JwtService>(JwtService)
    configService = module.get<ConfigService>(ConfigService)
    userService = module.get<UserService>(UserService)
    cacheService = module.get<Cache>(CACHE_MANAGER)

    // Mock Redis client
    redisClient = new Redis()
    jest.spyOn(redisClient, 'keys').mockResolvedValue(['token-key'])
    jest.spyOn(redisClient, 'del').mockResolvedValue(1)
    jest.spyOn(redisClient, 'set').mockResolvedValue('OK')
    jest.spyOn(redisClient, 'expire').mockResolvedValue(1)

    // Configure Redis mock
    mockConfigService.get.mockImplementation((key: string) => {
      switch (key) {
        case 'REDIS_HOST':
          return 'localhost'
        case 'REDIS_PORT':
          return 6379
        case 'REDIS_PASSWORD':
          return 'password'
        default:
          return null
      }
    })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('generateAccessToken', () => {
    it('should generate access token and store in Redis', async () => {
      const mockUser = {
        id: 'user-123',
        metadata: {
          role: UserRoles.CLIENT,
          email: 'test@example.com',
        },
      }

      const mockToken = 'generated-access-token'
      mockJwtService.signAsync.mockResolvedValue(mockToken)

      const result = await service.generateAccessToken(mockUser)

      expect(result).toBe(mockToken)
      expect(mockJwtService.signAsync).toHaveBeenCalledWith(
        { sub: mockUser.id, metadata: mockUser.metadata },
        { expiresIn: expect.any(Number) },
      )
      expect(redisClient.set).toHaveBeenCalled()
    })

    it('should handle token generation error', async () => {
      const mockUser = {
        id: 'user-123',
        metadata: {
          role: UserRoles.CLIENT,
          email: 'test@example.com',
        },
      }

      mockJwtService.signAsync.mockRejectedValue(new Error('Token error'))

      await expect(service.generateAccessToken(mockUser)).rejects.toThrow(
        UnprocessableEntityException,
      )
    })

    it('should handle Redis storage error', async () => {
      const mockUser = {
        id: 'user-123',
        metadata: {
          role: UserRoles.CLIENT,
          email: 'test@example.com',
        },
      }

      const mockToken = 'generated-access-token'
      mockJwtService.signAsync.mockResolvedValue(mockToken)
      jest.spyOn(redisClient, 'set').mockRejectedValue(new Error('Redis error'))

      await expect(service.generateAccessToken(mockUser)).rejects.toThrow(
        UnprocessableEntityException,
      )
    })
  })

  describe('generateRefreshToken', () => {
    const mockUser: UserDto = {
      id: 'user-123',
      metadata: {
        email: 'test@example.com',
        role: UserRoles.CLIENT,
      },
    }

    it('should generate refresh token successfully', async () => {
      const mockRefreshToken = {
        id: 'refresh-token-123',
        user: mockUser,
        expires: new Date(),
      }
      const mockToken = 'mock-refresh-token'

      mockRefreshTokenRepository.create.mockReturnValue(mockRefreshToken)
      mockRefreshTokenRepository.save.mockResolvedValue(mockRefreshToken)
      mockJwtService.signAsync.mockResolvedValue(mockToken)

      const result = await service.generateRefreshToken(mockUser)

      expect(result).toBe(mockToken)
      expect(mockRefreshTokenRepository.create).toHaveBeenCalled()
      expect(mockRefreshTokenRepository.save).toHaveBeenCalled()
      expect(mockJwtService.signAsync).toHaveBeenCalledWith(
        {
          sub: mockUser.id,
          metadata: mockUser.metadata,
          jwtId: mockRefreshToken.id,
        },
        expect.any(Object),
      )
      expect(redisClient.set).toHaveBeenCalled()
      expect(redisClient.expire).toHaveBeenCalled()
    })

    it('should handle token generation error', async () => {
      const mockRefreshToken = {
        id: 'refresh-token-123',
        user: mockUser,
        expires: new Date(),
      }

      mockRefreshTokenRepository.create.mockReturnValue(mockRefreshToken)
      mockRefreshTokenRepository.save.mockResolvedValue(mockRefreshToken)
      mockJwtService.signAsync.mockRejectedValue(new Error('Token error'))

      await expect(service.generateRefreshToken(mockUser)).rejects.toThrow(
        UnprocessableEntityException,
      )
    })

    it('should handle repository save error', async () => {
      const mockRefreshToken = {
        id: 'refresh-token-123',
        user: mockUser,
        expires: new Date(),
      }

      mockRefreshTokenRepository.create.mockReturnValue(mockRefreshToken)
      mockRefreshTokenRepository.save.mockRejectedValue(
        new Error('Database error'),
      )

      await expect(service.generateRefreshToken(mockUser)).rejects.toThrow(
        UnprocessableEntityException,
      )
    })

    it('should handle Redis storage error', async () => {
      const mockRefreshToken = {
        id: 'refresh-token-123',
        user: mockUser,
        expires: new Date(),
      }
      const mockToken = 'mock-refresh-token'

      mockRefreshTokenRepository.create.mockReturnValue(mockRefreshToken)
      mockRefreshTokenRepository.save.mockResolvedValue(mockRefreshToken)
      mockJwtService.signAsync.mockResolvedValue(mockToken)
      jest.spyOn(redisClient, 'set').mockRejectedValue(new Error('Redis error'))

      await expect(service.generateRefreshToken(mockUser)).rejects.toThrow(
        UnprocessableEntityException,
      )
    })
  })

  describe('verifyToken', () => {
    it('should verify valid token', async () => {
      const mockToken = 'valid-token'
      const mockPayload = {
        sub: 'user-123',
        metadata: { role: 'CLIENT' },
      }

      mockJwtService.verifyAsync.mockResolvedValue(mockPayload)

      const result = await service.verifyToken(mockToken)

      expect(result).toEqual(mockPayload)
      expect(mockJwtService.verifyAsync).toHaveBeenCalledWith(mockToken)
    })

    it('should handle expired token', async () => {
      const mockToken = 'expired-token'

      mockJwtService.verifyAsync.mockRejectedValue(
        new TokenExpiredError('Token expired', new Date()),
      )

      await expect(service.verifyToken(mockToken)).rejects.toThrow(
        UnprocessableEntityException,
      )
    })

    it('should handle invalid token', async () => {
      const mockToken = 'invalid-token'

      mockJwtService.verifyAsync.mockRejectedValue(new Error('Invalid token'))

      await expect(service.verifyToken(mockToken)).rejects.toThrow(
        UnprocessableEntityException,
      )
    })
  })

  describe('generateEmailVerificationToken', () => {
    it('should generate email verification token and store in Redis', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
      }

      const mockToken = 'verification-token'
      mockJwtService.signAsync.mockResolvedValue(mockToken)

      const result = await service.generateEmailVerificationToken(mockUser)

      expect(result).toBe(mockToken)
      expect(mockJwtService.signAsync).toHaveBeenCalledWith(
        { sub: mockUser.id },
        { expiresIn: expect.any(Number) },
      )
      expect(redisClient.set).toHaveBeenCalled()
      expect(redisClient.expire).toHaveBeenCalled()
    })

    it('should handle token generation error', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
      }

      mockJwtService.signAsync.mockRejectedValue(new Error('Token error'))

      await expect(
        service.generateEmailVerificationToken(mockUser),
      ).rejects.toThrow(UnprocessableEntityException)
    })

    it('should handle Redis storage error', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
      }

      const mockToken = 'verification-token'
      mockJwtService.signAsync.mockResolvedValue(mockToken)
      jest.spyOn(redisClient, 'set').mockRejectedValue(new Error('Redis error'))

      await expect(
        service.generateEmailVerificationToken(mockUser),
      ).rejects.toThrow(UnprocessableEntityException)
    })
  })

  describe('verifyAccountValidationToken', () => {
    it('should verify valid account validation token', async () => {
      const mockToken = 'valid-token'
      const mockPayload = {
        sub: 'user-123',
      }

      mockJwtService.verify.mockReturnValue(mockPayload)

      const result = await service.verifyAccountValidationToken(mockToken)

      expect(result).toEqual(mockPayload)
      expect(mockJwtService.verify).toHaveBeenCalledWith(mockToken)
    })

    it('should handle expired token', async () => {
      const mockToken = 'expired-token'

      mockJwtService.verify.mockImplementation(() => {
        throw new TokenExpiredError('Token expired', new Date())
      })

      await expect(
        service.verifyAccountValidationToken(mockToken),
      ).rejects.toThrow(UnprocessableEntityException)
    })

    it('should handle invalid token', async () => {
      const mockToken = 'invalid-token'

      mockJwtService.verify.mockImplementation(() => {
        throw new Error('Invalid token')
      })

      await expect(
        service.verifyAccountValidationToken(mockToken),
      ).rejects.toThrow(UnprocessableEntityException)
    })
  })

  describe('searchAndDeleteTokensFromRedis', () => {
    it('should delete tokens from Redis successfully', async () => {
      const mockOptions = {
        userId: 'user-123',
        token: 'test-token',
        tokenType: RedisTokenTypes.ACCESS,
      }

      jest.spyOn(redisClient, 'keys').mockResolvedValue(['token1', 'token2'])
      jest.spyOn(redisClient, 'del').mockResolvedValue(2)

      await service.searchAndDeleteTokensFromRedis(mockOptions)

      expect(redisClient.keys).toHaveBeenCalled()
      expect(redisClient.del).toHaveBeenCalledWith('token1', 'token2')
    })

    it('should handle Redis search error', async () => {
      const mockOptions = {
        userId: 'user-123',
        token: 'test-token',
        tokenType: RedisTokenTypes.ACCESS,
      }

      jest
        .spyOn(redisClient, 'keys')
        .mockRejectedValue(new Error('Redis search error'))

      await expect(
        service.searchAndDeleteTokensFromRedis(mockOptions),
      ).rejects.toThrow(UnprocessableEntityException)
    })

    it('should handle Redis delete error', async () => {
      const mockOptions = {
        userId: 'user-123',
        token: 'test-token',
        tokenType: RedisTokenTypes.ACCESS,
      }

      jest.spyOn(redisClient, 'keys').mockResolvedValue(['token1', 'token2'])
      jest
        .spyOn(redisClient, 'del')
        .mockRejectedValue(new Error('Redis delete error'))

      await expect(
        service.searchAndDeleteTokensFromRedis(mockOptions),
      ).rejects.toThrow(UnprocessableEntityException)
    })
  })
})
