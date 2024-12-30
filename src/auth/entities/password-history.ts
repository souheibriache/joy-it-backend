import { BaseEntity } from '@app/base-entity'
import { User } from 'src/user/entities'
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm'

@Entity('password')
export class Password extends BaseEntity {
  @ManyToOne(() => User, (user: User) => user.passwords, {
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  user: User

  @Column()
  hash: string

  @Column({ type: 'boolean', default: true })
  isCurrent: boolean
}
