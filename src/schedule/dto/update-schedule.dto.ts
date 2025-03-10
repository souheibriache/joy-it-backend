import { ApiProperty, PartialType } from '@nestjs/swagger'
import { CreateScheduleDto } from './create-schedule.dto'
import { IsNumber, IsOptional, IsString, Min } from 'class-validator'

export class UpdateScheduleDto {
  @ApiProperty()
  @IsString()
  @IsOptional()
  date?: Date

  @ApiProperty({ type: Number })
  @IsNumber()
  @Min(1)
  @IsOptional()
  participants?: number
}
