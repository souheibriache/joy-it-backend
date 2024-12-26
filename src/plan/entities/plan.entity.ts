import { BaseEntity } from '@app/base-entity'
import { Activity } from 'src/activity/entities'
import { Column, Entity, JoinTable, ManyToMany } from 'typeorm'

@Entity('plan')
export class Plan extends BaseEntity {
  @Column()
  name: string

  @Column({ type: 'float' })
  price: number

  @Column({ type: 'int' })
  credit: number

  @Column({ array: true, type: 'text' })
  benifits: string[]

  @ManyToMany(() => Activity)
  @JoinTable({ name: 'activity_id' })
  activities: Activity[]

  @Column({ nullable: true, select: false })
  stripePriceId: string

  @Column({ nullable: true, select: false })
  stripeProductId: string
}
