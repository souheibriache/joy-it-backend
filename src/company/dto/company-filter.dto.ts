import { ApiPropertyOptional } from '@nestjs/swagger'
import { Transform } from 'class-transformer'
import { IsBoolean, IsOptional, IsString } from 'class-validator'

export class CompanyFilterDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString({ message: 'Invalid name' })
  @Transform(({ value }) => value.trim().toLowerCase())
  name?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean({ message: 'Invalid value' })
  @Transform(({ value }) => value === 'true')
  isVerified?: boolean
}
