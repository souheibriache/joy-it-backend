import { ApiProperty } from '@nestjs/swagger'
import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator'
import { ActivityType } from 'src/activity/enums/activity-type.enum'

export class CreateServiceOrderDetailDto {
  @ApiProperty()
  @IsEnum(ActivityType)
  serviceType: ActivityType

  @ApiProperty()
  @IsNumber()
  frequency: number
}
