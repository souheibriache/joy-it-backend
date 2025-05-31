import { getErrorMessage } from '../get-error-message.method'

describe('getErrorMessage', () => {
  it('should handle array of errors and return first error message', () => {
    const errors = [
      {
        constraints: {
          isNotEmpty: 'Field should not be empty',
          isString: 'Field must be a string',
        },
      },
      {
        constraints: {
          isEmail: 'Invalid email format',
        },
      },
    ]

    expect(getErrorMessage(errors)).toBe('Field should not be empty')
  })

  it('should handle single error object', () => {
    const error = {
      constraints: {
        isNotEmpty: 'Field should not be empty',
      },
    }

    expect(getErrorMessage(error)).toBe('Field should not be empty')
  })

  it('should handle nested children errors', () => {
    const error = {
      children: [
        {
          constraints: {
            isNotEmpty: 'Nested field should not be empty',
          },
        },
      ],
    }

    expect(getErrorMessage(error)).toBe('Nested field should not be empty')
  })

  it('should handle deeply nested children errors', () => {
    const error = {
      children: [
        {
          children: [
            {
              constraints: {
                isNotEmpty: 'Deeply nested field should not be empty',
              },
            },
          ],
        },
      ],
    }

    expect(getErrorMessage(error)).toBe(
      'Deeply nested field should not be empty',
    )
  })

  it('should handle empty children array', () => {
    const error = {
      children: [],
      constraints: {
        isNotEmpty: 'Parent field should not be empty',
      },
    }

    expect(getErrorMessage(error)).toBe('Parent field should not be empty')
  })

  it('should handle missing constraints', () => {
    const error = {}

    expect(getErrorMessage(error)).toBe(
      'default error message from ValidationErrorFilter',
    )
  })

  it('should handle null or undefined input', () => {
    expect(getErrorMessage(null)).toBe(
      'default error message from ValidationErrorFilter',
    )
    expect(getErrorMessage(undefined)).toBe(
      'default error message from ValidationErrorFilter',
    )
  })

  it('should handle array with invalid elements', () => {
    const errors = [null, undefined, {}]

    expect(getErrorMessage(errors)).toBe(
      'default error message from ValidationErrorFilter',
    )
  })

  it('should handle complex nested structure', () => {
    const error = {
      children: [
        {
          children: [],
          constraints: {
            isNotEmpty: 'First level error',
          },
        },
        {
          children: [
            {
              constraints: {
                isString: 'Second level error',
              },
            },
          ],
        },
      ],
    }

    expect(getErrorMessage(error)).toBe('First level error')
  })
})
