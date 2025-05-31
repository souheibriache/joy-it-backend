import { v2 as cloudinary } from 'cloudinary'
import { UploadProvider } from '../upload.provider'

jest.mock('cloudinary', () => ({
  v2: {
    config: jest.fn(),
  },
}))

describe('UploadProvider', () => {
  const originalEnv = process.env

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      CLOUDINARY_NAME: 'test-cloud',
      CLOUDINARY_API_KEY: 'test-api-key',
      CLOUDINARY_API_SECRET: 'test-api-secret',
    }
  })

  afterEach(() => {
    process.env = originalEnv
    jest.clearAllMocks()
  })

  it('should configure cloudinary with environment variables', () => {
    UploadProvider.useFactory()

    expect(cloudinary.config).toHaveBeenCalledWith({
      cloud_name: 'test-cloud',
      api_key: 'test-api-key',
      api_secret: 'test-api-secret',
    })
  })

  it('should handle missing environment variables', () => {
    delete process.env.CLOUDINARY_NAME
    delete process.env.CLOUDINARY_API_KEY
    delete process.env.CLOUDINARY_API_SECRET

    UploadProvider.useFactory()

    expect(cloudinary.config).toHaveBeenCalledWith({
      cloud_name: undefined,
      api_key: undefined,
      api_secret: undefined,
    })
  })

  it('should have correct provider token', () => {
    expect(UploadProvider.provide).toBe('CLOUDINARY')
  })
})
