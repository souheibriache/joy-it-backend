import { BaseEntity } from '@app/base-entity';
import { Activity } from 'src/activity/entities';
import { Column, Entity, JoinTable, ManyToMany } from 'typeorm';

@Entity('plan')
export class Plan extends BaseEntity {
  @Column({ type: 'float' })
  price: number;

  @Column({ type: 'int' })
  credit: number;

  @ManyToMany(() => Activity)
  @JoinTable({ name: 'activity_id' })
  activities: Activity[];
}
