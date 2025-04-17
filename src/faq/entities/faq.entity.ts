import { BaseEntity } from '@app/base-entity'
import { Column, Entity } from 'typeorm'

@Entity('faq')
export class Faq extends BaseEntity {
  @Column({ type: 'text' })
  question: string

  @Column({ type: 'text' })
  answer: string
}
