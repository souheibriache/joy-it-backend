import { PartialType } from '@nestjs/swagger'
import { CreateActivityDto } from './create-activity.dto'

export class updateActivityDto extends PartialType(CreateActivityDto) {}
