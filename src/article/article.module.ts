import { Module } from '@nestjs/common'
import { ArticleService } from './article.service'
import { ArticleController } from './article.controller'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Article, Paragraph } from './entities'

@Module({
  imports: [TypeOrmModule.forFeature([Article, Paragraph])],
  controllers: [ArticleController],
  providers: [ArticleService],
})
export class ArticleModule {}
