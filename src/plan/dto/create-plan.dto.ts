import { IsUnique } from '@app/pagination/decorators/is-unique-decorator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsString,
  IsUUID,
  Validate,
} from 'class-validator';

export class CreatePlanDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  @Transform(({ value }) => Number(value))
  credit: number;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  @Transform(({ value }) => Number(value))
  price: number;

  @ApiProperty({ isArray: true })
  @IsArray()
  benifits: string[];

  @ApiProperty({ isArray: true })
  @IsArray()
  @IsNotEmpty()
  @IsUUID()
  @Validate(IsUnique)
  activities: string[];
}
