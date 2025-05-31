// Set up test environment variables
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
