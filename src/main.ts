import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import * as compression from 'compression'
import { ValidationPipe } from '@nestjs/common'
import { ValidationError } from 'class-validator'
import { ValidationErrorException } from '@app/common/utils/error-handler'
import { setupSwagger } from '@app/common/utils/swagger'
import * as morgan from 'morgan'
import * as bodyParser from 'body-parser'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  app.use('/webhook', bodyParser.raw({ type: 'application/json' }))

  app.use(compression())
  app.enableCors()

  app.use(morgan('dev'))

  const prefixBaseApi = 'api/v1'
  app.setGlobalPrefix(prefixBaseApi)

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      stopAtFirstError: true,
      exceptionFactory: (errors: ValidationError[]) => {
        return new ValidationErrorException(errors)
      },
    }),
  )

  setupSwagger(app)

  await app.listen(process.env.PORT ?? 3000)
}
bootstrap()
