import { INestApplication } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger'
import * as basicAuth from 'express-basic-auth'

export const setupSwagger = (app: INestApplication): void => {
  const configService = app.get(ConfigService)
  const NODE_ENV = configService.get('NODE_ENV')

  const isDevelopment = NODE_ENV === 'development'
  if (!isDevelopment) return

  const config = new DocumentBuilder()
    .setTitle('Joy-it API')
    .setDescription('Joy-it API documentation')
    .setVersion('1.0')
    .addBearerAuth()
    .build()
  const document = SwaggerModule.createDocument(app, config)
  const SWAGGER_ENDPOINT = configService.get('SWAGGER_ENDPOINT')
  const SWAGGER_USERNAME = configService.get('SWAGGER_USERNAME')
  const SWAGGER_PASSWORD = configService.get('SWAGGER_PASSWORD')

  //? secure access to swagger using basic auth
  if (SWAGGER_USERNAME && SWAGGER_PASSWORD) {
    app.use(
      `/${SWAGGER_ENDPOINT}`,
      basicAuth({
        challenge: true,
        users: { [SWAGGER_USERNAME]: SWAGGER_PASSWORD },
      }),
    )
  }

  SwaggerModule.setup(SWAGGER_ENDPOINT, app, document, {
    customCssUrl:
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui.min.css',
    customJs: [
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-bundle.js',
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-standalone-preset.js',
    ],
  })
}
