import { HttpStatus, HttpException } from '@nestjs/common'
import { ValidationErrorException } from '../validation-error-exception'

describe('ValidationErrorException', () => {
  const mockErrorData = {
    field: 'username',
    message: 'Username is required',
  }

  it('should create an instance with error data', () => {
    const exception = new ValidationErrorException(mockErrorData)
    expect(exception).toBeDefined()
    expect(exception).toBeInstanceOf(ValidationErrorException)
  })

  it('should set the correct HTTP status code', () => {
    const exception = new ValidationErrorException(mockErrorData)
    expect(exception.getStatus()).toBe(HttpStatus.BAD_REQUEST)
  })

  it('should set the correct error message', () => {
    const exception = new ValidationErrorException(mockErrorData)
    expect(exception.message).toBe('ValidationError')
  })

  it('should store and return the error data', () => {
    const exception = new ValidationErrorException(mockErrorData)
    expect(exception.data).toEqual(mockErrorData)
    expect(exception.getData()).toEqual(mockErrorData)
  })

  it('should handle different types of error data', () => {
    const testCases = [
      { input: 'Simple string error', expected: 'Simple string error' },
      { input: ['Error 1', 'Error 2'], expected: ['Error 1', 'Error 2'] },
      {
        input: { code: 123, message: 'Error' },
        expected: { code: 123, message: 'Error' },
      },
      { input: null, expected: null },
      { input: undefined, expected: undefined },
    ]

    testCases.forEach(({ input, expected }) => {
      const exception = new ValidationErrorException(input)
      expect(exception.getData()).toEqual(expected)
    })
  })

  it('should inherit from HttpException', () => {
    const exception = new ValidationErrorException(mockErrorData)
    expect(exception).toBeInstanceOf(HttpException)
  })
})
