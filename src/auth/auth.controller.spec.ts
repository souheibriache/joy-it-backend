import { Test, TestingModule } from '@nestjs/testing'
import { AuthController } from './auth.controller'
import { AuthService } from './services/auth.service'
import { SignupDto } from './dto/sign-up.dto'
import { LoginDto, RefreshTokenDto } from './dto'
import { VerifyAccountDto } from './dto/verify-account-dto'
import { ResendVerificationEmailDto } from './dto/resend-activation-email.dto'
import { UpdatePasswordDto } from './dto/update-password.dto'
import { RequestResetPasswordDto } from './dto/request-reset-password.dto'
import { ResetPasswordDto } from './dto/reset-password.dto'
import { UpdateUserDto } from './dto/update-profile.dto'
import { AccessTokenGuard } from './guards/access-token.guard'
import { IRequestWithUser } from '@app/common/interfaces/request-user.interface.dto'
import { Request } from 'express'

describe('AuthController', () => {
  let controller: AuthController
  let authService: AuthService

  const mockAuthService = {
    signup: jest.fn(),
    login: jest.fn(),
    loginAdmin: jest.fn(),
    verifyAccount: jest.fn(),
    resendVerificationEmail: jest.fn(),
    refreshToken: jest.fn(),
    getProfile: jest.fn(),
    updatePassword: jest.fn(),
    requestResetPassword: jest.fn(),
    resetPassword: jest.fn(),
    updateUserProfile: jest.fn(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    })
      .overrideGuard(AccessTokenGuard)
      .useValue({ canActivate: () => true })
      .compile()

    controller = module.get<AuthController>(AuthController)
    authService = module.get<AuthService>(AuthService)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })

  describe('signUp', () => {
    it('should create a new user', async () => {
      const signupDto: SignupDto = {
        userName: 'johndoe',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'Password123!',
      }
      const expectedResult = { message: 'Verifier votre boit mail' }

      mockAuthService.signup.mockResolvedValue(expectedResult)

      const result = await controller.signUp(signupDto)

      expect(result).toEqual(expectedResult)
      expect(mockAuthService.signup).toHaveBeenCalledWith(signupDto)
    })
  })

  describe('login', () => {
    it('should authenticate a user', async () => {
      const loginDto: LoginDto = {
        login: 'johndoe',
        password: 'Password123!',
      }
      const expectedResult = {
        access_token: 'access-token',
        refresh_token: 'refresh-token',
      }

      mockAuthService.login.mockResolvedValue(expectedResult)

      const result = await controller.login(loginDto)

      expect(result).toEqual(expectedResult)
      expect(mockAuthService.login).toHaveBeenCalledWith(loginDto)
    })
  })

  describe('adminLogin', () => {
    it('should authenticate an admin user', async () => {
      const loginDto: LoginDto = {
        login: 'admin@example.com',
        password: 'Password123!',
      }
      const expectedResult = {
        access_token: 'access-token',
        refresh_token: 'refresh-token',
      }

      mockAuthService.loginAdmin.mockResolvedValue(expectedResult)

      const result = await controller.adminLogin(loginDto)

      expect(result).toEqual(expectedResult)
      expect(mockAuthService.loginAdmin).toHaveBeenCalledWith(loginDto)
    })
  })

  describe('verifyAccount', () => {
    it('should verify a user account', async () => {
      const verifyAccountDto: VerifyAccountDto = {
        verificationToken: 'valid-token',
      }
      const expectedResult = {
        access_token: 'access-token',
        refresh_token: 'refresh-token',
      }

      mockAuthService.verifyAccount.mockResolvedValue(expectedResult)

      const result = await controller.verifyAccount(verifyAccountDto)

      expect(result).toEqual(expectedResult)
      expect(mockAuthService.verifyAccount).toHaveBeenCalledWith(
        verifyAccountDto,
      )
    })
  })

  describe('resendVerificationEmail', () => {
    it('should resend verification email', async () => {
      const resendVerificationEmailDto: ResendVerificationEmailDto = {
        email: 'john@example.com',
      }
      const expectedResult = { message: 'Verifier votre boit mail' }

      mockAuthService.resendVerificationEmail.mockResolvedValue(expectedResult)

      const result = await controller.resendVerificationEmail(
        resendVerificationEmailDto,
      )

      expect(result).toEqual(expectedResult)
      expect(mockAuthService.resendVerificationEmail).toHaveBeenCalledWith(
        resendVerificationEmailDto,
      )
    })
  })

  describe('refreshToken', () => {
    it('should refresh access token', async () => {
      const refreshTokenDto: RefreshTokenDto = {
        refreshToken: 'valid-refresh-token',
      }
      const expectedResult = { access_token: 'new-access-token' }

      mockAuthService.refreshToken.mockResolvedValue(expectedResult)

      const result = await controller.refreshToken(refreshTokenDto)

      expect(result).toEqual(expectedResult)
      expect(mockAuthService.refreshToken).toHaveBeenCalledWith(refreshTokenDto)
    })
  })

  describe('getMyProfile', () => {
    it('should get user profile', async () => {
      const mockRequest = {
        user: { id: 'user-123' },
      } as IRequestWithUser
      const expectedResult = {
        id: 'user-123',
        email: 'john@example.com',
        userName: 'johndoe',
      }

      mockAuthService.getProfile.mockResolvedValue(expectedResult)

      const result = await controller.getMyProfile(mockRequest)

      expect(result).toEqual(expectedResult)
      expect(mockAuthService.getProfile).toHaveBeenCalledWith(
        mockRequest.user.id,
      )
    })
  })

  describe('updatePassword', () => {
    it('should update user password', async () => {
      const updatePasswordDto: UpdatePasswordDto = {
        oldPassword: 'OldPassword123!',
        newPassword: 'NewPassword123!',
      }
      const mockRequest = {
        user: { id: 'user-123' },
      } as IRequestWithUser
      const expectedResult = { message: 'Password updated successfully' }

      mockAuthService.updatePassword.mockResolvedValue(expectedResult)

      const result = await controller.updatePassword(
        updatePasswordDto,
        mockRequest,
      )

      expect(result).toEqual(expectedResult)
      expect(mockAuthService.updatePassword).toHaveBeenCalledWith(
        mockRequest.user.id,
        updatePasswordDto,
      )
    })
  })

  describe('requestResetPassword', () => {
    it('should request password reset', async () => {
      const requestResetPasswordDto: RequestResetPasswordDto = {
        login: 'john@example.com',
      }
      const expectedResult = { message: 'Reset password email sent' }

      mockAuthService.requestResetPassword.mockResolvedValue(expectedResult)

      const result = await controller.requestResetPassword(
        requestResetPasswordDto,
      )

      expect(result).toEqual(expectedResult)
      expect(mockAuthService.requestResetPassword).toHaveBeenCalledWith(
        requestResetPasswordDto,
      )
    })
  })

  describe('resetPassword', () => {
    it('should reset user password', async () => {
      const resetPasswordDto: ResetPasswordDto = {
        token: 'valid-reset-token',
        password: 'NewPassword123!',
      }
      const expectedResult = { message: 'Password reset successfully' }

      mockAuthService.resetPassword.mockResolvedValue(expectedResult)

      const result = await controller.resetPassword(resetPasswordDto)

      expect(result).toEqual(expectedResult)
      expect(mockAuthService.resetPassword).toHaveBeenCalledWith(
        resetPasswordDto,
      )
    })
  })

  describe('updateProfile', () => {
    it('should update user profile', async () => {
      const updateUserDto: UpdateUserDto = {
        firstName: 'John',
        lastName: 'Doe',
        userName: 'johndoe',
      }
      const mockRequest = {
        user: { id: 'user-123' },
      } as IRequestWithUser
      const expectedResult = {
        id: 'user-123',
        firstName: 'John',
        lastName: 'Doe',
      }

      mockAuthService.updateUserProfile.mockResolvedValue(expectedResult)

      const result = await controller.updateProfile(updateUserDto, mockRequest)

      expect(result).toEqual(expectedResult)
      expect(mockAuthService.updateUserProfile).toHaveBeenCalledWith(
        mockRequest.user.id,
        updateUserDto,
      )
    })
  })
})
