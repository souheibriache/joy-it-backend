import { Media } from '@app/media/entities'
import { Column, Entity, JoinColumn, ManyToOne, OneToOne } from 'typeorm'
import { Article } from './article.entity'
import { BaseEntity } from '@app/base-entity'

@Entity('paragraph')
export class Paragraph extends BaseEntity {
  @ManyToOne(() => Media, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'image', referencedColumnName: 'id' })
  image?: Media

  @Column()
  title: string

  @Column({ nullable: true })
  subtitle?: string

  @Column()
  content: string

  @ManyToOne(() => Article, (article: Article) => article.paragraphs, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'article_id', referencedColumnName: 'id' })
  article: Article
}
