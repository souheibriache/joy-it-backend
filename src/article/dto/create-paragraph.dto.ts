import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsNumber, IsOptional, IsString, IsNotEmpty } from 'class-validator'

export class CreateParagraphDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  title: string

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  content: string

  @ApiProperty()
  @IsString()
  @IsOptional()
  subtitle?: string

  @ApiPropertyOptional({
    description:
      'Optional image index from the uploaded files for this paragraph',
  })
  @IsOptional()
  @IsNumber()
  imageIndex?: number

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  imageUrl?: string
}
