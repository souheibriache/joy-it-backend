import { BaseEntity } from '@app/base-entity'
import { RefreshToken } from 'src/auth/entities/refresh-token.entity'
import { Column, Entity, OneToMany, TableInheritance } from 'typeorm'
import { UserRoles } from '../enums/user-roles.enum'
import { Password } from 'src/auth/entities/password-history'

@Entity({ name: 'users' })
@TableInheritance({
  column: {
    name: 'role',
    type: 'enum',
    enum: UserRoles,
    enumName: 'UserRoles',
  },
})
export class User extends BaseEntity {
  @Column({ name: 'user_name' })
  userName: string

  @OneToMany(() => Password, (password: Password) => password.user, {
    cascade: true,
  })
  passwords: string

  @Column({ type: String, nullable: false })
  email: string

  @Column({ name: 'first_name' })
  firstName: string

  @Column({ name: 'last_name' })
  lastName: string

  @Column({ type: 'enum', enum: UserRoles, default: UserRoles.CLIENT })
  role: UserRoles

  @Column({ type: 'boolean', default: false })
  isSuperUser: boolean

  @OneToMany(() => RefreshToken, (refreshToken) => refreshToken.user, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  refreshTokens: RefreshToken[]
}
