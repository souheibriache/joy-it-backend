import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty, IsNumber } from 'class-validator'

export class CreatePricingDto {
  @ApiProperty()
  @IsNumber()
  employee?: number

  @ApiProperty()
  @IsNumber()
  month?: number

  @ApiProperty()
  @IsNumber()
  snacking?: number

  @ApiProperty()
  @IsNumber()
  teambuilding?: number

  @ApiProperty()
  @IsNumber()
  wellBeing?: number
}
