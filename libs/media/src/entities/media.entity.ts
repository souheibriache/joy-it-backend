import { BaseEntity } from '@app/base-entity';
import { Column, Entity } from 'typeorm';

@Entity('media')
export class Media extends BaseEntity {
  @Column({ name: 'full_url' })
  fullUrl: string;
}
