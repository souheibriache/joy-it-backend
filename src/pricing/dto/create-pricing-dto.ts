import { ApiProperty } from '@nestjs/swagger'
import { IsNumber } from 'class-validator'

export class CreatePricingDto {
  @ApiProperty()
  @IsNumber()
  employee?: number = 0

  @ApiProperty()
  @IsNumber()
  month?: number = 0

  @ApiProperty()
  @IsNumber()
  snacking?: number = 0

  @ApiProperty()
  @IsNumber()
  teambuilding?: number = 0

  @ApiProperty()
  @IsNumber()
  wellBeing?: number = 0
}
