import { Module } from '@nestjs/common'
import { ArticleService } from './article.service'
import { ArticleController } from './article.controller'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Article, Paragraph } from './entities'
import { UploadModule } from '@app/upload'
import { MediaModule } from '@app/media'

@Module({
  imports: [
    TypeOrmModule.forFeature([Article, Paragraph]),
    UploadModule,
    MediaModule,
  ],
  controllers: [ArticleController],
  providers: [ArticleService],
})
export class ArticleModule {}
