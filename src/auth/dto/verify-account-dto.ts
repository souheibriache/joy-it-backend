import { ApiProperty } from '@nestjs/swagger'
import { IsString } from 'class-validator'

export class VerifyAccountDto {
  @ApiProperty()
  @IsString()
  verificationToken: string
}
