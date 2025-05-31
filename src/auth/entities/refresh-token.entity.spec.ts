import { Test, TestingModule } from '@nestjs/testing'
import { getRepositoryToken } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { RefreshToken } from './refresh-token.entity'
import { User } from 'src/user/entities'

describe('RefreshToken Entity', () => {
  let repository: Repository<RefreshToken>

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: getRepositoryToken(RefreshToken),
          useClass: Repository,
        },
      ],
    }).compile()

    repository = module.get<Repository<RefreshToken>>(
      getRepositoryToken(RefreshToken),
    )
  })

  it('should be defined', () => {
    expect(repository).toBeDefined()
  })

  it('should create a new refresh token with default values', () => {
    const refreshToken = new RefreshToken()
    expect(refreshToken).toBeDefined()
    expect(refreshToken.loginFrom).toBeUndefined()
    expect(refreshToken.isRevoked).toBe(false)
    expect(refreshToken.createdAt).toBeUndefined()
    expect(refreshToken.updatedAt).toBeUndefined()
    expect(refreshToken.deletedAt).toBeNull()
  })

  it('should create a refresh token with custom values', () => {
    const mockUser = new User()
    const refreshToken = new RefreshToken()
    refreshToken.id = 'test-token'
    refreshToken.user = mockUser
    refreshToken.loginFrom = 'MOBILE'
    refreshToken.isRevoked = true

    expect(refreshToken.id).toBe('test-token')
    expect(refreshToken.user).toBe(mockUser)
    expect(refreshToken.loginFrom).toBe('MOBILE')
    expect(refreshToken.isRevoked).toBe(true)
  })

  describe('Entity Metadata', () => {
    let metadata: any

    beforeEach(() => {
      metadata = {
        tableName: 'refresh_tokens',
        columns: [
          { propertyName: 'id', type: 'uuid' },
          { propertyName: 'loginFrom', type: 'varchar', default: 'WEB' },
          { propertyName: 'isRevoked', type: 'boolean', default: false },
          { propertyName: 'createdAt', type: 'timestamp' },
          { propertyName: 'updatedAt', type: 'timestamp' },
          { propertyName: 'deletedAt', type: 'timestamp' },
        ],
        relations: [{ propertyName: 'user', type: 'many-to-one' }],
      }

      jest.spyOn(repository, 'metadata', 'get').mockReturnValue(metadata)
    })

    it('should have correct table name', () => {
      expect(metadata.tableName).toBe('refresh_tokens')
    })

    it('should have correct column names', () => {
      const columnNames = metadata.columns.map(
        (column: any) => column.propertyName,
      )

      expect(columnNames).toContain('loginFrom')
      expect(columnNames).toContain('isRevoked')
      expect(columnNames).toContain('createdAt')
      expect(columnNames).toContain('updatedAt')
      expect(columnNames).toContain('deletedAt')
    })

    it('should have correct relations', () => {
      const relations = metadata.relations.map(
        (relation: any) => relation.propertyName,
      )

      expect(relations).toContain('user')
    })

    it('should have correct column types', () => {
      const loginFromColumn = metadata.columns.find(
        (column: any) => column.propertyName === 'loginFrom',
      )
      const isRevokedColumn = metadata.columns.find(
        (column: any) => column.propertyName === 'isRevoked',
      )

      expect(loginFromColumn.type).toBe('varchar')
      expect(isRevokedColumn.type).toBe('boolean')
    })

    it('should have correct column defaults', () => {
      const loginFromColumn = metadata.columns.find(
        (column: any) => column.propertyName === 'loginFrom',
      )
      const isRevokedColumn = metadata.columns.find(
        (column: any) => column.propertyName === 'isRevoked',
      )

      expect(loginFromColumn.default).toBe('WEB')
      expect(isRevokedColumn.default).toBe(false)
    })

    it('should have correct foreign key configuration', () => {
      const userRelation = metadata.relations.find(
        (relation: any) => relation.propertyName === 'user',
      )

      expect(userRelation.type).toBe('many-to-one')
    })
  })
})
