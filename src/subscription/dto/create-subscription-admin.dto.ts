import { ApiProperty } from '@nestjs/swagger'
import { CreateSubscriptionDto } from './create-subscription.dto'
import { IsUUID } from 'class-validator'

export class CreateSubscriptionByAdminDto extends CreateSubscriptionDto {
  @ApiProperty()
  @IsUUID()
  companyId: string
}
