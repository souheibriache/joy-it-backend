import { Article } from '../entities/article.entity'
import { IUniqueIdentifier } from '@app/common/interfaces/unique-identifier.interface'

export type IArticle = Article & IUniqueIdentifier
