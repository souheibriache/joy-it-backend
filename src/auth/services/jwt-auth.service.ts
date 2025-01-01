import { Injectable, UnprocessableEntityException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { RefreshToken } from '../entities/refresh-token.entity'
import { Repository } from 'typeorm'
import { UserDto } from '../dto/user.dto'
import {
  ACCESS_TOKEN_TTL,
  CONFIRM_ACCOUNT_TOKEN_TTL,
  REFRESH_TOKEN_TTL,
  RESET_PASSWORD_TOKEN_TTL,
} from '@app/common/utils/constants'
import { JwtService, TokenExpiredError } from '@nestjs/jwt'
import { ConfigService } from '@app/config'
import { User } from 'src/user/entities'
import { IRefreshToken } from '../interfaces'
import { Payload } from '../dto/payload.dto'
import { UserService } from 'src/user/user.service'

@Injectable()
export class JwtAuthService {
  constructor(
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly userService: UserService,
  ) {}

  async generateAccessToken(user: UserDto): Promise<string> {
    const payload = { sub: user.id, metadata: user.metadata }
    const expiresIn = ACCESS_TOKEN_TTL

    return await this.jwtService.signAsync(payload, { expiresIn })
  }

  async generateResetPasswordToken(user: UserDto): Promise<string> {
    const payload = { sub: user.id, metadata: user.metadata }
    const expiresIn = RESET_PASSWORD_TOKEN_TTL

    const resetPasswordToken = await this.jwtService.signAsync(payload, {
      expiresIn,
      privateKey: this.configService.get<string>('RESET_PASSWORD_SECRET_KEY'),
    })

    return `${this.configService.get<string>('FRONTEND_HOST')}/reset-password?token=${resetPasswordToken}`
  }

  async generateRefreshToken(user: UserDto): Promise<string> {
    const payload = { sub: user.id, metadata: user.metadata }
    const expiresIn = REFRESH_TOKEN_TTL

    const refreshToken = await this.createRefreshToken(user, expiresIn)
    const token = await this.jwtService.signAsync(
      { ...payload, jwtId: refreshToken.id },
      { expiresIn },
    )

    return token
  }

  async createRefreshToken(
    user: Pick<User, 'id'>,
    ttl: number,
  ): Promise<IRefreshToken> {
    const expirationDate = new Date()
    expirationDate.setTime(expirationDate.getTime() + ttl)

    const refreshToken = this.refreshTokenRepository.create({
      user: user,
      expires: expirationDate,
    })
    return await this.refreshTokenRepository.save(refreshToken)
  }

  async verifyToken(token: string): Promise<Payload | undefined> {
    try {
      return await this.jwtService.verifyAsync(token)
    } catch {
      return
    }
  }

  async resolveRefreshToken(encoded: string) {
    try {
      const payload = await this.jwtService.verify(encoded)
      if (!payload.sub || !payload.jwtId) {
        throw new UnprocessableEntityException('Invalid refresh token !')
      }

      const refreshToken = await this.refreshTokenRepository.findOne({
        where: {
          id: payload.jwtId,
        },
      })

      if (!refreshToken) {
        throw new UnprocessableEntityException('Refresh token not found.')
      }

      if (refreshToken.isRevoked) {
        throw new UnprocessableEntityException('Refresh token revoked.')
      }

      const user = await this.userService.getOneById(payload.sub)

      if (!user) {
        throw new UnprocessableEntityException('Invalid refresh token !')
      }

      return { user, payload }
    } catch (error) {
      if (error instanceof TokenExpiredError) {
        throw new UnprocessableEntityException('Refresh token expired')
      } else {
        throw new UnprocessableEntityException('Invalid refresh token !')
      }
    }
  }

  async generateEmailVerificationToken(user: UserDto): Promise<string> {
    const payload = { sub: user.id, metadata: user.metadata }
    const expiresIn = CONFIRM_ACCOUNT_TOKEN_TTL

    const verificationToken = await this.jwtService.signAsync(payload, {
      expiresIn,
      privateKey: this.configService.get<string>('CONFIRM_ACCOUNT_SECRET_KEY'),
    })
    return `${this.configService.get<string>('FRONTEND_HOST')}/account-verification?token=${verificationToken}`
  }

  async verifyAccountValidationToken(token) {
    return await this.jwtService.verifyAsync(token, {
      secret: this.configService.get<string>('CONFIRM_ACCOUNT_SECRET_KEY'),
    })
  }

  async verifyResetPasswordToken(token) {
    return await this.jwtService.verifyAsync(token, {
      secret: this.configService.get<string>('RESET_PASSWORD_SECRET_KEY'),
    })
  }
}
