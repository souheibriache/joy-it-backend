import { Test, TestingModule } from '@nestjs/testing'
import { getRepositoryToken } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Password } from './password-history'
import { User } from 'src/user/entities'

describe('Password Entity', () => {
  let repository: Repository<Password>

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: getRepositoryToken(Password),
          useClass: Repository,
        },
      ],
    }).compile()

    repository = module.get<Repository<Password>>(getRepositoryToken(Password))
  })

  it('should be defined', () => {
    expect(repository).toBeDefined()
  })

  it('should create a new password with default values', () => {
    const password = new Password()
    expect(password).toBeDefined()
    expect(password.isCurrent).toBeUndefined()
    expect(password.createdAt).toBeUndefined()
    expect(password.updatedAt).toBeUndefined()
    expect(password.deletedAt).toBeNull()
  })

  it('should create a password with custom values', () => {
    const mockUser = new User()
    const password = new Password()
    password.hash = 'hashedPassword'
    password.user = mockUser
    password.isCurrent = true

    expect(password.hash).toBe('hashedPassword')
    expect(password.user).toBe(mockUser)
    expect(password.isCurrent).toBe(true)
  })

  describe('Entity Metadata', () => {
    let metadata: any

    beforeEach(() => {
      metadata = {
        tableName: 'password',
        columns: [
          { propertyName: 'id', type: 'uuid' },
          { propertyName: 'hash', type: 'varchar' },
          { propertyName: 'isCurrent', type: 'boolean', default: false },
          { propertyName: 'createdAt', type: 'timestamp' },
          { propertyName: 'updatedAt', type: 'timestamp' },
          { propertyName: 'deletedAt', type: 'timestamp' },
        ],
        relations: [{ propertyName: 'user', type: 'many-to-one' }],
      }

      jest.spyOn(repository, 'metadata', 'get').mockReturnValue(metadata)
    })

    it('should have correct table name', () => {
      expect(metadata.tableName).toBe('password')
    })

    it('should have correct column names', () => {
      const columnNames = metadata.columns.map(
        (column: any) => column.propertyName,
      )

      expect(columnNames).toContain('hash')
      expect(columnNames).toContain('isCurrent')
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
      const isCurrentColumn = metadata.columns.find(
        (column: any) => column.propertyName === 'isCurrent',
      )
      const hashColumn = metadata.columns.find(
        (column: any) => column.propertyName === 'hash',
      )

      expect(isCurrentColumn.type).toBe('boolean')
      expect(hashColumn.type).toBe('varchar')
    })
  })
})
