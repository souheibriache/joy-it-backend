import {
  ForbiddenException,
  Inject,
  Injectable,
  UnprocessableEntityException,
} from '@nestjs/common'
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
import { Cache } from 'cache-manager'
import { CACHE_MANAGER } from '@nestjs/cache-manager'
import { UserRoles } from 'src/user/enums/user-roles.enum'
import Redis from 'ioredis'
import { RedisTokenTypes } from '../enums/token-types.enum'

@Injectable()
export class JwtAuthService {
  private redisClient: Redis

  constructor(
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly userService: UserService,
    @Inject(CACHE_MANAGER)
    private readonly cacheService: Cache,
  ) {
    this.redisClient = new Redis({
      host: configService.get('REDIS_HOST'),
      port: configService.get('REDIS_PORT'),
      password: configService.get('REDIS_PASSWORD'),
    })
  }

  async generateAccessToken(user: UserDto): Promise<string> {
    const payload = { sub: user.id, metadata: user.metadata }
    const expiresIn = ACCESS_TOKEN_TTL

    const token = await this.jwtService.signAsync(payload, { expiresIn })
    await this.insertTokenInRedis({
      userId: user.id,
      role: user.metadata.role,
      token: token,
      tokenType: RedisTokenTypes.ACCESS,
      expiresIn,
    })

    return token
  }

  async generateRefreshToken(user: UserDto): Promise<string> {
    const payload = { sub: user.id, metadata: user.metadata }
    const expiresIn = REFRESH_TOKEN_TTL

    const refreshToken = await this.createRefreshToken(user, expiresIn)
    const token = await this.jwtService.signAsync(
      { ...payload, jwtId: refreshToken.id },
      { expiresIn },
    )

    await this.insertTokenInRedis({
      userId: user.id,
      role: user.metadata.role,
      token,
      tokenType: RedisTokenTypes.REFRESH,
      expiresIn,
    })

    return token
  }

  async generateResetPasswordToken(user: UserDto): Promise<string> {
    const payload = { sub: user.id, metadata: user.metadata }
    const expiresIn = RESET_PASSWORD_TOKEN_TTL

    const resetPasswordToken = await this.jwtService.signAsync(payload, {
      expiresIn,
      privateKey: this.configService.get<string>('RESET_PASSWORD_SECRET_KEY'),
    })

    const tokens = await this.searchTokenFromRedis({
      userId: user.id,
      tokenType: RedisTokenTypes.RESET_PASSWORD,
      token: '*',
    })
    if (tokens.length) await this.deleteTokensFromRedis(tokens)

    await this.insertTokenInRedis({
      userId: user.id,
      role: user.metadata.role,
      token: resetPasswordToken,
      tokenType: RedisTokenTypes.RESET_PASSWORD,
      expiresIn,
    })

    return `${this.configService.get<string>('FRONTEND_HOST')}/reset-password?token=${resetPasswordToken}`
  }

  async createRefreshToken(
    user: Pick<User, 'id'>,
    ttl: number,
  ): Promise<IRefreshToken> {
    const expirationDate = new Date()
    expirationDate.setTime(expirationDate.getTime() + ttl)

    const refreshToken = this.refreshTokenRepository.create({
      user,
      expires: expirationDate,
    })
    return await this.refreshTokenRepository.save(refreshToken)
  }

  async verifyToken(token: string): Promise<Payload | undefined> {
    try {
      const payload = await this.jwtService.verifyAsync(token)
      const tokens = await this.searchTokenFromRedis({
        userId: payload.sub,
        token,
        tokenType: '*',
      })

      if (!tokens?.length) return null
      return payload
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

      const tokens = await this.searchTokenFromRedis({
        userId: payload.sub,
        token: encoded,
        tokenType: 'REFRESH',
      })

      if (!tokens?.length)
        throw new ForbiddenException('Invalid refresh token !')

      const refreshToken = await this.refreshTokenRepository.findOne({
        where: { id: payload.jwtId },
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

    const tokens = await this.searchTokenFromRedis({
      userId: user.id,
      token: '*',
      tokenType: RedisTokenTypes.EMAIL_VERIFICATION,
    })

    if (tokens.length) {
      await this.deleteTokensFromRedis(tokens)
    }

    await this.insertTokenInRedis({
      userId: user.id,
      role: user.metadata.role,
      token: verificationToken,
      tokenType: RedisTokenTypes.EMAIL_VERIFICATION,
      expiresIn,
    })
    return `${this.configService.get<string>('FRONTEND_HOST')}/account-verification?token=${verificationToken}`
  }

  async verifyAccountValidationToken(token) {
    const payload = await this.jwtService.verifyAsync(token, {
      secret: this.configService.get<string>('CONFIRM_ACCOUNT_SECRET_KEY'),
    })

    const tokens = await this.searchTokenFromRedis({
      userId: payload.sub,
      token: token,
      tokenType: RedisTokenTypes.EMAIL_VERIFICATION,
    })
    if (!tokens.length) return null

    return payload
  }

  async verifyResetPasswordToken(token) {
    const payload = await this.jwtService.verifyAsync(token, {
      secret: this.configService.get<string>('RESET_PASSWORD_SECRET_KEY'),
    })
    const tokens = await this.searchTokenFromRedis({
      userId: payload.sub,
      token: token,
      tokenType: RedisTokenTypes.RESET_PASSWORD,
    })
    if (!tokens.length) return null

    return payload
  }

  async searchTokenFromRedis(args: {
    userId: string
    token: string
    tokenType?: string
  }) {
    const { userId, token, tokenType } = args
    const key = `USERS/*/${userId}/TOKENS/${tokenType}/${token}`
    return await this.redisClient.keys(key)
  }

  async deleteTokensFromRedis(keys: string[]) {
    if (!keys.length) return

    const promises = keys.map((key) => this.cacheService.del(key))
    await Promise.all(promises)
  }

  async searchAndDeleteTokensFromRedis(args: {
    userId: string
    token: string
    tokenType?: string
  }) {
    const keys = await this.searchTokenFromRedis(args)
    await this.deleteTokensFromRedis(keys)
  }

  async insertTokenInRedis(args: {
    userId: string
    role: UserRoles
    token: string
    tokenType?: string
    expiresIn?: number
  }) {
    const { userId, role, token } = args
    let { tokenType, expiresIn } = args
    if (!tokenType) tokenType = RedisTokenTypes.ACCESS
    //? expiresIn must be in Milliseconds
    if (expiresIn) expiresIn = expiresIn

    const key = `USERS/${role}/${userId}/TOKENS/${tokenType}/${token}`

    await this.redisClient.set(key, userId, 'EX', expiresIn)

    return await this.redisClient.keys(key)
  }
}
