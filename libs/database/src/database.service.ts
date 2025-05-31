import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { TypeOrmModuleOptions } from '@nestjs/typeorm'
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions'

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

@Injectable()
export class DatabaseService {
  constructor(private readonly configService: ConfigService) {}

  async createTypeOrmOptions(): Promise<PostgresModuleOptions> {
    return this.getConnectionOptions()
  }

  getConnectionOptions(): PostgresModuleOptions {
    const baseOptions: PostgresModuleOptions = {
      type: 'postgres',
      host: this.configService.get<string>('DB_HOST') || 'localhost',
      port: this.configService.get<number>('DB_PORT') || 5432,
      username: this.configService.get<string>('DB_USER'),
      password: this.configService.get<string>('DB_PASSWORD'),
      database: this.configService.get<string>('DB_NAME_DEV'),
      autoLoadEntities: true,
      synchronize: process.env.NODE_ENV !== 'production',
      logging: process.env.NODE_ENV === 'development',
      migrationsTableName: 'migrations_typeorm',
      migrationsRun: true,
    }

    if (process.env.NODE_ENV === 'production') {
      return {
        ...baseOptions,
        ssl: {
          rejectUnauthorized: false,
        },
      }
    }

    return baseOptions
  }
}
