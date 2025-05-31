import { Test, TestingModule } from '@nestjs/testing'
import { AccessTokenGuard } from './access-token.guard'
import { JwtAuthService } from '../services/jwt-auth.service'
import { ExecutionContext, UnauthorizedException } from '@nestjs/common'
import { ModuleRef } from '@nestjs/core'

describe('AccessTokenGuard', () => {
  let guard: AccessTokenGuard
  let jwtAuthService: JwtAuthService
  let moduleRef: ModuleRef

  const mockJwtAuthService = {
    verifyToken: jest.fn(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccessTokenGuard,
        {
          provide: ModuleRef,
          useValue: {
            get: jest.fn().mockReturnValue(mockJwtAuthService),
          },
        },
      ],
    }).compile()

    guard = module.get<AccessTokenGuard>(AccessTokenGuard)
    moduleRef = module.get<ModuleRef>(ModuleRef)
    jwtAuthService = moduleRef.get(JwtAuthService)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('canActivate', () => {
    it('should allow access with valid token', async () => {
      const mockPayload = {
        sub: 'user-123',
        email: 'test@example.com',
        role: 'user',
        metadata: {
          lastLogin: '2023-01-01',
        },
        permissions: ['read', 'write'],
      }

      const mockRequest = {
        headers: {
          authorization: 'Bearer valid-token',
        },
      }

      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
      } as ExecutionContext

      mockJwtAuthService.verifyToken.mockResolvedValue(mockPayload)

      const result = await guard.canActivate(mockContext)

      expect(result).toBe(true)
      expect(mockRequest['user']).toEqual({
        id: mockPayload.sub,
        email: mockPayload.email,
        role: mockPayload.role,
        metadata: mockPayload.metadata,
        permissions: mockPayload.permissions,
      })
      expect(jwtAuthService.verifyToken).toHaveBeenCalledWith('valid-token')
    })

    it('should allow access with minimal payload', async () => {
      const mockPayload = {
        sub: 'user-123',
      }

      const mockRequest = {
        headers: {
          authorization: 'Bearer valid-token',
        },
      }

      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
      } as ExecutionContext

      mockJwtAuthService.verifyToken.mockResolvedValue(mockPayload)

      const result = await guard.canActivate(mockContext)

      expect(result).toBe(true)
      expect(mockRequest['user']).toEqual({
        id: mockPayload.sub,
      })
    })

    it('should throw UnauthorizedException when no token provided', async () => {
      const mockRequest = {
        headers: {},
      }

      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
      } as ExecutionContext

      await expect(guard.canActivate(mockContext)).rejects.toThrow(
        UnauthorizedException,
      )
      expect(jwtAuthService.verifyToken).not.toHaveBeenCalled()
    })

    it('should throw UnauthorizedException when authorization header is empty', async () => {
      const mockRequest = {
        headers: {
          authorization: '',
        },
      }

      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
      } as ExecutionContext

      await expect(guard.canActivate(mockContext)).rejects.toThrow(
        UnauthorizedException,
      )
      expect(jwtAuthService.verifyToken).not.toHaveBeenCalled()
    })

    it('should throw UnauthorizedException when token format is invalid', async () => {
      const mockRequest = {
        headers: {
          authorization: 'invalid-format',
        },
      }

      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
      } as ExecutionContext

      await expect(guard.canActivate(mockContext)).rejects.toThrow(
        UnauthorizedException,
      )
      expect(jwtAuthService.verifyToken).not.toHaveBeenCalled()
    })

    it('should throw UnauthorizedException when token is invalid', async () => {
      const mockRequest = {
        headers: {
          authorization: 'Bearer invalid-token',
        },
      }

      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
      } as ExecutionContext

      mockJwtAuthService.verifyToken.mockResolvedValue(null)

      await expect(guard.canActivate(mockContext)).rejects.toThrow(
        UnauthorizedException,
      )
      expect(jwtAuthService.verifyToken).toHaveBeenCalledWith('invalid-token')
    })

    it('should throw UnauthorizedException when token verification fails', async () => {
      const mockRequest = {
        headers: {
          authorization: 'Bearer expired-token',
        },
      }

      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
      } as ExecutionContext

      mockJwtAuthService.verifyToken.mockRejectedValue(
        new Error('Token expired'),
      )

      await expect(guard.canActivate(mockContext)).rejects.toThrow(
        UnauthorizedException,
      )
      expect(jwtAuthService.verifyToken).toHaveBeenCalledWith('expired-token')
    })

    it('should handle missing request object', async () => {
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => null,
        }),
      } as ExecutionContext

      await expect(guard.canActivate(mockContext)).rejects.toThrow(
        UnauthorizedException,
      )
      expect(jwtAuthService.verifyToken).not.toHaveBeenCalled()
    })

    it('should handle malformed token payload', async () => {
      const mockRequest = {
        headers: {
          authorization: 'Bearer malformed-token',
        },
      }

      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
      } as ExecutionContext

      mockJwtAuthService.verifyToken.mockResolvedValue({})

      await expect(guard.canActivate(mockContext)).rejects.toThrow(
        UnauthorizedException,
      )
      expect(jwtAuthService.verifyToken).toHaveBeenCalledWith('malformed-token')
    })

    it('should initialize jwtAuthService if not already initialized', async () => {
      const mockPayload = {
        sub: 'user-123',
        email: 'test@example.com',
        role: 'user',
      }

      const mockRequest = {
        headers: {
          authorization: 'Bearer valid-token',
        },
      }

      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
      } as ExecutionContext

      mockJwtAuthService.verifyToken.mockResolvedValue(mockPayload)

      // Reset the service to test initialization
      guard['jwtAuthService'] = undefined

      await guard.canActivate(mockContext)

      expect(moduleRef.get).toHaveBeenCalledWith(JwtAuthService, {
        strict: false,
      })
    })

    it('should handle non-string token value', async () => {
      const mockRequest = {
        headers: {
          authorization: 'Bearer ' + 123,
        },
      }

      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
      } as ExecutionContext

      await expect(guard.canActivate(mockContext)).rejects.toThrow(
        UnauthorizedException,
      )
      expect(jwtAuthService.verifyToken).not.toHaveBeenCalled()
    })
  })
})
