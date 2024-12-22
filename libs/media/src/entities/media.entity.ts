import { BaseEntity } from '@app/base-entity'
import { Column, Entity } from 'typeorm'
import { ResourceTypeEnum } from '../enums/resource-type.enum'

@Entity('media')
export class Media extends BaseEntity {
  @Column({ name: 'full_url' })
  fullUrl: string

  @Column({ name: 'name' })
  name: string

  @Column({ name: 'original_name' })
  originalName: string

  @Column({ name: 'place_holder' })
  placeHolder: string

  @Column({ name: 'resource_type', type: 'enum', enum: ResourceTypeEnum })
  resourceType: ResourceTypeEnum
}
