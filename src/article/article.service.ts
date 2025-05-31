import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Article } from './entities'
import {
  Any,
  Brackets,
  FindOptionsRelations,
  FindOptionsWhere,
  ILike,
  Repository,
} from 'typeorm'
import { Paragraph } from './entities/paragraph.entity'
import { CreateArticleDto, CreateParagraphDto, UpdateArticleDto } from './dto'
import { UploadService } from '@app/upload'
import { MediaService } from '@app/media'
import { UpdateParagraphDto } from './dto/update-paragraph.dto'
import { ArticleOptionsDto } from './dto/article-options.dto'
import { PageDto, PageMetaDto } from '@app/pagination/dto'
import { ArticleFilterDto } from './dto/article-filter.dto'
import { User } from 'src/user/entities'

@Injectable()
export class ArticleService {
  constructor(
    @InjectRepository(Article)
    private readonly articleRepository: Repository<Article>,
    @InjectRepository(Paragraph)
    private readonly paragraphRepository: Repository<Paragraph>,
    private readonly uploadService: UploadService,
    private readonly mediaService: MediaService,
  ) {}

  async create(createArticleDto: CreateArticleDto) {
    const article = this.articleRepository.create(createArticleDto)
    return await this.articleRepository.save(article)
  }

  async findOne(where: FindOptionsWhere<Article>) {
    return await this.articleRepository.findOne({ where })
  }

  async getPaginated(pageOptionsDto: ArticleOptionsDto) {
    const queryBuilder = this.articleRepository.createQueryBuilder('article')

    if (pageOptionsDto.orderBy) {
      queryBuilder.orderBy(`article.${pageOptionsDto.orderBy}`, 'ASC')
    }

    queryBuilder.skip(pageOptionsDto.skip).take(pageOptionsDto.take)

    const [items, itemCount] = await queryBuilder.getManyAndCount()

    const pageMetaDto = new PageMetaDto({
      itemCount,
      pageOptionsDto,
    })

    return {
      items,
      meta: pageMetaDto,
    }
  }

  async createArticle(
    createArticleDto: CreateArticleDto,
    uploadedThumbnail: Express.Multer.File | null,
    uploadedParagraphImages: Express.Multer.File[],
    author: User,
  ): Promise<Article> {
    return await this.articleRepository.manager.transaction(async (manager) => {
      const { paragraphs, ...articleData } = createArticleDto

      let thumbnailMedia = null
      if (uploadedThumbnail) {
        const uploadedFile = await this.uploadService.upload(
          uploadedThumbnail,
          'articles',
        )
        // console.log({ paragraphs })
        thumbnailMedia = await this.mediaService.create({
          fullUrl: uploadedFile.url,
          name: uploadedFile.display_name,
          originalName: uploadedFile.original_filename,
          placeHolder: articleData.title,
          resourceType: uploadedFile.resource_type,
        })
      }

      const article = manager.create(Article, {
        ...articleData,
        author,
        thumbnail: thumbnailMedia,
      })
      await manager.save(article)

      if (paragraphs && paragraphs.length > 0) {
        for (const pDto of paragraphs) {
          let paragraphImage = null
          if (pDto.imageIndex !== undefined && pDto.imageIndex !== null) {
            const index = pDto.imageIndex
            if (index >= 0 && index < uploadedParagraphImages.length) {
              const uploadedFile = await this.uploadService.upload(
                uploadedParagraphImages[index],
                'paragraphs',
              )
              paragraphImage = await this.mediaService.create({
                fullUrl: uploadedFile.url,
                name: uploadedFile.display_name,
                originalName: uploadedFile.original_filename,
                placeHolder: pDto.title || 'Untitled Paragraph',
                resourceType: uploadedFile.resource_type,
              })
            }
          }

          const paragraph = manager.create(Paragraph, {
            title: pDto.title,
            content: pDto.content,
            image: paragraphImage,
            article: article,
          })
          await manager.save(paragraph)
        }
      }

      const createdArticle = await manager.findOne(Article, {
        where: { id: article.id },
        relations: {
          author: true,
          paragraphs: { image: true },
          thumbnail: true,
        },
      })

      if (!createdArticle) {
        throw new NotFoundException('Article creation failed')
      }
      return createdArticle
    })
  }

  async updateArticle(
    articleId: string,
    updateArticleDto: UpdateArticleDto,
    thumbnail?: Express.Multer.File,
  ): Promise<Article> {
    return await this.articleRepository.manager.transaction(async (manager) => {
      const article = await manager.findOne(Article, {
        where: { id: articleId },
        relations: { thumbnail: true },
      })

      if (!article) {
        throw new NotFoundException('Article not found')
      }

      Object.assign(article, updateArticleDto)
      if (thumbnail) {
        const uploadedFile = await this.uploadService.upload(
          thumbnail,
          'articles',
        )
        const newThumbnail = await this.mediaService.create({
          fullUrl: uploadedFile.url,
          name: uploadedFile.display_name,
          originalName: uploadedFile.original_filename,
          placeHolder:
            updateArticleDto.title || article.title || 'Untitled Article',
          resourceType: uploadedFile.resource_type,
        })
        article.thumbnail = newThumbnail
      }

      await manager.save(article)

      const updatedArticle = await manager.findOne(Article, {
        where: { id: article.id },
        relations: { paragraphs: { image: true }, thumbnail: true },
      })

      if (!updatedArticle) {
        throw new NotFoundException('Article update failed')
      }

      return updatedArticle
    })
  }

  async createParagraph(
    articleId: string,
    createParagraphDto: CreateParagraphDto,
    image?: Express.Multer.File,
  ): Promise<Paragraph> {
    const article = await this.articleRepository.findOne({
      where: { id: articleId },
    })
    if (!article) {
      throw new NotFoundException('Article not found')
    }

    let paragraphImage = null
    if (image) {
      const uploadedFile = await this.uploadService.upload(image, 'paragraphs')
      paragraphImage = await this.mediaService.create({
        fullUrl: uploadedFile.url,
        name: uploadedFile.display_name,
        originalName: uploadedFile.original_filename,
        placeHolder: createParagraphDto.title || 'Untitled Paragraph',
        resourceType: uploadedFile.resource_type,
      })
    }

    const paragraph = this.paragraphRepository.create({
      ...createParagraphDto,
      image: paragraphImage,
      article,
    })
    return await this.paragraphRepository.save(paragraph)
  }

  async updateParagraph(
    articleId: string,
    paragraphId: string,
    updateParagraphDto: UpdateParagraphDto,
    image?: Express.Multer.File,
  ): Promise<Paragraph> {
    const paragraph = await this.paragraphRepository.findOne({
      where: { id: paragraphId, article: { id: articleId } },
      relations: ['image'],
    })
    if (!paragraph) {
      throw new NotFoundException('Paragraph not found')
    }

    Object.assign(paragraph, updateParagraphDto)

    if (image) {
      const uploadedFile = await this.uploadService.upload(image, 'paragraphs')
      const newMedia = await this.mediaService.create({
        fullUrl: uploadedFile.url,
        name: uploadedFile.display_name,
        originalName: uploadedFile.original_filename,
        placeHolder:
          updateParagraphDto.title || paragraph.title || 'Untitled Paragraph',
        resourceType: uploadedFile.resource_type,
      })
      paragraph.image = newMedia
    }

    return await this.paragraphRepository.save(paragraph)
  }

  async deleteParagraph(
    articleId: string,
    paragraphId: string,
  ): Promise<boolean> {
    const paragraph = await this.paragraphRepository.findOne({
      where: { id: paragraphId, article: { id: articleId } },
    })

    if (!paragraph) {
      throw new NotFoundException('Paragraph not found')
    }
    await this.paragraphRepository.remove(paragraph)
    return true
  }

  async findById(id: string) {
    const article = await this.articleRepository.findOne({
      where: { id },
      relations: { author: true, paragraphs: { image: true }, thumbnail: true },
    })

    if (!article) throw new NotFoundException('Article not found')

    return article
  }

  async getPaginatedArticles(
    articleOptionsDto: ArticleOptionsDto,
  ): Promise<PageDto<Article>> {
    const {
      sort,
      skip,
      take,
      query = {} as ArticleFilterDto,
    } = articleOptionsDto
    const { search, tags } = query

    let where: FindOptionsWhere<Article>[] = []

    if (search) {
      const baseConditions = tags && tags.length > 0 ? { tags: Any(tags) } : {}

      where.push({
        title: ILike(`%${search}%`),
        ...baseConditions,
      })
      where.push({
        subtitle: ILike(`%${search}%`),
        ...baseConditions,
      })
    } else if (tags && tags.length > 0) {
      where = [{ tags: Any(tags) }]
    }

    const order = sort ? sort : {}

    const [items, itemCount] = await this.articleRepository.findAndCount({
      where: where.length > 0 ? where : {},
      relations: { thumbnail: true, paragraphs: { image: true }, author: true },
      order: order,
      skip,
      take,
    })

    const pageMetaDto = new PageMetaDto({
      itemCount,
      pageOptionsDto: articleOptionsDto,
    })
    return new PageDto(items, pageMetaDto)
  }

  async deleteArticle(id: string): Promise<void> {
    const article = await this.articleRepository.findOne({
      where: { id },
      relations: { thumbnail: true },
    })

    if (!article) throw new NotFoundException('Article not found')

    if (article.thumbnail) {
      await this.mediaService.delete(article.thumbnail.id)
    }

    await this.articleRepository.remove(article)
  }
}
