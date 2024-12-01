import { ApiPropertyOptional } from '@nestjs/swagger';
import { PageOptionsDto } from '../../../libs/pagination/src/dto/page-options.dto';
import { IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { OrderOptionsDto } from '../../../libs/pagination/src/dto/order-options.dto';
import { ActivityFilterDto } from './activity-filter.dto';

export class ActivityOptionsDto extends PageOptionsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => ActivityFilterDto)
  @ValidateNested({ each: true })
  readonly query?: ActivityFilterDto;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => OrderOptionsDto)
  @ValidateNested({ each: true })
  readonly sort?: OrderOptionsDto;
}
