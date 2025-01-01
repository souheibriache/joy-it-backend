import { ApiProperty } from '@nestjs/swagger'
import { Transform } from 'class-transformer'
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator'
import { ActivityType } from '../enums/activity-type.enum'

export class CreateActivityDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  description: string

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
  locationUrl: string

  @ApiProperty()
  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  @Transform(({ value }) => Number(value))
  duration: number

  @ApiProperty()
  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  @Transform(({ value }) => Number(value))
  participants: number

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  @Transform(({ value }) => Number(value))
  creditCost: number

  @ApiProperty({ type: Number, default: 0 })
  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => Number(value))
  mainImageIndex: number

  @ApiProperty({ type: Boolean, default: true })
  @IsBoolean()
  @IsOptional()
  isAvailable: boolean

  @ApiProperty({ isArray: true, enum: ActivityType })
  @IsEnum(ActivityType, { each: true })
  types: ActivityType[]

  @ApiProperty({ isArray: true, default: [] })
  @IsArray()
  keyWords: string[]

  @ApiProperty({ type: Boolean, default: false })
  @IsBoolean()
  @IsOptional()
  isInsideCompany: boolean
}
