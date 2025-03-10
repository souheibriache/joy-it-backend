import { BaseEntity } from '@app/base-entity'
import { Column, Entity } from 'typeorm'

@Entity('pricing')
export class Pricing extends BaseEntity {
  @Column({ type: 'int', default: 0 })
  employee: number

  @Column({ type: 'int', default: 0 })
  month: number

  @Column({ type: 'int', default: 0 })
  snacking: number

  @Column({ type: 'int', default: 0 })
  teambuilding: number

  @Column({ type: 'int', name: 'well_being', default: 0 })
  wellBeing: number

  @Column({ type: 'int', name: 'base_price', default: 0 })
  basePrice: number
}
