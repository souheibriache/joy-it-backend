import { Test, TestingModule } from '@nestjs/testing'
import { AuthService } from './auth.service'
import { getRepositoryToken } from '@nestjs/typeorm'
import { Password } from '../entities/password-history'
import { UserService } from 'src/user/user.service'
import { ClientService } from 'src/client/client.service'
import { MailerService } from '@app/mailer'
import { JwtAuthService } from './jwt-auth.service'
import { Repository, UpdateResult } from 'typeorm'
import { SignupDto } from '../dto/sign-up.dto'
import { LoginDto } from '../dto'
import { User } from 'src/user/entities'
import { Client } from 'src/client/entities'
import {
  BadRequestException,
  ForbiddenException,
  UnprocessableEntityException,
  NotFoundException,
} from '@nestjs/common'
import { UserRoles } from 'src/user/enums/user-roles.enum'
import * as bcrypt from 'bcryptjs'
import { RedisTokenTypes } from '../enums/token-types.enum'
import { UpdateUserDto } from '../dto/update-profile.dto'

jest.mock('bcryptjs')

describe('AuthService', () => {
  let service: AuthService
  let passwordRepository: Repository<Password>
  let userService: UserService
  let clientService: ClientService
  let mailerService: MailerService
  let jwtAuthService: JwtAuthService

  const baseMockUser = {
    id: 'user-123',
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    userName: 'johndoe',
    role: UserRoles.CLIENT,
    isSuperUser: false,
    isVerified: true,
    refreshTokens: [],
    articles: [],
    passwords: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    hasId: () => true,
    save: jest.fn(),
    remove: jest.fn(),
    softRemove: jest.fn(),
    recover: jest.fn(),
    reload: jest.fn(),
  }

  const mockUser = baseMockUser as unknown as User

  const baseMockPassword = {
    id: 'password-123',
    hash: 'hashedPassword',
    user: mockUser,
    isCurrent: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    hasId: () => true,
    save: jest.fn(),
    remove: jest.fn(),
    softRemove: jest.fn(),
    recover: jest.fn(),
    reload: jest.fn(),
  }

  const mockPassword = baseMockPassword as unknown as Password

  const mockPasswordRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    find: jest.fn(),
  }

  const mockUserService = {
    findOne: jest.fn(),
    findAll: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  }

  const mockClientService = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    isVerified: jest.fn(),
  }

  const mockMailerService = {
    sendSingle: jest.fn(),
  }

  const mockJwtAuthService = {
    generateEmailVerificationToken: jest.fn(),
    verifyAccountValidationToken: jest.fn(),
    generateAccessToken: jest.fn(),
    generateRefreshToken: jest.fn(),
    resolveRefreshToken: jest.fn(),
    searchAndDeleteTokensFromRedis: jest.fn(),
    generateResetPasswordToken: jest.fn(),
    verifyResetPasswordToken: jest.fn(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(Password),
          useValue: mockPasswordRepository,
        },
        {
          provide: UserService,
          useValue: mockUserService,
        },
        {
          provide: ClientService,
          useValue: mockClientService,
        },
        {
          provide: MailerService,
          useValue: mockMailerService,
        },
        {
          provide: JwtAuthService,
          useValue: mockJwtAuthService,
        },
      ],
    }).compile()

    service = module.get<AuthService>(AuthService)
    passwordRepository = module.get<Repository<Password>>(
      getRepositoryToken(Password),
    )
    userService = module.get<UserService>(UserService)
    clientService = module.get<ClientService>(ClientService)
    mailerService = module.get<MailerService>(MailerService)
    jwtAuthService = module.get<JwtAuthService>(JwtAuthService)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('signup', () => {
    const signupDto: SignupDto = {
      email: 'test@example.com',
      password: 'Password123!',
      firstName: 'John',
      lastName: 'Doe',
      userName: 'johndoe',
    }

    it('should create a new user successfully', async () => {
      const mockClient = {
        id: 'client-123',
        email: signupDto.email,
        firstName: signupDto.firstName,
        lastName: signupDto.lastName,
        userName: signupDto.userName,
        save: jest.fn(),
      }

      mockUserService.findAll.mockResolvedValue([])
      mockClientService.create.mockResolvedValue(mockClient)
      mockPasswordRepository.create.mockReturnValue({ user: mockClient })
      mockPasswordRepository.save.mockResolvedValue({ id: 'password-123' })
      mockJwtAuthService.generateEmailVerificationToken.mockResolvedValue(
        'token',
      )
      mockMailerService.sendSingle.mockResolvedValue(true)

      const result = await service.signup(signupDto)

      expect(result).toEqual({ message: 'Verifier votre boit mail' })
      expect(mockUserService.findAll).toHaveBeenCalledWith({
        email: signupDto.email,
      })
      expect(mockClientService.create).toHaveBeenCalled()
      expect(mockPasswordRepository.save).toHaveBeenCalled()
      expect(mockMailerService.sendSingle).toHaveBeenCalled()
    })

    it('should throw BadRequestException if user already exists', async () => {
      mockUserService.findAll.mockResolvedValue([{ id: 'existing-user' }])

      await expect(service.signup(signupDto)).rejects.toThrow(
        BadRequestException,
      )
    })
  })

  describe('verifyAccount', () => {
    const verifyAccountDto = {
      verificationToken: 'valid-token',
    }

    it('should verify account successfully', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        role: UserRoles.CLIENT,
        isVerified: false,
        save: jest.fn(),
      }

      const mockAuthTokens = {
        access_token: 'access-token',
        refresh_token: 'refresh-token',
      }

      mockJwtAuthService.verifyAccountValidationToken.mockResolvedValue({
        sub: mockUser.id,
      })
      mockClientService.findOne.mockResolvedValue(mockUser)
      mockUser.save.mockResolvedValue(mockUser)

      jest.spyOn(service, 'authenticate').mockResolvedValue(mockAuthTokens)

      const result = await service.verifyAccount(verifyAccountDto)

      expect(result).toEqual(mockAuthTokens)
      expect(
        mockJwtAuthService.verifyAccountValidationToken,
      ).toHaveBeenCalledWith(verifyAccountDto.verificationToken)
      expect(mockClientService.findOne).toHaveBeenCalledWith({
        id: mockUser.id,
      })
      expect(mockUser.save).toHaveBeenCalled()
      expect(
        mockJwtAuthService.searchAndDeleteTokensFromRedis,
      ).toHaveBeenCalledWith({
        userId: mockUser.id,
        token: verifyAccountDto.verificationToken,
        tokenType: RedisTokenTypes.EMAIL_VERIFICATION,
      })
    })

    it('should throw UnprocessableEntityException for invalid token', async () => {
      mockJwtAuthService.verifyAccountValidationToken.mockResolvedValue(null)

      await expect(service.verifyAccount(verifyAccountDto)).rejects.toThrow(
        UnprocessableEntityException,
      )
    })

    it('should throw BadRequestException for already verified account', async () => {
      const mockUser = {
        id: 'user-123',
        isVerified: true,
      }

      mockJwtAuthService.verifyAccountValidationToken.mockResolvedValue({
        sub: mockUser.id,
      })
      mockClientService.findOne.mockResolvedValue(mockUser)

      await expect(service.verifyAccount(verifyAccountDto)).rejects.toThrow(
        BadRequestException,
      )
    })
  })

  describe('resendVerificationEmail', () => {
    const resendVerificationEmailDto = {
      email: 'test@example.com',
    }

    it('should resend verification email successfully', async () => {
      const mockUser = {
        id: 'user-123',
        email: resendVerificationEmailDto.email,
        isVerified: false,
        verificationSentAt: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
        save: jest.fn(),
      }

      mockClientService.findOne.mockResolvedValue(mockUser)
      mockJwtAuthService.generateEmailVerificationToken.mockResolvedValue(
        'token',
      )
      mockMailerService.sendSingle.mockResolvedValue(true)

      const result = await service.resendVerificationEmail(
        resendVerificationEmailDto,
      )

      expect(result).toEqual({ message: 'Verifier votre boit mail' })
      expect(mockMailerService.sendSingle).toHaveBeenCalled()
      expect(mockUser.save).toHaveBeenCalled()
    })

    it('should throw BadRequestException if account already verified', async () => {
      const mockUser = {
        isVerified: true,
      }

      mockClientService.findOne.mockResolvedValue(mockUser)

      await expect(
        service.resendVerificationEmail(resendVerificationEmailDto),
      ).rejects.toThrow(BadRequestException)
    })

    it('should throw BadRequestException if verification email sent recently', async () => {
      const mockUser = {
        isVerified: false,
        verificationSentAt: new Date(Date.now() - 1000 * 60), // 1 minute ago
      }

      mockClientService.findOne.mockResolvedValue(mockUser)

      await expect(
        service.resendVerificationEmail(resendVerificationEmailDto),
      ).rejects.toThrow(BadRequestException)
    })
  })

  describe('loginAdmin', () => {
    const loginAdminDto: LoginDto = {
      login: 'admin@example.com',
      password: 'password123',
    }

    it('should login admin successfully', async () => {
      const mockUser = {
        id: 'admin-123',
        email: 'admin@example.com',
        userName: 'admin',
        role: UserRoles.ADMIN,
        isSuperUser: true,
      }

      const mockPassword = {
        hash: 'hashedPassword',
        isCurrent: true,
      }

      const mockAuthTokens = {
        access_token: 'access-token',
        refresh_token: 'refresh-token',
      }

      mockUserService.findOne.mockResolvedValue(mockUser)
      mockPasswordRepository.findOne.mockResolvedValue(mockPassword)
      jest.spyOn(service, 'compare').mockResolvedValue(true)
      jest.spyOn(service, 'authenticate').mockResolvedValue(mockAuthTokens)

      const result = await service.loginAdmin(loginAdminDto)

      expect(result).toEqual(mockAuthTokens)
      expect(mockUserService.findOne).toHaveBeenCalledWith({
        select: { id: true, email: true, userName: true, role: true },
        where: [
          { email: loginAdminDto.login, isSuperUser: true },
          { userName: loginAdminDto.login, isSuperUser: true },
        ],
      })
    })

    it('should throw ForbiddenException for non-admin user', async () => {
      mockUserService.findOne.mockResolvedValue(null)

      await expect(service.loginAdmin(loginAdminDto)).rejects.toThrow(
        ForbiddenException,
      )
    })

    it('should throw BadRequestException when no current password exists', async () => {
      const mockUser = {
        id: 'admin-123',
        isSuperUser: true,
      }

      mockUserService.findOne.mockResolvedValue(mockUser)
      mockPasswordRepository.findOne.mockResolvedValue(null)

      await expect(service.loginAdmin(loginAdminDto)).rejects.toThrow(
        BadRequestException,
      )
    })

    it('should throw ForbiddenException for invalid password', async () => {
      const mockUser = {
        id: 'admin-123',
        isSuperUser: true,
      }

      const mockPassword = {
        hash: 'hashedPassword',
        isCurrent: true,
      }

      mockUserService.findOne.mockResolvedValue(mockUser)
      mockPasswordRepository.findOne.mockResolvedValue(mockPassword)
      jest.spyOn(service, 'compare').mockResolvedValue(false)

      await expect(service.loginAdmin(loginAdminDto)).rejects.toThrow(
        ForbiddenException,
      )
    })
  })

  describe('login', () => {
    const loginDto: LoginDto = {
      login: 'test@example.com',
      password: 'testpassword',
    }

    it('should authenticate user successfully', async () => {
      const mockUser = {
        id: 'user-123',
        email: loginDto.login,
        userName: 'testuser',
        role: UserRoles.CLIENT,
        isVerified: true,
      }

      mockUserService.findOne.mockResolvedValue(mockUser)
      mockPasswordRepository.findOne.mockResolvedValue({
        hash: await service.hash(loginDto.password),
      })

      const result = await service.login(loginDto)

      expect(result).toBeDefined()
      expect(mockUserService.findOne).toHaveBeenCalledWith({
        select: { id: true, email: true, userName: true, role: true },
        where: [{ email: loginDto.login }, { userName: loginDto.login }],
      })
    })

    it('should throw ForbiddenException for non-existent user', async () => {
      mockUserService.findOne.mockResolvedValue(null)

      await expect(service.login(loginDto)).rejects.toThrow(ForbiddenException)
    })

    it('should throw ForbiddenException for wrong password', async () => {
      const mockUser = {
        id: 'user-123',
        email: loginDto.login,
        userName: 'testuser',
        role: UserRoles.CLIENT,
        isVerified: true,
      }

      mockUserService.findOne.mockResolvedValue(mockUser)
      mockPasswordRepository.findOne.mockResolvedValue({
        hash: await service.hash(loginDto.password),
      })

      await expect(service.login(loginDto)).rejects.toThrow(ForbiddenException)
    })
  })

  describe('refreshToken', () => {
    const refreshTokenDto = {
      refreshToken: 'valid-refresh-token',
    }

    it('should refresh access token successfully', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        role: UserRoles.CLIENT,
      }

      mockJwtAuthService.resolveRefreshToken.mockResolvedValue({
        user: mockUser,
      })
      mockJwtAuthService.generateAccessToken.mockResolvedValue(
        'new-access-token',
      )

      const result = await service.refreshToken(refreshTokenDto)

      expect(result).toEqual({ access_token: 'new-access-token' })
      expect(mockJwtAuthService.resolveRefreshToken).toHaveBeenCalledWith(
        refreshTokenDto.refreshToken,
      )
      expect(mockJwtAuthService.generateAccessToken).toHaveBeenCalled()
    })
  })

  describe('hash and compare', () => {
    it('should hash password correctly', async () => {
      const password = 'password123'
      ;(bcrypt.genSalt as jest.Mock).mockResolvedValue('salt')
      ;(bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword')

      const result = await service.hash(password)

      expect(result).toBe('hashedPassword')
      expect(bcrypt.genSalt).toHaveBeenCalledWith(10)
      expect(bcrypt.hash).toHaveBeenCalledWith(password, 'salt')
    })

    it('should compare password correctly', async () => {
      const password = 'password123'
      const hashedPassword = 'hashedPassword'
      ;(bcrypt.compare as jest.Mock).mockResolvedValue(true)

      const result = await service.compare(password, hashedPassword)

      expect(result).toBe(true)
      expect(bcrypt.compare).toHaveBeenCalledWith(password, hashedPassword)
    })
  })

  describe('isSuperUser', () => {
    it('should return true for super user', async () => {
      mockUserService.findOne.mockResolvedValue({
        isSuperUser: true,
      })

      const result = await service.isSuperUser('user-id')

      expect(result).toBe(true)
    })

    it('should return false for non-super user', async () => {
      mockUserService.findOne.mockResolvedValue({
        isSuperUser: false,
      })

      const result = await service.isSuperUser('user-id')

      expect(result).toBe(false)
    })
  })

  describe('getProfile', () => {
    it('should return user profile', async () => {
      const mockUser = {
        id: 'user-123',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        userName: 'johndoe',
      }

      mockUserService.findOne.mockResolvedValue(mockUser)

      const result = await service.getProfile('user-123')

      expect(result).toEqual(mockUser)
      expect(mockUserService.findOne).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        select: {
          firstName: true,
          lastName: true,
          email: true,
          userName: true,
        },
      })
    })

    it('should return null when user not found', async () => {
      mockUserService.findOne.mockResolvedValue(null)

      const result = await service.getProfile('non-existent-id')

      expect(result).toBeNull()
    })
  })

  describe('sendVerificationEmail', () => {
    it('should send verification email successfully', async () => {
      const mockClient = {
        id: 'client-123',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        userName: 'johndoe',
        role: UserRoles.CLIENT,
        isVerified: false,
        verificationSentAt: null,
        company: null,
        passwords: [],
        save: jest.fn(),
      } as unknown as Client

      mockJwtAuthService.generateEmailVerificationToken.mockResolvedValue(
        'verification-token',
      )
      mockMailerService.sendSingle.mockResolvedValue(true)

      await service.sendVerificationEmail(mockClient)

      expect(
        mockJwtAuthService.generateEmailVerificationToken,
      ).toHaveBeenCalledWith({
        id: mockClient.id,
        metadata: { email: mockClient.email, role: mockClient.role },
      })
      expect(mockMailerService.sendSingle).toHaveBeenCalledWith({
        to: mockClient.email,
        templateId: 'd-cacd2af73f1047e7a32bbc200bf79da3',
        subject: 'Verification de votre address mail',
        dynamicTemplateData: {
          firstName: mockClient.firstName,
          verificationToken: 'verification-token',
        },
      })
      expect(mockClient.verificationSentAt).toBeInstanceOf(Date)
      expect(mockClient.save).toHaveBeenCalled()
    })
  })

  describe('sendResetPasswordEmail', () => {
    it('should send reset password email successfully', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        userName: 'johndoe',
        role: UserRoles.CLIENT,
        isSuperUser: false,
        isVerified: true,
        passwords: [],
      } as unknown as User

      mockJwtAuthService.generateResetPasswordToken.mockResolvedValue(
        'reset-token',
      )
      mockMailerService.sendSingle.mockResolvedValue(true)

      await service.sendResetPasswordEmail(mockUser)

      expect(
        mockJwtAuthService.generateResetPasswordToken,
      ).toHaveBeenCalledWith({
        id: mockUser.id,
        metadata: { email: mockUser.email, role: mockUser.role },
      })
      expect(mockMailerService.sendSingle).toHaveBeenCalledWith({
        to: mockUser.email,
        templateId: 'd-60701e6c1fc04c1fb492d3919013935b',
        subject: 'Mise à jour de votre mot de passe',
        dynamicTemplateData: {
          firstName: mockUser.firstName,
          resetPasswordToken: 'reset-token',
        },
      })
    })
  })

  describe('isValidUserName', () => {
    it('should return true for valid username', async () => {
      const username = 'validusername'
      mockUserService.findAll.mockResolvedValue([])

      const result = await service.isValidUserName(username)

      expect(result).toBe(true)
      expect(mockUserService.findAll).toHaveBeenCalledWith({
        userName: username.trim().toLowerCase(),
      })
    })

    it('should throw BadRequestException for existing username', async () => {
      const username = 'existingusername'
      mockUserService.findAll.mockResolvedValue([{ id: 'user-123' }])

      await expect(service.isValidUserName(username)).rejects.toThrow(
        BadRequestException,
      )
      expect(mockUserService.findAll).toHaveBeenCalledWith({
        userName: username.trim().toLowerCase(),
      })
    })

    it('should handle username with spaces and different cases', async () => {
      const username = '  TestUser  '
      mockUserService.findAll.mockResolvedValue([])

      const result = await service.isValidUserName(username)

      expect(result).toBe(true)
      expect(mockUserService.findAll).toHaveBeenCalledWith({
        userName: 'testuser',
      })
    })
  })

  describe('generateUsername', () => {
    it('should generate username successfully', async () => {
      const firstName = 'john'
      const lastName = 'doe'
      mockUserService.findAll.mockResolvedValue(null)

      const result = await service.generageUsername(firstName, lastName, null)

      expect(result).toBe('john.doe')
      expect(mockUserService.findAll).toHaveBeenCalledWith({
        userName: 'john.doe',
      })
    })

    it('should increment counter for existing username', async () => {
      const firstName = 'john'
      const lastName = 'doe'
      mockUserService.findAll
        .mockResolvedValueOnce([{ id: 'user-123' }])
        .mockResolvedValueOnce(null)

      const result = await service.generageUsername(firstName, lastName, 1)

      expect(result).toBe('john.doe')
      expect(mockUserService.findAll).toHaveBeenCalledTimes(2)
    })
  })

  describe('updatePassword', () => {
    const userId = 'user-123'
    const updatePasswordDto = {
      currentPassword: 'oldpassword',
      newPassword: 'newpassword',
    }

    it('should update password successfully', async () => {
      const mockOldPasswords = [mockPassword]
      jest.spyOn(userService, 'findOne').mockResolvedValue(mockUser)
      jest.spyOn(passwordRepository, 'findOne').mockResolvedValue(mockPassword)
      jest.spyOn(service, 'compare').mockResolvedValue(true)
      jest.spyOn(passwordRepository, 'find').mockResolvedValue(mockOldPasswords)
      jest.spyOn(passwordRepository, 'update').mockResolvedValue({
        affected: 1,
        raw: {},
        generatedMaps: [],
      } as UpdateResult)

      const newPasswordEntity = {
        id: 'new-password-123',
        hash: 'newhash',
        user: mockUser,
        isCurrent: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Password

      jest
        .spyOn(passwordRepository, 'create')
        .mockReturnValue(newPasswordEntity)
      jest
        .spyOn(passwordRepository, 'save')
        .mockResolvedValue(newPasswordEntity)

      const result = await service.updatePassword(userId, updatePasswordDto)

      expect(result).toBeDefined()
      expect(passwordRepository.update).toHaveBeenCalled()
      expect(passwordRepository.save).toHaveBeenCalled()
    })

    it('should throw NotFoundException when user not found', async () => {
      jest.spyOn(userService, 'findOne').mockResolvedValue(null)

      await expect(
        service.updatePassword(userId, updatePasswordDto),
      ).rejects.toThrow(NotFoundException)
    })

    it('should throw BadRequestException for invalid current password', async () => {
      jest.spyOn(userService, 'findOne').mockResolvedValue(mockUser)
      jest.spyOn(passwordRepository, 'findOne').mockResolvedValue(mockPassword)
      jest.spyOn(service, 'compare').mockResolvedValue(false)

      await expect(
        service.updatePassword(userId, updatePasswordDto),
      ).rejects.toThrow(BadRequestException)
    })
  })

  describe('requestResetPassword', () => {
    const requestResetPasswordDto = {
      login: 'test@example.com',
    }

    it('should send reset password email successfully', async () => {
      jest.spyOn(userService, 'findOne').mockResolvedValue(mockUser)
      jest
        .spyOn(jwtAuthService, 'generateResetPasswordToken')
        .mockResolvedValue('reset-token')
      jest.spyOn(mailerService, 'sendSingle').mockResolvedValue(undefined)

      const result = await service.requestResetPassword(requestResetPasswordDto)

      expect(result).toBe(true)
      expect(jwtAuthService.generateResetPasswordToken).toHaveBeenCalled()
      expect(mailerService.sendSingle).toHaveBeenCalled()
    })

    it('should throw NotFoundException when user not found', async () => {
      jest.spyOn(userService, 'findOne').mockResolvedValue(null)

      await expect(
        service.requestResetPassword(requestResetPasswordDto),
      ).rejects.toThrow(NotFoundException)
    })
  })

  describe('resetPassword', () => {
    const resetPasswordDto = {
      token: 'valid-token',
      password: 'newpassword',
    }

    it('should reset password successfully', async () => {
      const mockPayload = { sub: 'user-123' }
      jest
        .spyOn(jwtAuthService, 'verifyResetPasswordToken')
        .mockResolvedValue(mockPayload)
      jest.spyOn(userService, 'findOne').mockResolvedValue(mockUser)
      jest.spyOn(passwordRepository, 'update').mockResolvedValue({
        affected: 1,
        raw: {},
        generatedMaps: [],
      } as UpdateResult)

      const baseNewPasswordEntity = {
        id: 'new-password-123',
        hash: 'newhash',
        user: mockUser,
        isCurrent: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        hasId: () => true,
        save: jest.fn(),
        remove: jest.fn(),
        softRemove: jest.fn(),
        recover: jest.fn(),
        reload: jest.fn(),
      }

      const newPasswordEntity = baseNewPasswordEntity as unknown as Password

      jest
        .spyOn(passwordRepository, 'create')
        .mockReturnValue(newPasswordEntity)
      jest
        .spyOn(passwordRepository, 'save')
        .mockResolvedValue(newPasswordEntity)

      const result = await service.resetPassword(resetPasswordDto)

      expect(result).toBeDefined()
      expect(passwordRepository.update).toHaveBeenCalled()
      expect(passwordRepository.save).toHaveBeenCalled()
    })

    it('should throw BadRequestException for invalid token', async () => {
      jest
        .spyOn(jwtAuthService, 'verifyResetPasswordToken')
        .mockResolvedValue(null)

      await expect(service.resetPassword(resetPasswordDto)).rejects.toThrow(
        BadRequestException,
      )
    })

    it('should throw NotFoundException when user not found', async () => {
      const mockPayload = { sub: 'user-123' }
      jest
        .spyOn(jwtAuthService, 'verifyResetPasswordToken')
        .mockResolvedValue(mockPayload)
      jest.spyOn(userService, 'findOne').mockResolvedValue(null)

      await expect(service.resetPassword(resetPasswordDto)).rejects.toThrow(
        NotFoundException,
      )
    })
  })

  describe('updateUserProfile', () => {
    const userId = 'user-123'
    const updateUserDto: UpdateUserDto = {
      firstName: 'John',
      lastName: 'Doe',
      userName: 'johndoe',
    }

    it('should update user profile successfully', async () => {
      const updatedUser = {
        ...baseMockUser,
        firstName: updateUserDto.firstName,
        lastName: updateUserDto.lastName,
        userName: updateUserDto.userName,
      } as unknown as User

      jest.spyOn(userService, 'findOne').mockResolvedValue(mockUser)
      jest.spyOn(userService, 'findAll').mockResolvedValue([])
      jest.spyOn(mockUser, 'save').mockResolvedValue(updatedUser)

      const result = await service.updateUserProfile(userId, updateUserDto)

      expect(result).toEqual(updatedUser)
      expect(userService.findOne).toHaveBeenCalledWith({
        where: { id: userId },
      })
    })

    it('should throw NotFoundException when user not found', async () => {
      jest.spyOn(userService, 'findOne').mockResolvedValue(null)

      await expect(
        service.updateUserProfile(userId, updateUserDto),
      ).rejects.toThrow(NotFoundException)
    })

    it('should throw BadRequestException when username already exists', async () => {
      jest.spyOn(userService, 'findOne').mockResolvedValue(mockUser)
      jest
        .spyOn(userService, 'findAll')
        .mockResolvedValue([{ ...mockUser, id: 'other-user' } as User])

      await expect(
        service.updateUserProfile(userId, updateUserDto),
      ).rejects.toThrow(BadRequestException)
    })

    it('should update profile without changing username', async () => {
      const updateProfileDto: UpdateUserDto = {
        firstName: 'John',
        lastName: 'Doe',
        userName: mockUser.userName,
      }

      const updatedUser = {
        ...baseMockUser,
        firstName: updateProfileDto.firstName,
        lastName: updateProfileDto.lastName,
      } as unknown as User

      jest.spyOn(userService, 'findOne').mockResolvedValue(mockUser)
      jest.spyOn(mockUser, 'save').mockResolvedValue(updatedUser)

      const result = await service.updateUserProfile(userId, updateProfileDto)

      expect(result).toEqual(updatedUser)
      expect(userService.findAll).not.toHaveBeenCalled()
      expect(mockUser.save).toHaveBeenCalled()
    })
  })

  describe('getClientMetaData', () => {
    it('should return client metadata with available orders', async () => {
      const mockClient = {
        id: 'client-123',
        email: 'test@example.com',
        role: UserRoles.CLIENT,
        isVerified: true,
        company: {
          id: 'company-123',
          isVerified: true,
          serviceOrders: [
            {
              status: 'ACTIVE',
              endDate: new Date(Date.now() + 86400000), // Tomorrow
              details: [
                {
                  serviceType: 'TYPE_A',
                  allowedBookings: 10,
                  bookingsUsed: 5,
                },
                {
                  serviceType: 'TYPE_B',
                  allowedBookings: 8,
                  bookingsUsed: 2,
                },
              ],
            },
          ],
        },
      }

      mockClientService.findOne.mockResolvedValue(mockClient)

      const result = await service.getClientMetaData('client-123')

      expect(result).toEqual({
        companyId: 'company-123',
        isVerified: true,
        role: UserRoles.CLIENT,
        email: 'test@example.com',
        isCompanyVerified: true,
        availableOrders: [{ TYPE_A: 5 }, { TYPE_B: 6 }],
      })
    })

    it('should handle client without company or service orders', async () => {
      const mockClient = {
        id: 'client-123',
        email: 'test@example.com',
        role: UserRoles.CLIENT,
        isVerified: true,
        company: null,
      }

      mockClientService.findOne.mockResolvedValue(mockClient)

      const result = await service.getClientMetaData('client-123')

      expect(result).toEqual({
        companyId: undefined,
        isVerified: true,
        role: UserRoles.CLIENT,
        email: 'test@example.com',
        isCompanyVerified: undefined,
        availableOrders: undefined,
      })
    })
  })
})
