import { ApiProperty, PartialType } from '@nestjs/swagger'
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator'
import { ActivityType } from 'src/activity/enums/activity-type.enum'

import { CreateServiceOrderDetailDto } from './create-service-order-detail.dto'

export class UpdateServiceOrderDetailDto extends PartialType(
  CreateServiceOrderDetailDto,
) {
  @ApiProperty()
  @IsNotEmpty()
  @IsOptional()
  @IsEnum(ActivityType)
  serviceType?: ActivityType

  @ApiProperty()
  @IsNotEmpty()
  @IsOptional()
  @IsString()
  frequency?: number
}
