import { BaseEntity } from '@app/base-entity'
import { RefreshToken } from 'src/auth/entities/refresh-token.entity'
import {
  Column,
  Entity,
  JoinColumn,
  OneToMany,
  TableInheritance,
  OneToOne,
} from 'typeorm'
import { UserRoles } from '../enums/user-roles.enum'
import { Password } from 'src/auth/entities/password-history'
import { Article } from 'src/article/entities'

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
  @Column({ unique: true })
  userName: string

  @Column({ unique: true })
  email: string

  @Column()
  firstName: string

  @Column()
  lastName: string

  @Column({
    type: 'enum',
    enum: UserRoles,
    default: UserRoles.CLIENT,
  })
  role: UserRoles = UserRoles.CLIENT

  @Column({ default: false })
  isSuperUser: boolean = false

  @OneToMany(() => RefreshToken, (refreshToken) => refreshToken.user)
  refreshTokens: RefreshToken[]

  @OneToMany(() => Article, (article) => article.author)
  articles: Article[]

  @OneToOne(() => Password, (password) => password.user)
  passwords: string
}
