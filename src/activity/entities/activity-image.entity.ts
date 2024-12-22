import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm'
import { Activity } from './activity.entity'
import { Media } from '@app/media/entities'

@Entity('activity_image')
export class ActivityImage extends Media {
  @Column({ type: 'boolean', default: false })
  isMain: boolean

  @ManyToOne(() => Activity, (activity: Activity) => activity.images, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ referencedColumnName: 'id', name: 'activity_id' })
  activity: Activity
}
