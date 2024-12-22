import { ApiPropertyOptional } from '@nestjs/swagger'
import { Order } from '../constants'
import { IsEnum, IsOptional } from 'class-validator'

export class OrderOptionsDto {
  @ApiPropertyOptional({ enum: Order })
  @IsEnum(Order, { message: 'Invalid order' })
  @IsOptional()
  readonly createdAt?: Order

  @ApiPropertyOptional({ enum: Order })
  @IsEnum(Order, { message: 'Invalid order' })
  @IsOptional()
  readonly id?: Order
}
