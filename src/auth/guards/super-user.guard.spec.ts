import { Test, TestingModule } from '@nestjs/testing'
import { SuperUserGuard } from './super-user.guard'
import { ModuleRef } from '@nestjs/core'
import { AuthService } from '../services/auth.service'
import { ExecutionContext, UnauthorizedException } from '@nestjs/common'
import { createMock } from '@golevelup/ts-jest'

describe('SuperUserGuard', () => {
  let guard: SuperUserGuard
  let moduleRef: ModuleRef
  let authService: AuthService

  const mockAuthService = {
    isSuperUser: jest.fn(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SuperUserGuard,
        {
          provide: ModuleRef,
          useValue: {
            get: jest.fn().mockReturnValue(mockAuthService),
          },
        },
      ],
    }).compile()

    guard = module.get<SuperUserGuard>(SuperUserGuard)
    moduleRef = module.get<ModuleRef>(ModuleRef)
    authService = moduleRef.get(AuthService)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(guard).toBeDefined()
  })

  describe('canActivate', () => {
    it('should allow access for super user', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'admin@example.com',
        role: 'ADMIN',
        permissions: ['SUPER_USER'],
      }

      const mockRequest = {
        user: mockUser,
      }

      const mockContext = createMock<ExecutionContext>({
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
      })

      mockAuthService.isSuperUser.mockResolvedValue(true)

      const result = await guard.canActivate(mockContext)

      expect(result).toBe(true)
      expect(authService.isSuperUser).toHaveBeenCalledWith(mockUser.id)
    })

    it('should deny access for non-super user', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'user@example.com',
        role: 'USER',
        permissions: [],
      }

      const mockRequest = {
        user: mockUser,
      }

      const mockContext = createMock<ExecutionContext>({
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
      })

      mockAuthService.isSuperUser.mockResolvedValue(false)

      const result = await guard.canActivate(mockContext)

      expect(result).toBe(false)
      expect(authService.isSuperUser).toHaveBeenCalledWith(mockUser.id)
    })

    it('should initialize authService if not already initialized', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'admin@example.com',
        role: 'ADMIN',
      }

      const mockRequest = {
        user: mockUser,
      }

      const mockContext = createMock<ExecutionContext>({
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
      })

      mockAuthService.isSuperUser.mockResolvedValue(true)

      // Reset the service to test initialization
      guard['authService'] = undefined

      await guard.canActivate(mockContext)

      expect(moduleRef.get).toHaveBeenCalledWith(AuthService, {
        strict: false,
      })
      expect(authService.isSuperUser).toHaveBeenCalledWith(mockUser.id)
    })

    it('should handle missing user in request', async () => {
      const mockRequest = {}

      const mockContext = createMock<ExecutionContext>({
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
      })

      const result = await guard.canActivate(mockContext)

      expect(result).toBe(false)
      expect(authService.isSuperUser).not.toHaveBeenCalled()
    })

    it('should handle null request object', async () => {
      const mockContext = createMock<ExecutionContext>({
        switchToHttp: () => ({
          getRequest: () => null,
        }),
      })

      const result = await guard.canActivate(mockContext)

      expect(result).toBe(false)
      expect(authService.isSuperUser).not.toHaveBeenCalled()
    })

    it('should handle service error gracefully', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'admin@example.com',
        role: 'ADMIN',
      }

      const mockRequest = {
        user: mockUser,
      }

      const mockContext = createMock<ExecutionContext>({
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
      })

      mockAuthService.isSuperUser.mockRejectedValue(new Error('Service error'))

      const result = await guard.canActivate(mockContext)

      expect(result).toBe(false)
      expect(authService.isSuperUser).toHaveBeenCalledWith(mockUser.id)
    })

    it('should handle invalid user ID', async () => {
      const mockUser = {
        id: null,
        email: 'admin@example.com',
        role: 'ADMIN',
      }

      const mockRequest = {
        user: mockUser,
      }

      const mockContext = createMock<ExecutionContext>({
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
      })

      const result = await guard.canActivate(mockContext)

      expect(result).toBe(false)
      expect(authService.isSuperUser).not.toHaveBeenCalled()
    })

    it('should handle malformed user object', async () => {
      const mockRequest = {
        user: 'invalid-user-object',
      }

      const mockContext = createMock<ExecutionContext>({
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
      })

      const result = await guard.canActivate(mockContext)

      expect(result).toBe(false)
      expect(authService.isSuperUser).not.toHaveBeenCalled()
    })

    it('should handle undefined user object', async () => {
      const mockRequest = {
        user: undefined,
      }

      const mockContext = createMock<ExecutionContext>({
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
      })

      const result = await guard.canActivate(mockContext)

      expect(result).toBe(false)
      expect(authService.isSuperUser).not.toHaveBeenCalled()
    })

    it('should handle non-object user value', async () => {
      const mockRequest = {
        user: 123,
      }

      const mockContext = createMock<ExecutionContext>({
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
      })

      const result = await guard.canActivate(mockContext)

      expect(result).toBe(false)
      expect(authService.isSuperUser).not.toHaveBeenCalled()
    })
  })
})
