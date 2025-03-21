import { BaseEntity } from '@app/base-entity'
import { Media } from '@app/media/entities'
import { Client } from 'src/client/entities'
import { ServiceOrder } from 'src/service-order/entities'
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
} from 'typeorm'

@Entity('company')
export class Company extends BaseEntity {
  @OneToOne(() => Client, (client: Client) => client.company, {
    onDelete: 'CASCADE',
  })
  client: Client

  @Column()
  name: string

  @Column()
  address: string

  @Column({ name: 'postal_code' })
  postalCode: string

  @Column()
  city: string

  @Column({ name: 'phone_number' })
  phoneNumber: string

  @Column({ name: 'siret_number', nullable: true })
  siretNumber: string

  @Column({ name: 'employees_number', type: 'int' })
  employeesNumber: number

  @OneToOne(() => Media)
  @JoinColumn({ name: 'logo_id', referencedColumnName: 'id' })
  logo: Media

  @OneToMany(() => ServiceOrder, (serviceOrder) => serviceOrder.company, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  serviceOrders: ServiceOrder[]

  @Column({ type: 'int', default: 0 })
  credit: number

  @Column({ type: 'boolean', name: 'is_verified', default: false })
  isVerified: boolean

  @Column({ nullable: true, select: false })
  stripeCustomerId: string
}
