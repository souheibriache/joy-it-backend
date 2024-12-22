import { BaseEntity } from '@app/base-entity'
import { User } from 'src/user/entities'
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm'

@Entity({ name: 'refresh_tokens' })
export class RefreshToken extends BaseEntity {
  @ManyToOne(() => User, (user) => user.refreshTokens, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User

  @Column({ name: 'login_from', default: 'WEB' })
  loginFrom: string

  @Column({ default: false, name: 'is_revoked' })
  isRevoked: boolean

  @Column()
  expires: Date
}
