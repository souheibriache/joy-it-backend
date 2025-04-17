import { ApiProperty } from '@nestjs/swagger'
import { IsEmail, IsString } from 'class-validator'

export class NewsletterEmailDto {
  @ApiProperty()
  @IsEmail()
  @IsString()
  email: string
}
