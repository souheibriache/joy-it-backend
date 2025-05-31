import { ArgumentsHost } from '@nestjs/common'
import { ValidationErrorFilter } from '../validation-error-filter'
import { ValidationErrorException } from '../validation-error-exception'
import { getErrorMessage } from '../../methods/get-error-message.method'

jest.mock('../../methods/get-error-message.method')

describe('ValidationErrorFilter', () => {
  let filter: ValidationErrorFilter
  let mockResponse: any
  let mockJson: jest.Mock
  let mockStatus: jest.Mock
  let mockGetErrorMessage: jest.Mock

  beforeEach(() => {
    mockJson = jest.fn().mockReturnThis()
    mockStatus = jest.fn().mockReturnValue({ json: mockJson })
    mockResponse = {
      status: mockStatus,
    }

    mockGetErrorMessage = getErrorMessage as jest.Mock
    mockGetErrorMessage.mockReturnValue('Formatted error message')

    filter = new ValidationErrorFilter()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(filter).toBeDefined()
  })

  it('should handle validation error exception', () => {
    const mockData = {
      field: 'username',
      message: 'Username is required',
    }
    const exception = new ValidationErrorException(mockData)
    const host = {
      switchToHttp: () => ({
        getResponse: () => mockResponse,
      }),
    } as ArgumentsHost

    filter.catch(exception, host)

    expect(mockStatus).toHaveBeenCalledWith(400)
    expect(mockJson).toHaveBeenCalledWith({
      statusCode: 400,
      message: 'Formatted error message',
      error: 'ValidationError',
    })
    expect(mockGetErrorMessage).toHaveBeenCalledWith(mockData)
  })

  it('should handle validation error with array data', () => {
    const mockData = [
      { field: 'username', message: 'Username is required' },
      { field: 'email', message: 'Email is invalid' },
    ]
    const exception = new ValidationErrorException(mockData)
    const host = {
      switchToHttp: () => ({
        getResponse: () => mockResponse,
      }),
    } as ArgumentsHost

    filter.catch(exception, host)

    expect(mockStatus).toHaveBeenCalledWith(400)
    expect(mockJson).toHaveBeenCalledWith({
      statusCode: 400,
      message: 'Formatted error message',
      error: 'ValidationError',
    })
    expect(mockGetErrorMessage).toHaveBeenCalledWith(mockData)
  })

  it('should handle validation error with nested data', () => {
    const mockData = {
      user: {
        username: ['Username is required'],
        email: ['Email is invalid', 'Email must be unique'],
      },
    }
    const exception = new ValidationErrorException(mockData)
    const host = {
      switchToHttp: () => ({
        getResponse: () => mockResponse,
      }),
    } as ArgumentsHost

    filter.catch(exception, host)

    expect(mockStatus).toHaveBeenCalledWith(400)
    expect(mockJson).toHaveBeenCalledWith({
      statusCode: 400,
      message: 'Formatted error message',
      error: 'ValidationError',
    })
    expect(mockGetErrorMessage).toHaveBeenCalledWith(mockData)
  })

  it('should handle validation error with null data', () => {
    const mockData = null
    const exception = new ValidationErrorException(mockData)
    const host = {
      switchToHttp: () => ({
        getResponse: () => mockResponse,
      }),
    } as ArgumentsHost

    filter.catch(exception, host)

    expect(mockStatus).toHaveBeenCalledWith(400)
    expect(mockJson).toHaveBeenCalledWith({
      statusCode: 400,
      message: 'Formatted error message',
      error: 'ValidationError',
    })
    expect(mockGetErrorMessage).toHaveBeenCalledWith(mockData)
  })
})
