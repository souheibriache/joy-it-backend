import { ApiProperty } from '@nestjs/swagger'
import { Transform } from 'class-transformer'
import { IsNotEmpty, IsNumber, IsPhoneNumber, IsString } from 'class-validator'

export class CreateCompanyDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  address: string

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  postalCode: string

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  city: string

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @IsPhoneNumber()
  phoneNumber: string

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  siretNumber: string

  @ApiProperty({ type: Number })
  @IsNumber()
  @Transform(({ value }) => Number(value))
  employeesNumber: number
}
