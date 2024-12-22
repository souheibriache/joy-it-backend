import { OmitType } from '@nestjs/swagger'
import { CreateClientDto } from './create-client.dto'

export class UpdateClientDto extends OmitType(CreateClientDto, [
  'email',
  'password',
]) {}
