import { Module } from '@nestjs/common';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@app/config';
import * as fs from 'fs';
import * as path from 'path';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService): Promise<TypeOrmModuleOptions> => {
        return {
          type: 'postgres',
          host: configService.get<string>('DB_HOST'),
          port: configService.get<number>('DB_PORT'),
          username: configService.get<string>('DB_USER'),
          password: configService.get<string>('DB_PASSWORD'),
          database: configService.get<string>('DB_NAME_DEV'),
          autoLoadEntities: true,
          // ssl: {
          //   rejectUnauthorized: true,
          //   ca: fs.readFileSync(path.resolve("ca.pem"), 'utf8'),
          // },
          synchronize: true,
          logging: false,
          migrationsTableName: 'migrations_typeorm',
          migrationsRun: true,
        };
      },
    }),
  ],
})
export class DatabaseModule {}
