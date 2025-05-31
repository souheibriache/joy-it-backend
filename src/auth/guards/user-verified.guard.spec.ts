import { Test, TestingModule } from '@nestjs/testing'
import { UserVerifiedGuard } from './user-verified.guard'
import { ClientService } from 'src/client/client.service'
import { ExecutionContext } from '@nestjs/common'
import { UserRoles } from 'src/user/enums/user-roles.enum'

describe('UserVerifiedGuard', () => {
  let guard: UserVerifiedGuard
  let clientService: ClientService

  const mockClientService = {
    isVerified: jest.fn(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserVerifiedGuard,
        {
          provide: ClientService,
          useValue: mockClientService,
        },
      ],
    }).compile()

    guard = module.get<UserVerifiedGuard>(UserVerifiedGuard)
    clientService = module.get<ClientService>(ClientService)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('canActivate', () => {
    it('should allow access for verified client', async () => {
      const mockUser = {
        id: 'user-123',
        role: UserRoles.CLIENT,
      }

      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            user: mockUser,
          }),
        }),
      } as ExecutionContext

      mockClientService.isVerified.mockResolvedValue(true)

      const result = await guard.canActivate(mockContext)

      expect(result).toBe(true)
      expect(clientService.isVerified).toHaveBeenCalledWith(mockUser.id)
    })

    it('should deny access for unverified client', async () => {
      const mockUser = {
        id: 'user-123',
        role: UserRoles.CLIENT,
      }

      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            user: mockUser,
          }),
        }),
      } as ExecutionContext

      mockClientService.isVerified.mockResolvedValue(false)

      const result = await guard.canActivate(mockContext)

      expect(result).toBe(false)
      expect(clientService.isVerified).toHaveBeenCalledWith(mockUser.id)
    })

    it('should allow access for admin user', async () => {
      const mockUser = {
        id: 'user-123',
        role: UserRoles.ADMIN,
      }

      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            user: mockUser,
          }),
        }),
      } as ExecutionContext

      const result = await guard.canActivate(mockContext)

      expect(result).toBe(true)
      expect(clientService.isVerified).not.toHaveBeenCalled()
    })

    it('should handle malformed user object', async () => {
      const mockUser = {
        role: UserRoles.CLIENT,
        // Missing id
      }

      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            user: mockUser,
          }),
        }),
      } as ExecutionContext

      const result = await guard.canActivate(mockContext)

      expect(result).toBe(false)
      expect(clientService.isVerified).not.toHaveBeenCalled()
    })

    it('should handle undefined user object', async () => {
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            user: undefined,
          }),
        }),
      } as ExecutionContext

      const result = await guard.canActivate(mockContext)

      expect(result).toBe(false)
      expect(clientService.isVerified).not.toHaveBeenCalled()
    })

    it('should handle missing request user', async () => {
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({}),
        }),
      } as ExecutionContext

      const result = await guard.canActivate(mockContext)

      expect(result).toBe(false)
      expect(clientService.isVerified).not.toHaveBeenCalled()
    })
  })
})
