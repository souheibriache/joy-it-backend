import { Module } from '@nestjs/common'
import { ConfigService } from './config.service'
import { ConfigModule as NestConfigModule } from '@nestjs/config'
import { validationSchema } from './validation/validation-schema'

@Module({
  imports: [
    NestConfigModule.forRoot({
      validationSchema: validationSchema,
      envFilePath: ['.env'],
      isGlobal: true,
      cache: true,
    }),
  ],
  providers: [ConfigService],
  exports: [ConfigService],
})
export class ConfigModule {}
