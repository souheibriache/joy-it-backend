import { ApiProperty } from '@nestjs/swagger'
import { IsEnum, IsNotEmpty, IsString } from 'class-validator'
import { SupportSubjectEnum } from '../enums'

export class PostQuestionUserDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  question: string

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  subject: string

  @ApiProperty({ type: 'string', format: 'binary' })
  questionAttachments?: Express.Multer.File[]
}
