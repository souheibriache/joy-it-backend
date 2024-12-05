import { ApiProperty } from '@nestjs/swagger';
import {
  IsDate,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class CreateScheduleDto {
  @ApiProperty()
  @IsUUID()
  @IsString()
  activityId: string;

  @ApiProperty()
  @IsString()
  date: Date;

  @ApiProperty({ type: Number })
  @IsNumber()
  @Min(1)
  @IsOptional()
  participants: number;
}
