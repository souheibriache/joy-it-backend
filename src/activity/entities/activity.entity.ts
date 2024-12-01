import { BaseEntity } from '@app/base-entity';
import { Column, Entity, OneToMany } from 'typeorm';
import { ActivityImage } from './activity-image.entity';
import { ActivityType } from '../enums/activity-type.enum';

@Entity('activity')
export class Activity extends BaseEntity {
  @Column()
  name: string;

  @Column()
  description: string;

  @Column({ array: true, type: 'text' })
  keyWords: string[];

  @Column()
  address: string;

  @Column({ name: 'postal_code' })
  postalCode: string;

  @Column()
  city: string;

  @Column({ name: 'location_url' })
  locationUrl: string;

  @Column({ name: 'duration', type: 'int' })
  duration: number; // Duration in hours

  @Column({
    type: 'enum',
    enum: ActivityType,
    array: true,
    default: [ActivityType.AUTRE],
  })
  types: ActivityType[];

  @Column({ type: 'boolean', default: true })
  isAvailable: boolean;

  @Column({ type: 'int', name: 'credit_cost' })
  creditCost: number;

  @OneToMany(() => ActivityImage, (image: ActivityImage) => image.activity, {
    onDelete: 'CASCADE',
  })
  images: ActivityImage[];
}
