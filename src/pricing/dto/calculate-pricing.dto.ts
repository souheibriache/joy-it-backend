import { ApiProperty } from '@nestjs/swagger'
import { IsBoolean, IsNumber } from 'class-validator'

export class CalculatePricingDto {
  @ApiProperty()
  @IsNumber()
  snackingFrequency: number

  @ApiProperty()
  @IsNumber()
  wellBeingFrequency: number

  @ApiProperty()
  @IsNumber()
  numberOfParticipants: number

  @ApiProperty()
  @IsNumber()
  months: number

  @ApiProperty()
  @IsBoolean()
  snacking: boolean

  @ApiProperty()
  @IsBoolean()
  teambuilding: boolean

  @ApiProperty()
  @IsBoolean()
  wellBeing: boolean
}
