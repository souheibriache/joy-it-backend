import { IsUnique } from '@app/pagination/decorators/is-unique-decorator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  Validate,
} from 'class-validator';

export class CompanyFilterDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString({ message: 'Invalid name' })
  @Transform(({ value }) => value.trim().toLowerCase())
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean({ message: 'Invalid value' })
  @Transform(({ value }) => value === 'true')
  isVerified?: boolean;
}
