import { BaseEntity } from '@app/base-entity'
import { Column, Entity, OneToMany } from 'typeorm'
import { ActivityImage } from './activity-image.entity'
import { ActivityType } from '../enums/activity-type.enum'

@Entity('activity')
export class Activity extends BaseEntity {
  @Column()
  name: string

  @Column()
  description: string

  @Column({ array: true, type: 'text', name: 'key_words', nullable: true })
  keyWords: string[]

  @Column({ nullable: true })
  address?: string

  @Column({ name: 'postal_code', nullable: true })
  postalCode?: string

  @Column({ nullable: true })
  city?: string

  @Column({ name: 'location_url', nullable: true })
  locationUrl?: string

  @Column({ default: false, type: 'boolean' })
  isInsideCompany: boolean

  @Column({ name: 'duration', type: 'int' })
  duration: number // Duration in hours

  @Column({ name: 'participants', type: 'int', default: 0 })
  participants: number

  @Column({
    type: 'enum',
    enum: ActivityType,
    default: ActivityType.NOURRITURE,
  })
  type: ActivityType

  @Column({ type: 'boolean', default: true })
  isAvailable: boolean

  @Column({ type: 'float', nullable: true })
  basePrice?: number

  @OneToMany(() => ActivityImage, (image: ActivityImage) => image.activity, {
    cascade: true,
  })
  images: ActivityImage[]
}
