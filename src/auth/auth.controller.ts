import { Body, Controller, Get, Post, Request, UseGuards } from '@nestjs/common'
import { AuthService } from './auth.service'
import { SignupDto } from './dto/sign-up.dto'
import { LoginDto, RefreshTokenDto } from './dto'
import { AccessTokenGuard } from './guards/access-token.guard'
import { IRequestWithUser } from '@app/common/interfaces/request-user.interface.dto'
import { ApiBearerAuth } from '@nestjs/swagger'
import { VerifyAccountDto } from './dto/verify-account-dto'
import { ResendVerificationEmailDto } from './dto/resend-activation-email.dto'

@Controller('accounts')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  async signUp(@Body() signupDto: SignupDto) {
    return await this.authService.signup(signupDto)
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return await this.authService.login(loginDto)
  }

  @Post('/admin/login')
  async adminLogin(@Body() loginDto: LoginDto) {
    return await this.authService.loginAdmin(loginDto)
  }

  @Post('/verify-account')
  async verifyAccount(@Body() verifyAccountDto: VerifyAccountDto) {
    return await this.authService.verifyAccount(verifyAccountDto)
  }

  @Post('/resend-verification-email')
  async resendVerificationEmail(
    @Body() resendVerificationEmailDto: ResendVerificationEmailDto,
  ) {
    return await this.authService.resendVerificationEmail(
      resendVerificationEmailDto,
    )
  }

  @Post('refresh-token')
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
    return await this.authService.refreshToken(refreshTokenDto)
  }

  @Get('/profile')
  @UseGuards(AccessTokenGuard)
  @ApiBearerAuth()
  async getMyProfile(@Request() req: IRequestWithUser) {
    const userId = req?.user?.id
    return await this.authService.getProfile(userId)
  }
}
