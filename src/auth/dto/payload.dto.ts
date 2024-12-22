import { MetadataDto } from './metadata.dto'

export class Payload {
  sub: string
  jwtId?: string
  metadata: MetadataDto
  iat?: number
  exp?: number
}
