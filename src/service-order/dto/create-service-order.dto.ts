import {
  IsArray,
  IsDateString,
  IsNumber,
  IsNotEmpty,
  ValidateNested,
} from 'class-validator'
import { Type } from 'class-transformer'
import { CreateServiceOrderDetailDto } from 'src/service-order-detail/dto'
import { ApiProperty } from '@nestjs/swagger'

export class CreateServiceOrderDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  participants: number

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  duration: number

  @ApiProperty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateServiceOrderDetailDto)
  details: CreateServiceOrderDetailDto[]
}
