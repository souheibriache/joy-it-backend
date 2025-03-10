import { BaseEntity } from '@app/base-entity'
import { ActivityType } from 'src/activity/enums/activity-type.enum'
import { ServiceOrder } from 'src/service-order/entities'
import { Column, Entity, ManyToOne } from 'typeorm'

@Entity('service_order_detail')
export class ServiceOrderDetail extends BaseEntity {
  @ManyToOne(() => ServiceOrder, (order) => order.details, {
    onDelete: 'CASCADE',
  })
  order: ServiceOrder

  @Column({ type: 'enum', enum: ActivityType })
  serviceType: ActivityType

  @Column({ default: 1 })
  frequency: number

  @Column({ type: 'int', default: 0 })
  allowedBookings?: number

  @Column({ type: 'int', default: 0 })
  bookingsUsed: number
}
