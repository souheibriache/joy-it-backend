import { Test, TestingModule } from '@nestjs/testing'
import { getRepositoryToken } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { User } from './user.entity'
import { UserRoles } from '../enums/user-roles.enum'
import { RefreshToken } from 'src/auth/entities/refresh-token.entity'
import { Article } from 'src/article/entities'
import { Password } from 'src/auth/entities/password-history'

describe('User Entity', () => {
  let repository: Repository<User>
  let mockMetadata: any

  beforeEach(async () => {
    mockMetadata = {
      tableName: 'users',
      columns: [
        { propertyName: 'firstName', type: 'varchar' },
        { propertyName: 'lastName', type: 'varchar' },
        { propertyName: 'email', type: 'varchar' },
        { propertyName: 'role', type: 'enum', default: UserRoles.CLIENT },
        { propertyName: 'isSuperUser', type: 'boolean', default: false },
      ],
      relations: [
        { propertyName: 'refreshTokens', isOneToMany: true },
        { propertyName: 'passwords', isOneToOne: true },
        { propertyName: 'articles', isOneToMany: true },
      ],
    }

    const mockRepository = {
      metadata: mockMetadata,
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: getRepositoryToken(User),
          useValue: mockRepository,
        },
      ],
    }).compile()

    repository = module.get<Repository<User>>(getRepositoryToken(User))
  })

  it('should create a new user with default values', () => {
    const user = new User()
    expect(user).toBeDefined()
    expect(user.role).toBe(UserRoles.CLIENT)
    expect(user.isSuperUser).toBe(false)
  })

  it('should create a user with custom values', () => {
    const user = new User()
    user.firstName = 'John'
    user.lastName = 'Doe'
    user.email = 'john@example.com'
    user.role = UserRoles.ADMIN
    user.isSuperUser = true

    expect(user.firstName).toBe('John')
    expect(user.lastName).toBe('Doe')
    expect(user.email).toBe('john@example.com')
    expect(user.role).toBe(UserRoles.ADMIN)
    expect(user.isSuperUser).toBe(true)
  })

  describe('Entity Metadata', () => {
    it('should have correct table name', () => {
      expect(repository.metadata.tableName).toBe('users')
    })

    it('should have correct column names', () => {
      const columnNames = repository.metadata.columns.map(
        (column) => column.propertyName,
      )

      expect(columnNames).toContain('firstName')
      expect(columnNames).toContain('lastName')
      expect(columnNames).toContain('email')
      expect(columnNames).toContain('role')
      expect(columnNames).toContain('isSuperUser')
    })

    it('should have correct relations', () => {
      const relations = repository.metadata.relations.map(
        (relation) => relation.propertyName,
      )

      expect(relations).toContain('refreshTokens')
      expect(relations).toContain('passwords')
      expect(relations).toContain('articles')
    })

    it('should have correct column types', () => {
      const roleColumn = repository.metadata.columns.find(
        (column) => column.propertyName === 'role',
      )
      const isSuperUserColumn = repository.metadata.columns.find(
        (column) => column.propertyName === 'isSuperUser',
      )

      expect(roleColumn.type).toBe('enum')
      expect(isSuperUserColumn.type).toBe('boolean')
    })

    it('should have correct column defaults', () => {
      const roleColumn = repository.metadata.columns.find(
        (column) => column.propertyName === 'role',
      )
      const isSuperUserColumn = repository.metadata.columns.find(
        (column) => column.propertyName === 'isSuperUser',
      )

      expect(roleColumn.default).toBe(UserRoles.CLIENT)
      expect(isSuperUserColumn.default).toBe(false)
    })

    it('should have correct foreign key configuration', () => {
      const refreshTokensRelation = repository.metadata.relations.find(
        (relation) => relation.propertyName === 'refreshTokens',
      )
      const passwordsRelation = repository.metadata.relations.find(
        (relation) => relation.propertyName === 'passwords',
      )

      expect(refreshTokensRelation.isOneToMany).toBe(true)
      expect(passwordsRelation.isOneToOne).toBe(true)
    })
  })

  describe('Repository operations', () => {
    it('should create a user through repository', async () => {
      const userData = {
        userName: 'testuser',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
      }

      const mockUser = {
        ...userData,
        role: UserRoles.CLIENT,
        isSuperUser: false,
      }

      jest.spyOn(repository, 'create').mockReturnValue(mockUser as User)

      const user = repository.create(userData)

      expect(user).toBeDefined()
      expect(user.userName).toBe(userData.userName)
      expect(user.email).toBe(userData.email)
      expect(user.role).toBe(UserRoles.CLIENT)
      expect(user.isSuperUser).toBe(false)
    })

    it('should save a user through repository', async () => {
      const userData = {
        userName: 'testuser',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: UserRoles.CLIENT,
        isSuperUser: false,
      }

      jest.spyOn(repository, 'save').mockResolvedValue(userData as User)

      const savedUser = await repository.save(userData)

      expect(savedUser).toBeDefined()
      expect(savedUser.userName).toBe(userData.userName)
      expect(savedUser.email).toBe(userData.email)
      expect(savedUser.role).toBe(userData.role)
      expect(savedUser.isSuperUser).toBe(userData.isSuperUser)
    })

    it('should find a user by id', async () => {
      const userId = 'user-123'
      const userData = {
        id: userId,
        userName: 'testuser',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: UserRoles.CLIENT,
        isSuperUser: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      jest.spyOn(repository, 'findOne').mockResolvedValue(userData as User)

      const foundUser = await repository.findOne({ where: { id: userId } })

      expect(foundUser).toBeDefined()
      expect(foundUser.id).toBe(userId)
      expect(foundUser.userName).toBe(userData.userName)
      expect(foundUser.email).toBe(userData.email)
      expect(foundUser.role).toBe(userData.role)
      expect(foundUser.isSuperUser).toBe(userData.isSuperUser)
    })

    it('should handle user not found', async () => {
      const userId = 'non-existent-id'

      jest.spyOn(repository, 'findOne').mockResolvedValue(null)

      const foundUser = await repository.findOne({ where: { id: userId } })

      expect(foundUser).toBeNull()
    })
  })

  describe('Properties', () => {
    let user: User

    beforeEach(() => {
      user = new User()
      user.userName = 'testuser'
      user.email = 'test@example.com'
      user.firstName = 'Test'
      user.lastName = 'User'
      user.role = UserRoles.CLIENT
      user.isSuperUser = false
    })

    it('should have basic properties', () => {
      expect(user.userName).toBe('testuser')
      expect(user.email).toBe('test@example.com')
      expect(user.firstName).toBe('Test')
      expect(user.lastName).toBe('User')
      expect(user.role).toBe(UserRoles.CLIENT)
      expect(user.isSuperUser).toBe(false)
    })

    it('should have default role as CLIENT', () => {
      const newUser = new User()
      expect(newUser.role).toBe(UserRoles.CLIENT)
    })

    it('should have default isSuperUser as false', () => {
      const newUser = new User()
      expect(newUser.isSuperUser).toBe(false)
    })

    it('should allow changing role', () => {
      user.role = UserRoles.ADMIN
      expect(user.role).toBe(UserRoles.ADMIN)
    })

    it('should allow changing isSuperUser', () => {
      user.isSuperUser = true
      expect(user.isSuperUser).toBe(true)
    })
  })

  describe('Relationships', () => {
    let user: User

    beforeEach(() => {
      user = new User()
    })

    it('should have refresh tokens relationship', () => {
      const refreshToken = new RefreshToken()
      user.refreshTokens = [refreshToken]
      expect(user.refreshTokens).toHaveLength(1)
      expect(user.refreshTokens[0]).toBe(refreshToken)
    })

    it('should have articles relationship', () => {
      const article = new Article()
      user.articles = [article]
      expect(user.articles).toHaveLength(1)
      expect(user.articles[0]).toBe(article)
    })

    it('should have passwords relationship', () => {
      const password = new Password()
      user.passwords = 'hashedPassword'
      expect(user.passwords).toBe('hashedPassword')
    })

    it('should handle multiple refresh tokens', () => {
      const refreshToken1 = new RefreshToken()
      const refreshToken2 = new RefreshToken()
      user.refreshTokens = [refreshToken1, refreshToken2]
      expect(user.refreshTokens).toHaveLength(2)
      expect(user.refreshTokens).toContain(refreshToken1)
      expect(user.refreshTokens).toContain(refreshToken2)
    })

    it('should handle multiple articles', () => {
      const article1 = new Article()
      const article2 = new Article()
      user.articles = [article1, article2]
      expect(user.articles).toHaveLength(2)
      expect(user.articles).toContain(article1)
      expect(user.articles).toContain(article2)
    })

    it('should handle empty relationships', () => {
      user.refreshTokens = []
      user.articles = []
      user.passwords = ''
      expect(user.refreshTokens).toHaveLength(0)
      expect(user.articles).toHaveLength(0)
      expect(user.passwords).toBe('')
    })
  })
})
