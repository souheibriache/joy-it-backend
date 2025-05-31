import { Test, TestingModule } from '@nestjs/testing'
import { DatabaseService } from './database.service'
import { ConfigService } from '@nestjs/config'
import { TypeOrmModuleOptions } from '@nestjs/typeorm'

type PostgresModuleOptions = TypeOrmModuleOptions & {
  type: 'postgres'
  host: string
  port: number
  username: string
  password: string
  database: string
  ssl?: {
    rejectUnauthorized: boolean
  }
}

describe('DatabaseService', () => {
  let service: DatabaseService
  let configService: ConfigService

  const mockConfigService = {
    get: jest.fn(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DatabaseService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile()

    service = module.get<DatabaseService>(DatabaseService)
    configService = module.get<ConfigService>(ConfigService)
  })

  afterEach(() => {
    jest.clearAllMocks()
    process.env.NODE_ENV = 'test'
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('createTypeOrmOptions', () => {
    it('should return connection options', async () => {
      const mockOptions = {
        type: 'postgres',
        host: 'test-host',
        port: 5432,
        username: 'test-user',
        password: 'test-pass',
        database: 'test-db',
      }

      mockConfigService.get.mockImplementation((key: string) => {
        switch (key) {
          case 'DB_HOST':
            return mockOptions.host
          case 'DB_PORT':
            return mockOptions.port
          case 'DB_USER':
            return mockOptions.username
          case 'DB_PASSWORD':
            return mockOptions.password
          case 'DB_NAME_DEV':
            return mockOptions.database
          default:
            return null
        }
      })

      const result = await service.createTypeOrmOptions()

      expect(result).toEqual({
        ...mockOptions,
        autoLoadEntities: true,
        synchronize: true,
        logging: false,
        migrationsTableName: 'migrations_typeorm',
        migrationsRun: true,
      })
    })
  })

  describe('getConnectionOptions', () => {
    it('should return default options in development environment', () => {
      process.env.NODE_ENV = 'development'

      const mockOptions = {
        type: 'postgres',
        host: 'dev-host',
        port: 5432,
        username: 'dev-user',
        password: 'dev-pass',
        database: 'dev-db',
      }

      mockConfigService.get.mockImplementation((key: string) => {
        switch (key) {
          case 'DB_HOST':
            return mockOptions.host
          case 'DB_PORT':
            return mockOptions.port
          case 'DB_USER':
            return mockOptions.username
          case 'DB_PASSWORD':
            return mockOptions.password
          case 'DB_NAME_DEV':
            return mockOptions.database
          default:
            return null
        }
      })

      const result = service.getConnectionOptions()

      expect(result).toEqual({
        ...mockOptions,
        autoLoadEntities: true,
        synchronize: true,
        logging: true,
        migrationsTableName: 'migrations_typeorm',
        migrationsRun: true,
      })
    })

    it('should return production options with SSL in production environment', () => {
      process.env.NODE_ENV = 'production'

      const mockOptions = {
        type: 'postgres',
        host: 'prod-host',
        port: 5432,
        username: 'prod-user',
        password: 'prod-pass',
        database: 'prod-db',
      }

      mockConfigService.get.mockImplementation((key: string) => {
        switch (key) {
          case 'DB_HOST':
            return mockOptions.host
          case 'DB_PORT':
            return mockOptions.port
          case 'DB_USER':
            return mockOptions.username
          case 'DB_PASSWORD':
            return mockOptions.password
          case 'DB_NAME_DEV':
            return mockOptions.database
          default:
            return null
        }
      })

      const result = service.getConnectionOptions()

      expect(result).toEqual({
        ...mockOptions,
        autoLoadEntities: true,
        synchronize: false,
        logging: false,
        migrationsTableName: 'migrations_typeorm',
        migrationsRun: true,
        ssl: {
          rejectUnauthorized: false,
        },
      })
    })

    it('should use default values when environment variables are not set', () => {
      mockConfigService.get.mockReturnValue(null)

      const result = service.getConnectionOptions()

      expect(result).toEqual({
        type: 'postgres',
        host: 'localhost',
        port: 5432,
        username: null,
        password: null,
        database: null,
        autoLoadEntities: true,
        synchronize: true,
        logging: false,
        migrationsTableName: 'migrations_typeorm',
        migrationsRun: true,
      })
    })

    it('should handle custom port number', () => {
      const customPort = 5433
      mockConfigService.get.mockImplementation((key: string) =>
        key === 'DB_PORT' ? customPort : null,
      )

      const result = service.getConnectionOptions()

      expect(result.port).toBe(customPort)
    })
  })
})
