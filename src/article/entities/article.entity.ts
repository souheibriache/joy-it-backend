import { BaseEntity } from '@app/base-entity'
import { Media } from '@app/media/entities'
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
} from 'typeorm'
import { Paragraph } from './paragraph.entity'
import { User } from 'src/user/entities'

@Entity('article')
export class Article extends BaseEntity {
  @Column()
  title: string

  @Column()
  subtitle: string

  @Column({ nullable: true })
  introduction?: string

  @Column({ nullable: true })
  conclusion?: string

  @Column({ type: 'text', array: true })
  tags: string[]

  @ManyToOne(() => Media, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'thumbnail', referencedColumnName: 'id' })
  thumbnail: Media

  @OneToMany(() => Paragraph, (paragraph: Paragraph) => paragraph.article, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  paragraphs: Paragraph[]

  @ManyToOne(() => User, (user) => user.articles, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'author_id', referencedColumnName: 'id' })
  author: User
}
