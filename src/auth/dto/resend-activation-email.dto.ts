import { ApiProperty } from '@nestjs/swagger'
import { IsEmail, IsString } from 'class-validator'

export class ResendVerificationEmailDto {
  @ApiProperty()
  @IsString()
  @IsEmail()
  email: string
}
