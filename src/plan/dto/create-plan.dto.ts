import { IsUnique } from '@app/pagination/decorators/is-unique-decorator'
import { ApiProperty } from '@nestjs/swagger'
import { Transform } from 'class-transformer'
import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsString,
  Validate,
} from 'class-validator'
import { UUID } from 'typeorm/driver/mongodb/bson.typings'

export class CreatePlanDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  name: string

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  @Transform(({ value }) => Number(value))
  credit: number

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  @Transform(({ value }) => Number(value))
  price: number

  @ApiProperty({ isArray: true })
  @IsArray()
  benifits: string[]

  @ApiProperty({ isArray: true, type: UUID })
  @IsArray()
  @Validate(IsUnique)
  activities: string[]
}
