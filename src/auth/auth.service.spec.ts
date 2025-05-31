import { Test, TestingModule } from '@nestjs/testing'
import { AuthService } from './services/auth.service'
import { getRepositoryToken } from '@nestjs/typeorm'
import { Password } from './entities/password-history'
import { UserService } from '../user/user.service'
import { ClientService } from '../client/client.service'
import { MailerService } from '@app/mailer'
import { JwtAuthService } from './services/jwt-auth.service'
import { Repository } from 'typeorm'
import { SignupDto } from './dto/sign-up.dto'
import { LoginDto } from './dto'
import { User } from '../user/entities'
import { Client } from '../client/entities'
import {
  BadRequestException,
  ForbiddenException,
  UnprocessableEntityException,
} from '@nestjs/common'
import { UserRoles } from '../user/enums/user-roles.enum'
import * as bcrypt from 'bcryptjs'

jest.mock('bcryptjs')

describe('AuthService', () => {
  let service: AuthService
  let userService: UserService
  let clientService: ClientService
  let mailerService: MailerService
  let jwtAuthService: JwtAuthService
  let passwordRepository: Repository<Password>

  const mockPasswordRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
  }

  const mockUserService = {
    findOne: jest.fn(),
    findAll: jest.fn(),
    create: jest.fn(),
  }

  const mockClientService = {
    findOne: jest.fn(),
  }

  const mockMailerService = {
    sendMail: jest.fn(),
  }

  const mockJwtAuthService = {
    generateAccessToken: jest.fn(),
    generateRefreshToken: jest.fn(),
    verifyAccountValidationToken: jest.fn(),
    searchAndDeleteTokensFromRedis: jest.fn(),
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
    userService = module.get<UserService>(UserService)
    clientService = module.get<ClientService>(ClientService)
    mailerService = module.get<MailerService>(MailerService)
    jwtAuthService = module.get<JwtAuthService>(JwtAuthService)
    passwordRepository = module.get<Repository<Password>>(
      getRepositoryToken(Password),
    )
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('login', () => {
    const loginDto: LoginDto = {
      login: 'test@example.com',
      password: 'password123',
    }

    it('should authenticate user and return tokens', async () => {
      const mockUser = {
        id: 'user-123',
        email: loginDto.login,
        userName: 'testuser',
      }
      const mockPassword = {
        hash: 'hashed_password',
        isCurrent: true,
      }
      const mockTokens = {
        access_token: 'access-token',
        refresh_token: 'refresh-token',
      }

      mockUserService.findOne.mockResolvedValue(mockUser)
      mockPasswordRepository.findOne.mockResolvedValue(mockPassword)
      ;(bcrypt.compare as jest.Mock).mockResolvedValue(true)
      mockJwtAuthService.generateAccessToken.mockResolvedValue(
        mockTokens.access_token,
      )
      mockJwtAuthService.generateRefreshToken.mockResolvedValue(
        mockTokens.refresh_token,
      )

      const result = await service.login(loginDto)

      expect(result).toEqual(mockTokens)
      expect(mockUserService.findOne).toHaveBeenCalledWith({
        select: { id: true, email: true, userName: true },
        where: [{ email: loginDto.login }, { userName: loginDto.login }],
      })
      expect(mockPasswordRepository.findOne).toHaveBeenCalledWith({
        where: { user: { id: mockUser.id }, isCurrent: true },
      })
    })

    it('should throw ForbiddenException for invalid credentials', async () => {
      mockUserService.findOne.mockResolvedValue(null)

      await expect(service.login(loginDto)).rejects.toThrow(ForbiddenException)
    })

    it('should throw BadRequestException for missing current password', async () => {
      const mockUser = {
        id: 'user-123',
        email: loginDto.login,
        userName: 'testuser',
      }

      mockUserService.findOne.mockResolvedValue(mockUser)
      mockPasswordRepository.findOne.mockResolvedValue(null)

      await expect(service.login(loginDto)).rejects.toThrow(BadRequestException)
    })

    it('should throw ForbiddenException for invalid password', async () => {
      const mockUser = {
        id: 'user-123',
        email: loginDto.login,
        userName: 'testuser',
      }
      const mockPassword = {
        hash: 'hashed_password',
        isCurrent: true,
      }

      mockUserService.findOne.mockResolvedValue(mockUser)
      mockPasswordRepository.findOne.mockResolvedValue(mockPassword)
      ;(bcrypt.compare as jest.Mock).mockResolvedValue(false)

      await expect(service.login(loginDto)).rejects.toThrow(ForbiddenException)
    })
  })

  describe('loginAdmin', () => {
    const loginDto: LoginDto = {
      login: 'admin@example.com',
      password: 'password123',
    }

    it('should authenticate admin user and return tokens', async () => {
      const mockUser = {
        id: 'admin-123',
        email: loginDto.login,
        userName: 'admin',
        role: UserRoles.ADMIN,
        isSuperUser: true,
      }
      const mockPassword = {
        hash: 'hashed_password',
        isCurrent: true,
      }
      const mockTokens = {
        access_token: 'admin-access-token',
        refresh_token: 'admin-refresh-token',
      }

      mockUserService.findOne.mockResolvedValue(mockUser)
      mockPasswordRepository.findOne.mockResolvedValue(mockPassword)
      ;(bcrypt.compare as jest.Mock).mockResolvedValue(true)
      mockJwtAuthService.generateAccessToken.mockResolvedValue(
        mockTokens.access_token,
      )
      mockJwtAuthService.generateRefreshToken.mockResolvedValue(
        mockTokens.refresh_token,
      )

      const result = await service.loginAdmin(loginDto)

      expect(result).toEqual(mockTokens)
      expect(mockUserService.findOne).toHaveBeenCalledWith({
        select: { id: true, email: true, userName: true, role: true },
        where: [
          { email: loginDto.login, isSuperUser: true },
          { userName: loginDto.login, isSuperUser: true },
        ],
      })
    })

    it('should throw ForbiddenException for non-admin user', async () => {
      mockUserService.findOne.mockResolvedValue(null)

      await expect(service.loginAdmin(loginDto)).rejects.toThrow(
        ForbiddenException,
      )
    })
  })

  describe('getProfile', () => {
    const userId = 'user-123'

    it('should return user profile', async () => {
      const mockUser = {
        id: userId,
        firstName: 'John',
        lastName: 'Doe',
        email: 'test@example.com',
        userName: 'johndoe',
      }

      mockUserService.findOne.mockResolvedValue(mockUser)

      const result = await service.getProfile(userId)

      expect(result).toEqual(mockUser)
      expect(mockUserService.findOne).toHaveBeenCalledWith({
        where: { id: userId },
        select: {
          firstName: true,
          lastName: true,
          email: true,
          userName: true,
        },
      })
    })
  })

  describe('hash and compare', () => {
    it('should hash password correctly', async () => {
      const password = 'password123'
      const salt = 'test-salt'
      const hashedPassword = 'hashed-password'

      ;(bcrypt.genSalt as jest.Mock).mockResolvedValue(salt)
      ;(bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword)

      const result = await service.hash(password)

      expect(result).toBe(hashedPassword)
      expect(bcrypt.genSalt).toHaveBeenCalledWith(10)
      expect(bcrypt.hash).toHaveBeenCalledWith(password, salt)
    })

    it('should compare passwords correctly', async () => {
      const password = 'password123'
      const hashedPassword = 'hashed-password'

      ;(bcrypt.compare as jest.Mock).mockResolvedValue(true)

      const result = await service.compare(password, hashedPassword)

      expect(result).toBe(true)
      expect(bcrypt.compare).toHaveBeenCalledWith(password, hashedPassword)
    })
  })
})
