import { Test, TestingModule } from '@nestjs/testing'
import { UploadService } from './upload.service'
import { v2 as cloudinary } from 'cloudinary'
import * as streamifier from 'streamifier'

jest.mock('cloudinary', () => ({
  v2: {
    uploader: {
      upload_stream: jest.fn(),
    },
  },
}))

jest.mock('streamifier', () => ({
  createReadStream: jest.fn(),
}))

describe('UploadService', () => {
  let service: UploadService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UploadService],
    }).compile()

    service = module.get<UploadService>(UploadService)
    process.env.JOYIT_ROOT_FOLDER = 'test-root'
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('upload', () => {
    const mockFile: Express.Multer.File = {
      fieldname: 'file',
      originalname: 'test.jpg',
      encoding: '7bit',
      mimetype: 'image/jpeg',
      buffer: Buffer.from('test'),
      size: 4,
      stream: null,
      destination: '',
      filename: 'test.jpg',
      path: '/test/test.jpg',
    }

    it('should upload a single file successfully', async () => {
      const mockPipe = jest.fn()
      const mockReadStream = { pipe: mockPipe }
      const mockUploadStream = { eventEmitter: 'mock' }
      const mockCloudinaryResponse = {
        public_id: 'test-id',
        secure_url: 'https://test.com/test.jpg',
      }

      ;(streamifier.createReadStream as jest.Mock).mockReturnValue(
        mockReadStream,
      )
      ;(cloudinary.uploader.upload_stream as jest.Mock).mockImplementation(
        (options, callback) => {
          callback(null, mockCloudinaryResponse)
          return mockUploadStream
        },
      )

      const result = await service.upload(mockFile, 'test-folder')

      expect(result).toEqual(mockCloudinaryResponse)
      expect(cloudinary.uploader.upload_stream).toHaveBeenCalledWith(
        { folder: 'test-root/test-folder' },
        expect.any(Function),
      )
      expect(streamifier.createReadStream).toHaveBeenCalledWith(mockFile.buffer)
      expect(mockPipe).toHaveBeenCalledWith(mockUploadStream)
    })

    it('should handle upload errors', async () => {
      const mockPipe = jest.fn()
      const mockReadStream = { pipe: mockPipe }
      const mockUploadStream = { eventEmitter: 'mock' }
      const mockError = new Error('Upload failed')

      ;(streamifier.createReadStream as jest.Mock).mockReturnValue(
        mockReadStream,
      )
      ;(cloudinary.uploader.upload_stream as jest.Mock).mockImplementation(
        (options, callback) => {
          callback(mockError, null)
          return mockUploadStream
        },
      )

      await expect(service.upload(mockFile, 'test-folder')).rejects.toThrow(
        'Upload failed',
      )
    })

    it('should handle missing folder name', async () => {
      const mockPipe = jest.fn()
      const mockReadStream = { pipe: mockPipe }
      const mockUploadStream = { eventEmitter: 'mock' }
      const mockCloudinaryResponse = {
        public_id: 'test-id',
        secure_url: 'https://test.com/test.jpg',
      }

      ;(streamifier.createReadStream as jest.Mock).mockReturnValue(
        mockReadStream,
      )
      ;(cloudinary.uploader.upload_stream as jest.Mock).mockImplementation(
        (options, callback) => {
          callback(null, mockCloudinaryResponse)
          return mockUploadStream
        },
      )

      const result = await service.upload(mockFile)

      expect(result).toEqual(mockCloudinaryResponse)
      expect(cloudinary.uploader.upload_stream).toHaveBeenCalledWith(
        { folder: 'test-root/undefined' },
        expect.any(Function),
      )
    })
  })

  describe('uploadMany', () => {
    const mockFiles: Express.Multer.File[] = [
      {
        fieldname: 'file1',
        originalname: 'test1.jpg',
        encoding: '7bit',
        mimetype: 'image/jpeg',
        buffer: Buffer.from('test1'),
        size: 5,
        stream: null,
        destination: '',
        filename: 'test1.jpg',
        path: '/test/test1.jpg',
      },
      {
        fieldname: 'file2',
        originalname: 'test2.jpg',
        encoding: '7bit',
        mimetype: 'image/jpeg',
        buffer: Buffer.from('test2'),
        size: 5,
        stream: null,
        destination: '',
        filename: 'test2.jpg',
        path: '/test/test2.jpg',
      },
    ]

    it('should upload multiple files successfully', async () => {
      const mockPipe = jest.fn()
      const mockReadStream = { pipe: mockPipe }
      const mockUploadStream = { eventEmitter: 'mock' }
      const mockCloudinaryResponses = [
        {
          public_id: 'test-id-1',
          secure_url: 'https://test.com/test1.jpg',
        },
        {
          public_id: 'test-id-2',
          secure_url: 'https://test.com/test2.jpg',
        },
      ]

      ;(streamifier.createReadStream as jest.Mock).mockReturnValue(
        mockReadStream,
      )
      ;(cloudinary.uploader.upload_stream as jest.Mock).mockImplementation(
        (options, callback) => {
          callback(null, mockCloudinaryResponses[mockPipe.mock.calls.length])
          return mockUploadStream
        },
      )

      const results = await service.uploadMany(mockFiles, 'test-folder')

      expect(results).toHaveLength(2)
      expect(cloudinary.uploader.upload_stream).toHaveBeenCalledTimes(2)
      expect(streamifier.createReadStream).toHaveBeenCalledTimes(2)
      expect(mockPipe).toHaveBeenCalledTimes(2)
    })

    it('should handle errors in multiple file upload', async () => {
      const mockPipe = jest.fn()
      const mockReadStream = { pipe: mockPipe }
      const mockUploadStream = { eventEmitter: 'mock' }
      const mockError = new Error('Upload failed')

      ;(streamifier.createReadStream as jest.Mock).mockReturnValue(
        mockReadStream,
      )
      ;(cloudinary.uploader.upload_stream as jest.Mock).mockImplementation(
        (options, callback) => {
          callback(mockError, null)
          return mockUploadStream
        },
      )

      await expect(
        service.uploadMany(mockFiles, 'test-folder'),
      ).rejects.toThrow('Upload failed')
    })

    it('should handle empty file array', async () => {
      const results = await service.uploadMany([], 'test-folder')

      expect(results).toEqual([])
      expect(cloudinary.uploader.upload_stream).not.toHaveBeenCalled()
      expect(streamifier.createReadStream).not.toHaveBeenCalled()
    })
  })
})
