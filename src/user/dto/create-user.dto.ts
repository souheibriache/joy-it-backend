import { ApiProperty } from '@nestjs/swagger'

export class CreateUserDto {
  @ApiProperty()
  userName: string

  @ApiProperty()
  firstName: string

  @ApiProperty()
  lastName: string

  @ApiProperty()
  email: string

  @ApiProperty()
  password?: string
}
