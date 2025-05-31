import { Test, TestingModule } from '@nestjs/testing'
import { ArticleController } from './article.controller'
import { ArticleService } from './article.service'
import { CreateArticleDto } from './dto'
import { CreateParagraphDto } from './dto/create-paragraph.dto'
import { ArticleOptionsDto } from './dto/article-options.dto'
import { Article } from './entities'
import { UserRoles } from 'src/user/enums/user-roles.enum'
import { AccessTokenGuard } from 'src/auth/guards/access-token.guard'
import { SuperUserGuard } from 'src/auth/guards/super-user.guard'
import { User } from 'src/user/entities'
import { PageDto, PageMetaDto } from '@app/pagination/dto'

describe('ArticleController', () => {
  let controller: ArticleController
  let service: ArticleService

  const mockArticleService = {
    createArticle: jest.fn(),
    updateArticle: jest.fn(),
    createParagraph: jest.fn(),
    updateParagraph: jest.fn(),
    findById: jest.fn(),
    getPaginatedArticles: jest.fn(),
    deleteParagraph: jest.fn(),
    deleteArticle: jest.fn(),
    create: jest.fn(),
    findOne: jest.fn(),
    getPaginated: jest.fn(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ArticleController],
      providers: [
        {
          provide: ArticleService,
          useValue: mockArticleService,
        },
      ],
    })
      .overrideGuard(AccessTokenGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(SuperUserGuard)
      .useValue({ canActivate: () => true })
      .compile()

    controller = module.get<ArticleController>(ArticleController)
    service = module.get<ArticleService>(ArticleService)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })

  describe('createArticle', () => {
    const mockCreateArticleDto: CreateArticleDto = {
      title: 'Test Article',
      description: 'Test Description',
      subtitle: 'Test Subtitle',
      introduction: 'Test Introduction',
      conclusion: 'Test Conclusion',
      tags: ['test', 'article'],
      paragraphs: [],
    }

    const mockUser: Partial<User> = {
      id: '1',
      email: 'test@example.com',
    }

    const mockFiles = {
      thumbnail: [
        {
          fieldname: 'thumbnail',
          originalname: 'test.jpg',
          encoding: '7bit',
          mimetype: 'image/jpeg',
          size: 12345,
          destination: '/tmp',
          filename: 'test.jpg',
          path: '/tmp/test.jpg',
          buffer: Buffer.from('test'),
          stream: null as any,
        } as Express.Multer.File,
      ],
      paragraphImages: [
        {
          fieldname: 'paragraphImage',
          originalname: 'paragraph.jpg',
          encoding: '7bit',
          mimetype: 'image/jpeg',
          size: 12345,
          destination: '/tmp',
          filename: 'paragraph.jpg',
          path: '/tmp/paragraph.jpg',
          buffer: Buffer.from('test'),
          stream: null as any,
        } as Express.Multer.File,
      ],
    }

    it('should create an article with thumbnail', async () => {
      const expectedResult = { id: '1', ...mockCreateArticleDto }
      mockArticleService.createArticle.mockResolvedValue(expectedResult)

      const result = await controller.createArticle(
        { user: mockUser } as any,
        mockCreateArticleDto,
        mockFiles,
      )

      expect(result).toEqual(expectedResult)
      expect(mockArticleService.createArticle).toHaveBeenCalledWith(
        mockCreateArticleDto,
        mockFiles.thumbnail[0],
        mockFiles.paragraphImages,
        mockUser,
      )
    })

    it('should create an article without thumbnail', async () => {
      const expectedResult = { id: '1', ...mockCreateArticleDto }
      mockArticleService.createArticle.mockResolvedValue(expectedResult)

      const result = await controller.createArticle(
        { user: mockUser } as any,
        mockCreateArticleDto,
        { paragraphImages: [] },
      )

      expect(result).toEqual(expectedResult)
      expect(mockArticleService.createArticle).toHaveBeenCalledWith(
        mockCreateArticleDto,
        null,
        [],
        mockUser,
      )
    })
  })

  describe('updateArticle', () => {
    const mockUpdateArticleDto = {
      title: 'Updated Article',
      description: 'Updated Description',
    }

    const mockFiles = {
      thumbnail: [
        {
          fieldname: 'thumbnail',
          originalname: 'updated.jpg',
          encoding: '7bit',
          mimetype: 'image/jpeg',
          size: 12345,
          destination: '/tmp',
          filename: 'updated.jpg',
          path: '/tmp/updated.jpg',
          buffer: Buffer.from('test'),
          stream: null as any,
        } as Express.Multer.File,
      ],
    }

    it('should update an article with new thumbnail', async () => {
      const articleId = '1'
      const expectedResult = { id: articleId, ...mockUpdateArticleDto }
      mockArticleService.updateArticle.mockResolvedValue(expectedResult)

      const result = await controller.updateArticle(
        articleId,
        mockUpdateArticleDto,
        mockFiles,
      )

      expect(result).toEqual(expectedResult)
      expect(mockArticleService.updateArticle).toHaveBeenCalledWith(
        articleId,
        mockUpdateArticleDto,
        mockFiles.thumbnail[0],
      )
    })
  })

  describe('findById', () => {
    it('should return an article by id', async () => {
      const articleId = '1'
      const expectedResult = { id: articleId, title: 'Test Article' }
      mockArticleService.findById.mockResolvedValue(expectedResult)

      const result = await controller.findById(articleId)

      expect(result).toEqual(expectedResult)
      expect(mockArticleService.findById).toHaveBeenCalledWith(articleId)
    })
  })

  describe('getPaginatedArticles', () => {
    it('should return paginated articles', async () => {
      const mockOptionsDto: ArticleOptionsDto = {
        page: 1,
        take: 10,
        skip: 0,
        orderBy: 'createdAt',
      }
      const expectedResult = {
        data: [{ id: '1', title: 'Test Article' }] as Article[],
        meta: {
          page: 1,
          take: 10,
          itemCount: 1,
          pageCount: 1,
          hasPreviousPage: false,
          hasNextPage: false,
        },
      }
      mockArticleService.getPaginatedArticles.mockResolvedValue(expectedResult)

      const result = await controller.getPaginatedArticles(mockOptionsDto)

      expect(result).toEqual(expectedResult)
      expect(mockArticleService.getPaginatedArticles).toHaveBeenCalledWith(
        mockOptionsDto,
      )
    })
  })

  describe('createParagraph', () => {
    const articleId = 'test-id'
    const createParagraphDto: CreateParagraphDto = {
      title: 'Test Paragraph',
      content: 'Test content',
      subtitle: 'Test subtitle',
    }

    const mockFile = {
      fieldname: 'image',
      originalname: 'test.jpg',
      encoding: '7bit',
      mimetype: 'image/jpeg',
      size: 12345,
      destination: '/tmp',
      filename: 'test.jpg',
      path: '/tmp/test.jpg',
      buffer: Buffer.from('test'),
      stream: null as any,
    } as Express.Multer.File

    it('should create a new paragraph', async () => {
      const mockParagraph = {
        id: 'paragraph-id',
        ...createParagraphDto,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockArticleService.createParagraph.mockResolvedValue(mockParagraph)

      const result = await controller.createParagraph(
        articleId,
        createParagraphDto,
        mockFile,
      )

      expect(result).toEqual(mockParagraph)
      expect(service.createParagraph).toHaveBeenCalledWith(
        articleId,
        createParagraphDto,
        mockFile,
      )
    })
  })

  describe('deleteParagraph', () => {
    const articleId = 'test-id'
    const paragraphId = 'paragraph-id'

    it('should delete a paragraph', async () => {
      mockArticleService.deleteParagraph.mockResolvedValue(true)

      const result = await controller.deleteParagraph(articleId, paragraphId)

      expect(result).toBe(true)
      expect(service.deleteParagraph).toHaveBeenCalledWith(
        articleId,
        paragraphId,
      )
    })
  })

  describe('deleteArticle', () => {
    const articleId = 'test-id'

    it('should delete an article', async () => {
      mockArticleService.deleteArticle.mockResolvedValue(undefined)

      const result = await controller.deleteArticle(articleId)

      expect(result).toEqual({ message: 'Article deleted successfully' })
      expect(service.deleteArticle).toHaveBeenCalledWith(articleId)
    })
  })
})
