import {
  Body,
  Controller,
  Delete,
  FileTypeValidator,
  Get,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  Req,
  Request,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common'
import { ArticleService } from './article.service'
import {
  FileFieldsInterceptor,
  FileInterceptor,
  FilesInterceptor,
} from '@nestjs/platform-express'
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger'
import { MEDIA_TYPES } from '@app/upload/constants/file.types'
import { CreateArticleDto, CreateParagraphDto, UpdateArticleDto } from './dto'
import { AccessTokenGuard } from 'src/auth/guards/access-token.guard'
import { SuperUserGuard } from 'src/auth/guards/super-user.guard'
import { ArticleOptionsDto } from './dto/article-options.dto'
import { PageDto } from '@app/pagination/dto'
import { Article } from './entities'
import { UpdateParagraphDto } from './dto/update-paragraph.dto'
import { IRequestWithUser } from '@app/common/interfaces/request-user.interface.dto'

@Controller('articles')
@ApiTags('Articles')
export class ArticleController {
  constructor(private readonly articleService: ArticleService) {}

  @Post()
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'thumbnail', maxCount: 1 },
      { name: 'paragraphImages', maxCount: 10 },
    ]),
  )
  @UseGuards(AccessTokenGuard, SuperUserGuard)
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  async createArticle(
    @Request() req: IRequestWithUser,
    @Body() createArticleDto: CreateArticleDto,
    @UploadedFiles()
    files: {
      thumbnail?: Express.Multer.File[]
      paragraphImages?: Express.Multer.File[]
    },
  ) {
    const thumbnail =
      files.thumbnail && files.thumbnail.length > 0 ? files.thumbnail[0] : null

    const paragraphImages = files.paragraphImages ?? []
    const user = req?.user

    console.log({ user })
    return this.articleService.createArticle(
      createArticleDto,
      thumbnail,
      paragraphImages,
      user,
    )
  }

  @Put(':articleId')
  @UseGuards(AccessTokenGuard, SuperUserGuard)
  @ApiBearerAuth()
  @UseInterceptors(FileFieldsInterceptor([{ name: 'thumbnail', maxCount: 1 }]))
  @ApiConsumes('multipart/form-data')
  async updateArticle(
    @Param('articleId', ParseUUIDPipe) articleId: string,
    @Body() updateArticleDto: UpdateArticleDto,
    @UploadedFiles() files: { thumbnail?: Express.Multer.File[] },
  ) {
    const thumbnail =
      files?.thumbnail && files?.thumbnail?.length > 0
        ? files.thumbnail[0]
        : undefined
    return await this.articleService.updateArticle(
      articleId,
      updateArticleDto,
      thumbnail,
    )
  }

  @Post(':articleId/paragraphs')
  @UseGuards(AccessTokenGuard, SuperUserGuard)
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('image'))
  @ApiConsumes('multipart/form-data')
  async createParagraph(
    @Param('articleId', ParseUUIDPipe) articleId: string,
    @Body() createParagraphDto: CreateParagraphDto,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }), // 10MB
          new FileTypeValidator({ fileType: MEDIA_TYPES.IMAGE }),
        ],
        fileIsRequired: false,
      }),
    )
    image?: Express.Multer.File,
  ) {
    return await this.articleService.createParagraph(
      articleId,
      createParagraphDto,
      image,
    )
  }

  @Put(':articleId/paragraphs/:paragraphId')
  @UseGuards(AccessTokenGuard, SuperUserGuard)
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('image'))
  @ApiConsumes('multipart/form-data')
  async updateParagraph(
    @Param('articleId', ParseUUIDPipe) articleId: string,
    @Param('paragraphId', ParseUUIDPipe) paragraphId: string,
    @Body() updateParagraphDto: UpdateParagraphDto,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }), // 10MB
          new FileTypeValidator({ fileType: MEDIA_TYPES.IMAGE }),
        ],
        fileIsRequired: false,
      }),
    )
    image?: Express.Multer.File,
  ) {
    return await this.articleService.updateParagraph(
      articleId,
      paragraphId,
      updateParagraphDto,
      image,
    )
  }

  @Get(':id')
  async findById(@Param('id', ParseUUIDPipe) id: string) {
    return await this.articleService.findById(id)
  }

  @Get()
  async getPaginatedArticles(
    @Query() articleOptionsDto: ArticleOptionsDto,
  ): Promise<PageDto<Article>> {
    return await this.articleService.getPaginatedArticles(articleOptionsDto)
  }

  @Delete(':articleId/paragraphs/:paragraphId')
  @UseGuards(AccessTokenGuard, SuperUserGuard)
  @ApiBearerAuth()
  async deleteParagraph(
    @Param('articleId', ParseUUIDPipe) articleId: string,
    @Param('paragraphId', ParseUUIDPipe) paragraphId: string,
  ) {
    return await this.articleService.deleteParagraph(articleId, paragraphId)
  }

  @Delete(':id')
  async deleteArticle(@Param('id') id: string): Promise<{ message: string }> {
    await this.articleService.deleteArticle(id)
    return { message: 'Article deleted successfully' }
  }
}
