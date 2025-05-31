import { OrderOptionsDto, PageOptionsDto } from '@app/pagination/dto'
import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { IsOptional, ValidateNested, IsString } from 'class-validator'
import { ArticleFilterDto } from './article-filter.dto'

export class ArticleOptionsDto extends PageOptionsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => ArticleFilterDto)
  @ValidateNested()
  readonly query?: ArticleFilterDto

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => OrderOptionsDto)
  @ValidateNested()
  readonly sort?: OrderOptionsDto

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  orderBy?: string
}
