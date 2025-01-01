import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { FindOptionsWhere, Repository } from 'typeorm'
import { RefreshToken } from './entities/refresh-token.entity'
import { SignupDto } from './dto/sign-up.dto'
import * as bcrypt from 'bcryptjs'
import { User } from 'src/user/entities'
import { UserService } from 'src/user/user.service'
import { LoginDto, LoginUserPayload, RefreshTokenDto } from './dto'
import { MetadataDto } from './dto/metadata.dto'
import { UserDto } from './dto/user.dto'
import { IRefreshToken } from './interfaces'
import {
  ACCESS_TOKEN_TTL,
  CONFIRM_ACCOUNT_TOKEN_TTL,
  REFRESH_TOKEN_TTL,
  RESET_PASSWORD_TOKEN_TTL,
} from '@app/common/utils/constants/jwt-ttl'
import { JwtService, TokenExpiredError } from '@nestjs/jwt'
import { Payload } from './dto/payload.dto'
import { ClientService } from 'src/client/client.service'
import { Client } from 'src/client/entities'
import { ConfigService } from '@app/config'
import { MailerService } from '@app/mailer'
import { sendEmailDto } from 'libs/mailer/dto'
import { VerifyAccountDto } from './dto/verify-account-dto'
import { ResendVerificationEmailDto } from './dto/resend-activation-email.dto'
import { Password } from './entities/password-history'
import { UpdatePasswordDto } from './dto/update-password.dto'
import { RequestResetPasswordDto } from './dto/request-reset-password.dto'
import { ResetPasswordDto } from './dto/reset-password.dto'

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
    @InjectRepository(Password)
    private readonly passwordRepository: Repository<Password>,
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly clientService: ClientService,
    private readonly configService: ConfigService,
    private readonly mailerService: MailerService,
  ) {}

  async signup(createUserDto: SignupDto) {
    const user = await this.userService.findAll({
      email: createUserDto.email,
    })
    if (user.length) throw new BadRequestException('This user already exists!')

    const { password, ...rest } = createUserDto

    const hashedPassword = await this.hash(password)

    const createdUser = await this.clientService.create({
      ...rest,
    })

    await this.sendVerificationEmail(createdUser)

    const createdPassword = this.passwordRepository.create({
      user: createdUser,
      hash: hashedPassword,
    })
    await this.passwordRepository.save(createdPassword)

    return {
      message: 'Verifier votre boit mail',
    }
  }

  async verifyAccount(verifyAccountDto: VerifyAccountDto) {
    const { verificationToken } = verifyAccountDto
    const payload = await this.jwtService.verifyAsync(verificationToken, {
      secret: this.configService.get<string>('CONFIRM_ACCOUNT_SECRET_KEY'),
    })
    if (!payload.sub) {
      throw new UnprocessableEntityException('Invalid token !')
    }
    const user = await this.clientService.findOne({ id: payload.sub })

    if (user && user.isVerified) {
      throw new BadRequestException('Account already verified!')
    }

    user.isVerified = true
    await user.save()
    return await this.authenticate(user, { isVerified: true })
  }

  async sendVerificationEmail(client: Client) {
    const verificationToken = await this.generateEmailVerificationToken({
      id: client.id,
      metadata: { email: client.email },
    })

    const verificationMail: sendEmailDto = new sendEmailDto()
    verificationMail.to = client.email
    verificationMail.templateId = 'd-cacd2af73f1047e7a32bbc200bf79da3'
    verificationMail.subject = 'Verification de votre address mail'
    verificationMail.dynamicTemplateData = {
      firstName: client.firstName,
      verificationToken,
    }

    await this.mailerService.sendSingle(verificationMail)
    client.verificationSentAt = new Date()
    await client.save()
  }

  async sendResetPasswordEmail(user: User) {
    const resetPasswordToken = await this.generateResetPasswordToken({
      id: user.id,
      metadata: { email: user.email },
    })

    const resetPasswprdMail: sendEmailDto = new sendEmailDto()
    resetPasswprdMail.to = user.email
    resetPasswprdMail.templateId = 'd-60701e6c1fc04c1fb492d3919013935b'
    resetPasswprdMail.subject = 'Mise à jour de votre mot de passe'
    resetPasswprdMail.dynamicTemplateData = {
      firstName: user.firstName,
      resetPasswordToken,
    }

    await this.mailerService.sendSingle(resetPasswprdMail)
  }

  async resendVerificationEmail(input: ResendVerificationEmailDto) {
    const { email } = input
    const user = await this.clientService.findOne({ email })

    if (user.isVerified)
      throw new BadRequestException('Account already verified!')

    const now = new Date()

    if (
      user.verificationSentAt &&
      now.getTime() - user?.verificationSentAt.getTime() < 1000 * 60 * 3
    ) {
      throw new BadRequestException(
        'Please wait few moments before trying again!',
      )
    }
    await this.sendVerificationEmail(user)

    return {
      message: 'Verifier votre boit mail',
    }
  }

  async isValidUserName(username: string) {
    const users = await this.userService.findAll({
      userName: username.trim().toLowerCase(),
    })
    if (users.length > 0) throw new BadRequestException('Invalid username')
    return true
  }

  async generageUsername(firstName: string, lastName: string, count) {
    const username = firstName + '.' + lastName
    if (count) {
      count++
    } else {
      count = 1
    }

    const users = await this.userService.findAll({ userName: username })
    if (users) return this.generageUsername(firstName, lastName, count)
    else return username
  }

  async loginAdmin(loginDto: LoginDto) {
    const { login, password } = loginDto

    const where: FindOptionsWhere<User> | FindOptionsWhere<User>[] = [
      { email: login, isSuperUser: true },
      { userName: login, isSuperUser: true },
    ]

    const user = await this.userService.findOne({
      select: { id: true, email: true, userName: true },
      where: where,
    })

    if (!user) throw new ForbiddenException('Wrong credintials')

    const currentPassword = await this.passwordRepository.findOne({
      where: { user: { id: user.id }, isCurrent: true },
    })

    if (!currentPassword) throw new BadRequestException('Wrong credintials')

    const isValidPassword = await this.compare(password, currentPassword.hash)

    if (!isValidPassword) throw new ForbiddenException('Wrong credintials')

    return await this.authenticate(user, {})
  }

  async login(loginDto: LoginDto) {
    const { login, password } = loginDto

    const where: FindOptionsWhere<User> | FindOptionsWhere<User>[] = [
      { email: login },
      { userName: login },
    ]

    const user = await this.userService.findOne({
      select: { id: true, email: true, userName: true },
      where: where,
    })

    if (!user) throw new ForbiddenException('Wrong credintials')

    const currentPassword = await this.passwordRepository.findOne({
      where: { user: { id: user.id }, isCurrent: true },
    })

    if (!currentPassword) throw new BadRequestException('Wrong credintials')

    const isValidPassword = await this.compare(password, currentPassword.hash)

    if (!isValidPassword) throw new ForbiddenException('Wrong credintials')

    const payloadMetaData = await this.getClientMetaData(user.id)

    return await this.authenticate(user, payloadMetaData)
  }

  async hash(password: string): Promise<string> {
    const salt: string = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)
    return hashedPassword
  }

  async compare(password, hashedPassword) {
    return await bcrypt.compare(password, hashedPassword)
  }

  async authenticate(
    user: User,
    metadata: MetadataDto,
  ): Promise<LoginUserPayload> {
    const access_token = await this.generateAccessToken({ ...user, metadata })

    const refresh_token = await this.generateRefreshToken({
      ...user,
      metadata,
    })

    return { access_token, refresh_token }
  }

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

  async refreshToken(input: RefreshTokenDto) {
    const { refreshToken } = input
    const { user } = await this.resolveRefreshToken(refreshToken)

    const metadata = await this.getClientMetaData(user.id)

    const accessToken = await this.generateAccessToken({
      ...user,
      metadata,
    })

    return {
      access_token: accessToken,
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

  async isSuperUser(userId: string) {
    const user = await this.userService.findOne({ where: { id: userId } })
    return user?.isSuperUser
  }

  async getClientMetaData(clientId: string) {
    const client = await this.clientService.findOne(
      { id: clientId },
      { company: { subscription: true } },
    )

    return {
      companyId: client?.company?.id,
      isVerified: client.isVerified,
      isCompanyVerified: client?.company?.isVerified,
      hasSubscription: client?.company?.subscription?.id,
    }
  }

  async getProfile(userId: string) {
    return await this.userService.findOne({
      where: { id: userId },
      select: { firstName: true, lastName: true, email: true, userName: true },
    })
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

  async updatePassword(userId: string, input: UpdatePasswordDto) {
    const { oldPassword, newPassword } = input
    const user = await this.userService.findOne({
      where: { id: userId },
    })

    const currentPassword = await this.passwordRepository.findOne({
      where: { user: { id: user.id }, isCurrent: true },
    })

    if (!currentPassword) throw new BadRequestException('Wrong credintials')

    const isValidPassword = await this.compare(
      oldPassword,
      currentPassword.hash,
    )
    if (!isValidPassword) throw new BadRequestException('Invalid password')

    const oldPasswords = await this.passwordRepository.find({
      where: { user: { id: user.id } },
      order: { createdAt: 'desc' },
      take: 10,
    })
    for (const oldPassword of oldPasswords) {
      if (await this.compare(newPassword, oldPassword.hash))
        throw new BadRequestException(
          'Cannot use a password from the old 10 passwords',
        )
    }

    const hash = await this.hash(newPassword)

    const createdPassword = this.passwordRepository.create({ user, hash })

    await this.passwordRepository.update(
      { user: { id: user.id }, isCurrent: true },
      { isCurrent: false },
    )
    await this.passwordRepository.save(createdPassword)

    return true
  }

  async requestResetPassword(input: RequestResetPasswordDto) {
    const { login } = input

    const where: FindOptionsWhere<User> | FindOptionsWhere<User>[] = [
      { email: login },
      { userName: login },
    ]

    const user = await this.userService.findOne({
      select: { id: true, email: true, userName: true },
      where: where,
    })
    if (user) {
      await this.sendResetPasswordEmail(user)
    }
    return true
  }

  async resetPassword(input: ResetPasswordDto) {
    const { token, password } = input
    const payload = await this.jwtService.verifyAsync(token)
    if (!payload) throw new BadRequestException('Invalid action')
    const user = await this.userService.findOne({ where: { id: payload.sub } })
    if (!user) throw new NotFoundException('Invalid action')

    const oldPasswords = await this.passwordRepository.find({
      where: { user: { id: user.id } },
      order: { createdAt: 'desc' },
      take: 10,
    })
    for (const oldPassword of oldPasswords) {
      if (await this.compare(password, oldPassword.hash))
        throw new BadRequestException(
          'Cannot use a password from the old 10 passwords',
        )
    }

    const hash = await this.hash(password)
    const newPassword = this.passwordRepository.create({ user, hash })
    await this.passwordRepository.update(
      { user: { id: user.id } },
      { isCurrent: false },
    )
    await this.passwordRepository.save(newPassword)

    return true
  }
}
