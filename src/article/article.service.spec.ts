import { Test, TestingModule } from '@nestjs/testing'
import { ArticleService } from './article.service'
import { getRepositoryToken } from '@nestjs/typeorm'
import { Article, Paragraph } from './entities'
import { Repository, EntityManager } from 'typeorm'
import { UploadService } from '@app/upload'
import { MediaService } from '@app/media'
import { CreateArticleDto, UpdateArticleDto } from './dto'
import { CreateParagraphDto } from './dto/create-paragraph.dto'
import { NotFoundException } from '@nestjs/common'
import { ArticleOptionsDto } from './dto/article-options.dto'
import { PageDto, PageMetaDto } from '@app/pagination/dto'
import { User } from 'src/user/entities'
import { Media } from '@app/media/entities'
import { ResourceTypeEnum } from '@app/media/enums/resource-type.enum'

describe('ArticleService', () => {
  let service: ArticleService
  let articleRepository: jest.Mocked<Repository<Article>>
  let paragraphRepository: jest.Mocked<Repository<Paragraph>>
  let uploadService: jest.Mocked<UploadService>
  let mediaService: jest.Mocked<MediaService>

  const createMockArticle = (data: Partial<Article> = {}): Article => ({
    id: 'article-id',
    title: 'Test Article',
    subtitle: 'Test Subtitle',
    introduction: 'Test Introduction',
    conclusion: 'Test Conclusion',
    tags: ['test'],
    thumbnail: null,
    paragraphs: [],
    author: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    hasId: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
    softRemove: jest.fn(),
    recover: jest.fn(),
    reload: jest.fn(),
    ...data,
  })

  const createMockMedia = (data: Partial<Media> = {}): Media => ({
    id: 'media-id',
    fullUrl: 'https://example.com/test.jpg',
    name: 'test.jpg',
    originalName: 'test.jpg',
    placeHolder: 'Test Media',
    resourceType: ResourceTypeEnum.IMAGE,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    hasId: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
    softRemove: jest.fn(),
    recover: jest.fn(),
    reload: jest.fn(),
    ...data,
  })

  const mockMediaResult = createMockMedia()

  const mockArticleRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    findAndCount: jest.fn(),
    remove: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn(),
    })),
    manager: {
      transaction: jest.fn((cb) =>
        cb({
          create: jest.fn(),
          save: jest.fn(),
          findOne: jest.fn(),
        } as unknown as EntityManager),
      ),
    },
  }

  const mockParagraphRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    remove: jest.fn(),
  }

  const mockUploadService = {
    upload: jest.fn(),
  }

  const mockMediaService = {
    create: jest.fn(),
    delete: jest.fn(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ArticleService,
        {
          provide: getRepositoryToken(Article),
          useValue: mockArticleRepository,
        },
        {
          provide: getRepositoryToken(Paragraph),
          useValue: mockParagraphRepository,
        },
        {
          provide: UploadService,
          useValue: mockUploadService,
        },
        {
          provide: MediaService,
          useValue: mockMediaService,
        },
      ],
    }).compile()

    service = module.get<ArticleService>(ArticleService)
    articleRepository = module.get(getRepositoryToken(Article))
    paragraphRepository = module.get(getRepositoryToken(Paragraph))
    uploadService = module.get(UploadService)
    mediaService = module.get(MediaService)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('create', () => {
    it('should create a new article', async () => {
      const createArticleDto: CreateArticleDto = {
        title: 'Test Article',
        subtitle: 'Test Subtitle',
        description: 'Test Description',
        introduction: 'Test Introduction',
        conclusion: 'Test Conclusion',
        tags: ['test'],
        paragraphs: [],
      }

      const mockArticle = createMockArticle()

      articleRepository.create.mockReturnValue(mockArticle)
      articleRepository.save.mockResolvedValue(mockArticle)

      const result = await service.create(createArticleDto)

      expect(result).toEqual(mockArticle)
      expect(articleRepository.create).toHaveBeenCalledWith(createArticleDto)
      expect(articleRepository.save).toHaveBeenCalledWith(mockArticle)
    })
  })

  describe('findOne', () => {
    it('should find an article by id', async () => {
      const mockArticle = createMockArticle()

      articleRepository.findOne.mockResolvedValue(mockArticle)

      const result = await service.findOne({ id: 'article-id' })

      expect(result).toEqual(mockArticle)
      expect(articleRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'article-id' },
      })
    })
  })

  describe('createArticle', () => {
    const mockFile = {
      fieldname: 'thumbnail',
      originalname: 'test.jpg',
      encoding: '7bit',
      mimetype: 'image/jpeg',
      size: 12345,
      destination: '/tmp',
      filename: 'test.jpg',
      path: '/tmp/test.jpg',
      buffer: Buffer.from('test'),
    } as Express.Multer.File

    const mockUploadResult = {
      url: 'https://example.com/test.jpg',
      display_name: 'test.jpg',
      original_filename: 'test.jpg',
      resource_type: ResourceTypeEnum.IMAGE,
      message: 'Upload successful',
      name: 'Success',
      http_code: 200,
    }

    it('should create an article with thumbnail and paragraphs', async () => {
      const createArticleDto: CreateArticleDto = {
        title: 'Test Article',
        subtitle: 'Test Subtitle',
        description: 'Test Description',
        introduction: 'Test Introduction',
        conclusion: 'Test Conclusion',
        tags: ['test'],
        paragraphs: [
          {
            title: 'Test Paragraph',
            content: 'Test Content',
            imageIndex: 0,
          },
        ],
      }

      const mockAuthor = { id: 'user-id' } as User

      const mockParagraph: Paragraph = {
        id: 'paragraph-id',
        title: 'Test Paragraph',
        content: 'Test Content',
        image: mockMediaResult,
        article: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        hasId: jest.fn(),
        save: jest.fn(),
        remove: jest.fn(),
        softRemove: jest.fn(),
        recover: jest.fn(),
        reload: jest.fn(),
      }

      const mockArticle = createMockArticle({
        ...createArticleDto,
        author: mockAuthor,
        thumbnail: mockMediaResult,
        paragraphs: [mockParagraph],
      })

      uploadService.upload.mockResolvedValue(mockUploadResult)
      mediaService.create.mockResolvedValue(mockMediaResult)

      const transactionManager = {
        create: jest.fn().mockReturnValue(mockArticle),
        save: jest.fn().mockResolvedValue(mockArticle),
        findOne: jest.fn().mockResolvedValue(mockArticle),
      } as unknown as EntityManager

      ;(articleRepository.manager.transaction as jest.Mock).mockImplementation(
        (cb) => cb(transactionManager),
      )

      const result = await service.createArticle(
        createArticleDto,
        mockFile,
        [mockFile],
        mockAuthor,
      )

      expect(result).toEqual(mockArticle)
      expect(uploadService.upload).toHaveBeenCalledTimes(2)
      expect(mediaService.create).toHaveBeenCalledTimes(2)
      expect(transactionManager.create).toHaveBeenCalledTimes(2)
      expect(transactionManager.save).toHaveBeenCalledTimes(2)
    })

    it('should throw NotFoundException when article creation fails', async () => {
      const createArticleDto: CreateArticleDto = {
        title: 'Test Article',
        subtitle: 'Test Subtitle',
        description: 'Test Description',
        introduction: 'Test Introduction',
        conclusion: 'Test Conclusion',
        tags: ['test'],
        paragraphs: [],
      }

      const mockAuthor = { id: 'user-id' } as User

      const transactionManager = {
        create: jest.fn().mockReturnValue({}),
        save: jest.fn().mockResolvedValue({}),
        findOne: jest.fn().mockResolvedValue(null),
      } as unknown as EntityManager

      ;(articleRepository.manager.transaction as jest.Mock).mockImplementation(
        (cb) => cb(transactionManager),
      )

      await expect(
        service.createArticle(createArticleDto, null, [], mockAuthor),
      ).rejects.toThrow(NotFoundException)
    })
  })

  describe('updateArticle', () => {
    const mockFile = {
      fieldname: 'thumbnail',
      originalname: 'test.jpg',
      encoding: '7bit',
      mimetype: 'image/jpeg',
      size: 12345,
      destination: '/tmp',
      filename: 'test.jpg',
      path: '/tmp/test.jpg',
      buffer: Buffer.from('test'),
    } as Express.Multer.File

    it('should update an article', async () => {
      const updateArticleDto: UpdateArticleDto = {
        title: 'Updated Article',
      }

      const mockArticle = createMockArticle()
      const updatedArticle = createMockArticle({
        ...mockArticle,
        ...updateArticleDto,
      })

      const transactionManager = {
        findOne: jest
          .fn()
          .mockResolvedValueOnce(mockArticle)
          .mockResolvedValueOnce(updatedArticle),
        save: jest.fn().mockResolvedValue(updatedArticle),
      } as unknown as EntityManager

      ;(articleRepository.manager.transaction as jest.Mock).mockImplementation(
        (cb) => cb(transactionManager),
      )

      const result = await service.updateArticle('article-id', updateArticleDto)

      expect(result).toEqual(updatedArticle)
      expect(transactionManager.findOne).toHaveBeenCalledTimes(2)
      expect(transactionManager.save).toHaveBeenCalledWith(
        expect.objectContaining(updateArticleDto),
      )
    })

    it('should throw NotFoundException when article not found', async () => {
      const updateArticleDto: UpdateArticleDto = {
        title: 'Updated Article',
      }

      const transactionManager = {
        findOne: jest.fn().mockResolvedValue(null),
      } as unknown as EntityManager

      ;(articleRepository.manager.transaction as jest.Mock).mockImplementation(
        (cb) => cb(transactionManager),
      )

      await expect(
        service.updateArticle('non-existent-id', updateArticleDto),
      ).rejects.toThrow(NotFoundException)
    })
  })

  describe('createParagraph', () => {
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
    } as Express.Multer.File

    it('should create a paragraph with image', async () => {
      const createParagraphDto: CreateParagraphDto = {
        title: 'Test Paragraph',
        content: 'Test Content',
      }

      const mockArticle = createMockArticle()

      const mockUploadResult = {
        url: 'https://example.com/test.jpg',
        display_name: 'test.jpg',
        original_filename: 'test.jpg',
        resource_type: ResourceTypeEnum.IMAGE,
        message: 'Upload successful',
        name: 'Success',
        http_code: 200,
      }

      const mockParagraph: Paragraph = {
        id: 'paragraph-id',
        ...createParagraphDto,
        image: mockMediaResult,
        article: mockArticle,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        hasId: jest.fn(),
        save: jest.fn(),
        remove: jest.fn(),
        softRemove: jest.fn(),
        recover: jest.fn(),
        reload: jest.fn(),
      }

      articleRepository.findOne.mockResolvedValue(mockArticle)
      uploadService.upload.mockResolvedValue(mockUploadResult)
      mediaService.create.mockResolvedValue(mockMediaResult)
      paragraphRepository.create.mockReturnValue(mockParagraph)
      paragraphRepository.save.mockResolvedValue(mockParagraph)

      const result = await service.createParagraph(
        'article-id',
        createParagraphDto,
        mockFile,
      )

      expect(result).toEqual(mockParagraph)
      expect(articleRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'article-id' },
      })
      expect(uploadService.upload).toHaveBeenCalledWith(mockFile, 'paragraphs')
      expect(mediaService.create).toHaveBeenCalled()
      expect(paragraphRepository.create).toHaveBeenCalledWith({
        ...createParagraphDto,
        image: mockMediaResult,
        article: mockArticle,
      })
      expect(paragraphRepository.save).toHaveBeenCalledWith(mockParagraph)
    })

    it('should throw NotFoundException when article not found', async () => {
      const createParagraphDto: CreateParagraphDto = {
        title: 'Test Paragraph',
        content: 'Test Content',
      }

      articleRepository.findOne.mockResolvedValue(null)

      await expect(
        service.createParagraph('non-existent-id', createParagraphDto),
      ).rejects.toThrow(NotFoundException)
    })
  })

  describe('findById', () => {
    it('should find an article by id with relations', async () => {
      const mockParagraph: Paragraph = {
        id: 'paragraph-id',
        title: 'Test Paragraph',
        content: 'Test Content',
        image: mockMediaResult,
        article: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        hasId: jest.fn(),
        save: jest.fn(),
        remove: jest.fn(),
        softRemove: jest.fn(),
        recover: jest.fn(),
        reload: jest.fn(),
      }

      const mockArticle = createMockArticle({
        author: { id: 'user-id' } as User,
        paragraphs: [mockParagraph],
        thumbnail: mockMediaResult,
      })

      articleRepository.findOne.mockResolvedValue(mockArticle)

      const result = await service.findById('article-id')

      expect(result).toEqual(mockArticle)
      expect(articleRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'article-id' },
        relations: {
          author: true,
          paragraphs: { image: true },
          thumbnail: true,
        },
      })
    })

    it('should throw NotFoundException when article not found', async () => {
      articleRepository.findOne.mockResolvedValue(null)

      await expect(service.findById('non-existent-id')).rejects.toThrow(
        NotFoundException,
      )
    })
  })

  describe('getPaginatedArticles', () => {
    it('should return paginated articles with search and tags', async () => {
      const articleOptionsDto: ArticleOptionsDto = {
        skip: 0,
        take: 10,
        query: {
          search: 'test',
          tags: ['tag1', 'tag2'],
        },
      }

      const mockArticles = [createMockArticle(), createMockArticle()]

      articleRepository.findAndCount.mockResolvedValue([mockArticles, 2])

      const result = await service.getPaginatedArticles(articleOptionsDto)

      expect(result).toBeInstanceOf(PageDto)
      expect(result.data).toEqual(mockArticles)
      expect(result.meta).toBeInstanceOf(PageMetaDto)
      expect(articleRepository.findAndCount).toHaveBeenCalled()
    })
  })

  describe('deleteArticle', () => {
    it('should delete an article and its thumbnail', async () => {
      const mockArticle = createMockArticle({
        thumbnail: mockMediaResult,
      })

      articleRepository.findOne.mockResolvedValue(mockArticle)
      articleRepository.remove.mockResolvedValue(mockArticle)
      mediaService.delete.mockResolvedValue(undefined)

      await service.deleteArticle('article-id')

      expect(articleRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'article-id' },
        relations: { thumbnail: true },
      })
      expect(mediaService.delete).toHaveBeenCalledWith('media-id')
      expect(articleRepository.remove).toHaveBeenCalledWith(mockArticle)
    })

    it('should throw NotFoundException when article not found', async () => {
      articleRepository.findOne.mockResolvedValue(null)

      await expect(service.deleteArticle('non-existent-id')).rejects.toThrow(
        NotFoundException,
      )
    })
  })
})
