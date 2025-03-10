import { BaseEntity } from '@app/base-entity'
import { Company } from 'src/company/entities'
import { ServiceOrderDetail } from 'src/service-order-detail/entities'
import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm'
import { ServiceOrderStatus } from '../enums/service-order-status.enum'

@Entity('service_order')
export class ServiceOrder extends BaseEntity {
  @ManyToOne(() => Company, (company) => company.serviceOrders, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'company_id' })
  company: Company

  @Column({ type: 'timestamptz', nullable: true })
  startDate: Date

  @Column({ type: 'timestamptz', nullable: true })
  endDate: Date

  @Column({ type: 'int', nullable: true })
  duration: number

  @Column({ type: 'int' })
  participants: number

  @Column({ type: 'float' })
  totalCost: number

  @Column({
    type: 'enum',
    enum: ServiceOrderStatus,
    default: ServiceOrderStatus.PENDING,
  })
  status: ServiceOrderStatus
  @OneToMany(() => ServiceOrderDetail, (detail) => detail.order, {
    cascade: true,
  })
  details: ServiceOrderDetail[]

  @Column({ name: 'stripe_checkout_session', nullable: true })
  stripeCheckoutSession?: string
}
