import { ApiPropertyOptional } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { IsOptional, ValidateNested } from 'class-validator'
import { SupportFilterDto } from './support-filter.dto'
import { OrderOptionsDto, PageOptionsDto } from '@app/pagination/dto'

export class SupportOptionsDto extends PageOptionsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => SupportFilterDto)
  @ValidateNested({ each: true })
  readonly query?: SupportFilterDto

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => OrderOptionsDto)
  @ValidateNested({ each: true })
  readonly sort?: OrderOptionsDto
}
