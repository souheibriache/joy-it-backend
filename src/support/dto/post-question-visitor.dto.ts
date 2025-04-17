import { ApiProperty } from '@nestjs/swagger'
import { Transform } from 'class-transformer'
import { IsEmail, IsNotEmpty, IsString } from 'class-validator'
import { PostQuestionUserDto } from './post-question-user.dto'

export class PostQuestionVisitorDto extends PostQuestionUserDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsEmail()
  @Transform(({ value }) => value.toLowerCase())
  email: string

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  firstName: string

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  lastName: string
}
