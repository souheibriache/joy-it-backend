import { Controller, Get } from '@nestjs/common'
import { AppService } from './app.service'
import { MailerService } from '@app/mailer'

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly mailerService: MailerService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello()
  }

  @Get('mail')
  async sendMailTest() {
    return this.mailerService.test()
  }
}
