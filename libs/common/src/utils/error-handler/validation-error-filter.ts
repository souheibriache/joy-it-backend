import { ExceptionFilter, Catch, ArgumentsHost } from '@nestjs/common'
import { Response } from 'express'
import { ValidationErrorException } from './validation-error-exception'
import { getErrorMessage } from '../methods/get-error-message.method'

export const APP_FILTER = 'APP_FILTER'

@Catch(ValidationErrorException)
export class ValidationErrorFilter implements ExceptionFilter {
  catch(exception: ValidationErrorException, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>()

    const status = exception.getStatus()

    const errors = exception.getData()
    const message = getErrorMessage(errors)

    response.status(status).json({
      statusCode: status,
      message,
      error: exception.message,
    })
  }
}
