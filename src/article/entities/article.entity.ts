import { BaseEntity } from '@app/base-entity';
import { Entity } from 'typeorm';

@Entity('article')
export class Article extends BaseEntity {}
