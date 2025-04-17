import { BaseEntity } from '@app/base-entity'
import { Column, Entity } from 'typeorm'

@Entity('newsletter')
export class Newsletter extends BaseEntity {
  @Column()
  email: string
}
