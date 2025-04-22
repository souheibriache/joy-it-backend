import { IsNotEmpty, IsString } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class UpdateUserDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  firstName: string

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  lastName: string

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  userName: string
}
