import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty, IsString } from 'class-validator'

export class AnswerSupportQuestionDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  adminAnswer: string

  @ApiProperty({ type: 'string', format: 'binary' })
  attachments?: Express.Multer.File[]
}
