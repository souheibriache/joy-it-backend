import { ApiPropertyOptional } from '@nestjs/swagger'
import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  Validate,
} from 'class-validator'
import { SupportSubjectEnum } from '../enums'
import { Transform } from 'class-transformer'
import { SupportCategory } from '../enums/support-category.enum'
import { IsUnique } from '@app/pagination/decorators/is-unique-decorator'

export class SupportFilterDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value.trim().toLowerCase())
  readonly name?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value.trim().toLowerCase())
  readonly email?: string

  @ApiPropertyOptional({ enum: SupportSubjectEnum, isArray: true })
  @IsOptional()
  @IsEnum(SupportSubjectEnum, { each: true })
  @Validate(IsUnique)
  readonly subjects?: SupportSubjectEnum[]

  @ApiPropertyOptional({ enum: SupportCategory, isArray: true })
  @IsOptional()
  @IsEnum(SupportCategory, { each: true })
  @Validate(IsUnique)
  readonly category?: SupportCategory[]

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  readonly answeredById?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value)
  readonly isSeen?: boolean

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value)
  readonly isAnswered?: boolean
}
