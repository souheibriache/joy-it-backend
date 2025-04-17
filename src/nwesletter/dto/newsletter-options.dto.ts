import { OrderOptionsDto, PageOptionsDto } from '@app/pagination/dto'
import { ApiPropertyOptional } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { IsOptional, ValidateNested } from 'class-validator'
import { NewsletterFilterDto } from './newsletter-filter.dto'

export class NewsletterOptionsDto extends PageOptionsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => String)
  readonly search?: string

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => OrderOptionsDto)
  @ValidateNested()
  readonly sort?: OrderOptionsDto
}
