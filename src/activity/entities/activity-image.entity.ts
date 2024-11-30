import { BaseEntity } from '@app/base-entity';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { Activity } from './activity.entity';
import { Media } from '@app/media/entities';

@Entity('product_image')
export class ActivityImage extends Media {
  @Column({ type: 'boolean', default: false })
  isMain: boolean;

  @ManyToOne(() => Activity, (activity: Activity) => activity.images, {
    cascade: true,
  })
  @JoinColumn({ referencedColumnName: 'id', name: 'activity_id' })
  activity: Activity;
}
