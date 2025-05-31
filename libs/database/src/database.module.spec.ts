import { Test } from '@nestjs/testing'
import { DatabaseModule } from './database.module'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ConfigModule, ConfigService } from '@app/config'

describe('DatabaseModule', () => {
  it('should compile the module', async () => {
    const module = await Test.createTestingModule({
      imports: [DatabaseModule],
    }).compile()

    expect(module).toBeDefined()
  })

  it('should configure TypeOrmModule with async options', async () => {
    const imports = Reflect.getMetadata('imports', DatabaseModule)
    const typeOrmModule = imports.find(
      (imp) => imp.constructor.name === 'TypeOrmModule',
    )

    expect(typeOrmModule).toBeDefined()
    expect(typeOrmModule.imports).toContain(ConfigModule)
    expect(typeOrmModule.inject).toContain(ConfigService)
    expect(typeof typeOrmModule.useFactory).toBe('function')
  })

  it('should provide database configuration through factory', async () => {
    const imports = Reflect.getMetadata('imports', DatabaseModule)
    const typeOrmModule = imports.find(
      (imp) => imp.constructor.name === 'TypeOrmModule',
    )
    const configService = new ConfigService()

    const config = await typeOrmModule.useFactory(configService)

    expect(config).toEqual(
      expect.objectContaining({
        type: 'postgres',
        autoLoadEntities: true,
        synchronize: true,
        logging: false,
        migrationsTableName: 'migrations_typeorm',
        migrationsRun: true,
      }),
    )
  })
})
