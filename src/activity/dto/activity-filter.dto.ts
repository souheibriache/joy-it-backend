import { IsUnique } from '@app/pagination/decorators/is-unique-decorator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Validate,
} from 'class-validator';
import { ActivityType } from '../enums/activity-type.enum';

export class ActivityFilterDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString({ message: 'Invalid search field' })
  @Transform(({ value }) => value.trim().toLowerCase())
  search?: string;

  @ApiPropertyOptional({ enum: ActivityType, isArray: true })
  @IsEnum(ActivityType, {
    each: true,
    message: 'Invalid type',
  })
  @IsOptional()
  @Validate(IsUnique)
  types?: ActivityType[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => Number(value))
  durationMin?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => Number(value))
  durationMax?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean({ message: 'Invalid value' })
  @Transform(({ value }) => value === 'true')
  isAvailable?: boolean;
}
