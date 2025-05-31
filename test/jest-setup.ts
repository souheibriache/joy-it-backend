import { User } from '../src/user/entities'
import { RefreshToken } from '../src/auth/entities/refresh-token.entity'
import { Company } from '../src/company/entities'
import { Client } from '../src/client/entities'
import { Activity } from '../src/activity/entities'
import { ServiceOrder } from '../src/service-order/entities'
import { config } from 'dotenv'
import { join } from 'path'

// Load test environment variables
config({ path: join(__dirname, '../.env.test') })

// Set default environment variables for testing
process.env.JWT_AUTH_KEY = 'test-jwt-key'
process.env.RESET_PASSWORD_SECRET_KEY = 'test-reset-password-key'
process.env.DB_HOST = 'localhost'
process.env.DB_PORT = '5432'
process.env.DB_USER = 'test'
process.env.DB_NAME_DEV = 'test_db'
process.env.DB_PASSWORD = 'test'
process.env.REDIS_HOST = 'localhost'
process.env.REDIS_PORT = '6379'
process.env.SENDGRID_API_KEY = 'test-sendgrid-key'
process.env.STRIPE_SECRET_KEY = 'test-stripe-key'
process.env.STRIPE_WEBHOOK_SECRET = 'test-webhook-secret'
process.env.CLOUDINARY_CLOUD_NAME = 'test-cloud'
process.env.CLOUDINARY_API_KEY = 'test-api-key'
process.env.CLOUDINARY_API_SECRET = 'test-api-secret'
process.env.MAILER_FROM_EMAIL = 'test@example.com'
process.env.MAILER_FROM_NAME = 'Test Mailer'
process.env.MAILER_TEMPLATE_ID = 'test-template-id'
process.env.MAILER_API_KEY = 'test-mailer-key'

// Mock external services
jest.mock('@sendgrid/mail', () => ({
  setApiKey: jest.fn(),
  send: jest.fn(),
}))

jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => ({
    paymentIntents: {
      create: jest.fn(),
      update: jest.fn(),
      cancel: jest.fn(),
    },
    subscriptions: {
      create: jest.fn(),
      update: jest.fn(),
      cancel: jest.fn(),
    },
    customers: {
      create: jest.fn(),
      update: jest.fn(),
    },
    webhooks: {
      constructEvent: jest.fn(),
    },
  }))
})

jest.mock('cloudinary', () => ({
  v2: {
    config: jest.fn(),
    uploader: {
      upload: jest.fn(),
      destroy: jest.fn(),
    },
  },
}))

// Mock database connection
jest.mock('typeorm', () => ({
  ...jest.requireActual('typeorm'),
  getRepository: jest.fn(),
  createConnection: jest.fn(),
  getConnection: jest.fn(),
}))

// Mock implementations for common entities
jest.mock('../src/user/entities', () => ({
  User: jest.fn().mockImplementation(() => ({
    id: 'mock-user-id',
    userName: 'mockUser',
    email: 'mock@example.com',
    firstName: 'Mock',
    lastName: 'User',
    password: 'hashedPassword',
    role: 'user',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  })),
}))

jest.mock('../src/auth/entities/refresh-token.entity', () => ({
  RefreshToken: jest.fn().mockImplementation(() => ({
    id: 'mock-token-id',
    token: 'mock-refresh-token',
    user: new User(),
    expiresAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  })),
}))

// Mock TypeORM Repository
export const mockRepository = () => ({
  find: jest.fn(),
  findOne: jest.fn(),
  save: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  createQueryBuilder: jest.fn(() => ({
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getMany: jest.fn(),
    getOne: jest.fn(),
    getManyAndCount: jest.fn(),
  })),
})

// Mock Guards
jest.mock('../src/auth/guards/access-token.guard', () => ({
  AccessTokenGuard: jest.fn().mockImplementation(() => ({
    canActivate: jest.fn().mockResolvedValue(true),
  })),
}))

jest.mock('../src/auth/guards/super-user.guard', () => ({
  SuperUserGuard: jest.fn().mockImplementation(() => ({
    canActivate: jest.fn().mockResolvedValue(true),
  })),
}))

// Mock Request object for controller tests
export const mockRequest = {
  user: {
    id: 'mock-user-id',
    userName: 'mockUser',
    email: 'mock@example.com',
    firstName: 'Mock',
    lastName: 'User',
    role: 'user',
  },
}

// Mock common services
export const mockConfigService = {
  get: jest.fn((key: string) => {
    const config = {
      'jwt.secret': 'test-secret',
      'jwt.expiresIn': '1h',
      'database.host': 'localhost',
      // Add other config values as needed
    }
    return config[key]
  }),
}
