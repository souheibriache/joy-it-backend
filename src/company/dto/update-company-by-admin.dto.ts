import { ApiProperty, PartialType } from '@nestjs/swagger'
import { UpdateCompanyDto } from './update-company.dto'
import { IsBoolean } from 'class-validator'

export class updateCompanyByAdmin extends PartialType(UpdateCompanyDto) {
  @ApiProperty()
  @IsBoolean()
  isVerified: boolean
}
