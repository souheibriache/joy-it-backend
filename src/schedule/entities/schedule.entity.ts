import { BaseEntity } from '@app/base-entity'
import { Activity } from 'src/activity/entities'
import { Company } from 'src/company/entities'
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm'
import { ScheduleStatusEnum } from '../enums'

@Entity('schedule')
export class Schedule extends BaseEntity {
  @ManyToOne(() => Company)
  @JoinColumn({ name: 'company_id', referencedColumnName: 'id' })
  company: Company

  @ManyToOne(() => Activity)
  @JoinColumn({ name: 'activity_id', referencedColumnName: 'id' })
  activity: Activity

  @Column({ type: 'timestamptz' })
  date: Date

  @Column({ type: 'int' })
  participants: number

  @Column({
    type: 'enum',
    enum: ScheduleStatusEnum,
    default: ScheduleStatusEnum.PENDING,
  })
  status: ScheduleStatusEnum
}
