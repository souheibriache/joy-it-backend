import { ApiPropertyOptional } from '@nestjs/swagger'
import { PageOptionsDto } from '../../../libs/pagination/src/dto/page-options.dto'
import {
  IsBoolean,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator'
import { Transform, Type } from 'class-transformer'
import { OrderOptionsDto } from '../../../libs/pagination/src/dto/order-options.dto'
import { CompanyFilterDto } from './company-filter.dto'

export class CompanyOptionsDto extends PageOptionsDto {
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

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => OrderOptionsDto)
  @ValidateNested({ each: true })
  readonly sort?: OrderOptionsDto
}
