import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty, IsString } from 'class-validator'

export class CreateFaqDto {
  @ApiProperty({ description: 'The FAQ question' })
  @IsString()
  @IsNotEmpty()
  question: string

  @ApiProperty({ description: 'The FAQ answer' })
  @IsString()
  @IsNotEmpty()
  answer: string
}
