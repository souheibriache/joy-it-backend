import { HttpException, HttpStatus } from '@nestjs/common';

export class ValidationErrorException extends HttpException {
  data: any;
  constructor(data: any) {
    super('ValidationError', HttpStatus.BAD_REQUEST);
    this.data = data;
  }
  getData() {
    return this.data;
  }
}
