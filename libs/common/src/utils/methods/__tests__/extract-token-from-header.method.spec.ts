import { Request } from 'express'
import { extractTokenFromHeader } from '../extract-token-from-header.method'

describe('extractTokenFromHeader', () => {
  let mockRequest: Partial<Request>

  beforeEach(() => {
    mockRequest = {
      headers: {},
    }
  })

  it('should extract token from valid Bearer authorization header', () => {
    mockRequest.headers = {
      authorization: 'Bearer validToken123',
    }
    const token = extractTokenFromHeader(mockRequest as Request)
    expect(token).toBe('validToken123')
  })

  it('should return undefined when authorization header is missing', () => {
    const token = extractTokenFromHeader(mockRequest as Request)
    expect(token).toBeUndefined()
  })

  it('should return undefined when authorization type is not Bearer', () => {
    mockRequest.headers = {
      authorization: 'Basic dXNlcjpwYXNz',
    }
    const token = extractTokenFromHeader(mockRequest as Request)
    expect(token).toBeUndefined()
  })

  it('should return undefined when authorization header is malformed', () => {
    const testCases = ['Bearer', 'BearervalidToken123', ' ', '']

    testCases.forEach((authHeader) => {
      mockRequest.headers = {
        authorization: authHeader,
      }
      const token = extractTokenFromHeader(mockRequest as Request)
      expect(token).toBeUndefined()
    })
  })

  it('should handle case-sensitive Bearer type', () => {
    const testCases = [
      { header: 'bearer validToken123', expected: undefined },
      { header: 'BEARER validToken123', expected: undefined },
      { header: 'Bearer validToken123', expected: 'validToken123' },
    ]

    testCases.forEach(({ header, expected }) => {
      mockRequest.headers = {
        authorization: header,
      }
      const token = extractTokenFromHeader(mockRequest as Request)
      expect(token).toBe(expected)
    })
  })
})
