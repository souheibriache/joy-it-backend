import {
  Column,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  OneToOne,
} from 'typeorm'
import { SupportSubjectEnum } from '../enums'
import { SupportCategory } from '../enums/support-category.enum'
import { BaseEntity } from '@app/base-entity'
import { User } from 'src/user/entities'
import { Media } from '@app/media/entities'

@Entity('support')
export class Support extends BaseEntity {
  @Column({ name: 'first_name' })
  firstName: string

  @Column({ name: 'last_name' })
  lastName: string

  @Column()
  email: string

  @Column({ nullable: true })
  companyName?: string

  @Column()
  subject: string

  @Column({
    type: 'enum',
    enum: SupportCategory,
    default: SupportCategory.VISITOR,
  })
  category: SupportCategory

  @Column()
  question: string

  @Column({ nullable: true, name: 'admin_answer' })
  adminAnswer?: string

  @ManyToOne(() => User)
  @JoinColumn({ name: 'asked_by', referencedColumnName: 'id' })
  askedBy?: User

  @ManyToOne(() => User)
  @JoinColumn({ name: 'answered_by', referencedColumnName: 'id' })
  answeredBy: User

  @Column({ type: 'timestamptz', name: 'seen_at', nullable: true })
  seenAt: Date

  @Column({ type: 'timestamptz', name: 'answered_at', nullable: true })
  answeredAt: Date

  @ManyToMany(() => Media)
  @JoinTable({ name: 'attachment' })
  attachments: Media[]

  @ManyToMany(() => Media)
  @JoinTable({ name: 'question_attachment' })
  questionAttachments: Media[]
}
