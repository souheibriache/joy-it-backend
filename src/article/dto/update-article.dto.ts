import { OmitType, PartialType } from '@nestjs/swagger'
import { CreateArticleDto } from './create-article.dto'

export class UpdateArticleDto extends OmitType(PartialType(CreateArticleDto), [
  'paragraphs',
] as const) {}
