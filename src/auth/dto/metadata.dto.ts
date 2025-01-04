import { UserRoles } from 'src/user/enums/user-roles.enum'

export class MetadataDto {
  role: UserRoles
  isVerified?: boolean
  email: string
}
