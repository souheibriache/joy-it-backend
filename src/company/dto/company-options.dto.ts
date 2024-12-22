import { ApiPropertyOptional } from '@nestjs/swagger'
import { PageOptionsDto } from '../../../libs/pagination/src/dto/page-options.dto'
import { IsOptional, ValidateNested } from 'class-validator'
import { Type } from 'class-transformer'
import { OrderOptionsDto } from '../../../libs/pagination/src/dto/order-options.dto'
import { CompanyFilterDto } from './company-filter.dto'

export class CompanyOptionsDto extends PageOptionsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => CompanyFilterDto)
  @ValidateNested({ each: true })
  readonly query?: CompanyFilterDto

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => OrderOptionsDto)
  @ValidateNested({ each: true })
  readonly sort?: OrderOptionsDto
}
