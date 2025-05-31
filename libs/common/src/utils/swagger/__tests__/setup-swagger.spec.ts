import { INestApplication } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger'
import { setupSwagger } from '../setup-swagger'
import * as basicAuth from 'express-basic-auth'

jest.mock('@nestjs/swagger', () => ({
  DocumentBuilder: jest.fn().mockReturnValue({
    setTitle: jest.fn().mockReturnThis(),
    setDescription: jest.fn().mockReturnThis(),
    setVersion: jest.fn().mockReturnThis(),
    addBearerAuth: jest.fn().mockReturnThis(),
    build: jest.fn().mockReturnValue({}),
  }),
  SwaggerModule: {
    createDocument: jest.fn().mockReturnValue({}),
    setup: jest.fn(),
  },
}))

describe('setupSwagger', () => {
  let mockApp: Partial<INestApplication>
  let mockConfigService: Partial<ConfigService>

  beforeEach(() => {
    mockConfigService = {
      get: jest.fn(),
    }

    mockApp = {
      get: jest.fn().mockReturnValue(mockConfigService),
      use: jest.fn(),
    }

    jest.clearAllMocks()
  })

  it('should not setup swagger in production environment', () => {
    mockConfigService.get = jest.fn().mockImplementation((key: string) => {
      if (key === 'NODE_ENV') return 'production'
      return 'some-value'
    })

    setupSwagger(mockApp as INestApplication)

    expect(SwaggerModule.createDocument).not.toHaveBeenCalled()
    expect(SwaggerModule.setup).not.toHaveBeenCalled()
  })

  it('should setup swagger in development environment', () => {
    mockConfigService.get = jest.fn().mockImplementation((key: string) => {
      switch (key) {
        case 'NODE_ENV':
          return 'development'
        case 'SWAGGER_ENDPOINT':
          return 'api-docs'
        default:
          return undefined
      }
    })

    setupSwagger(mockApp as INestApplication)

    expect(SwaggerModule.createDocument).toHaveBeenCalledWith(
      mockApp,
      expect.any(Object),
    )
    expect(SwaggerModule.setup).toHaveBeenCalledWith(
      'api-docs',
      mockApp,
      {},
      expect.objectContaining({
        customCssUrl: expect.any(String),
        customJs: expect.arrayContaining([expect.any(String)]),
      }),
    )
  })

  it('should setup basic auth when credentials are provided', () => {
    mockConfigService.get = jest.fn().mockImplementation((key: string) => {
      switch (key) {
        case 'NODE_ENV':
          return 'development'
        case 'SWAGGER_ENDPOINT':
          return 'api-docs'
        case 'SWAGGER_USERNAME':
          return 'admin'
        case 'SWAGGER_PASSWORD':
          return 'password'
        default:
          return undefined
      }
    })

    setupSwagger(mockApp as INestApplication)

    expect(mockApp.use).toHaveBeenCalledWith('/api-docs', expect.any(Function))
  })

  it('should not setup basic auth when credentials are missing', () => {
    mockConfigService.get = jest.fn().mockImplementation((key: string) => {
      switch (key) {
        case 'NODE_ENV':
          return 'development'
        case 'SWAGGER_ENDPOINT':
          return 'api-docs'
        default:
          return undefined
      }
    })

    setupSwagger(mockApp as INestApplication)

    expect(mockApp.use).not.toHaveBeenCalled()
  })
})
