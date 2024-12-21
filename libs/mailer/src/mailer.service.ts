import { ConfigService } from '@app/config';
import { Injectable } from '@nestjs/common';
import * as sgMail from '@sendgrid/mail';
import { sendEmailDto, SendMultipleEmailsDto } from '../dto';
import { MailDataRequired } from '@sendgrid/mail';
@Injectable()
export class MailerService {
  private sendgridClient = sgMail;
  private mailFrom = 'contact@joy-it.fr';
  constructor(private readonly configService: ConfigService) {
    this.sendgridClient.setApiKey(
      configService.get<string>('SENDGRID_API_KEY'),
    );
  }

  async test() {
    const msg = {
      to: 'souheibriache@gmail.com', // Change to your recipient
      from: this.mailFrom,
      text: 'and easy to do anywhere, even with Node.js',
      html: '<strong>and easy to do anywhere, even with Node.js</strong>',
    };

    return await this.sendgridClient
      .send(msg)
      .then(() => {
        console.log('Email sent');
        return true;
      })
      .catch((error) => console.error(error));
  }

  async sendSingle(sendEmailDto: sendEmailDto) {
    const message: MailDataRequired = {
      to: sendEmailDto.to,
      from: this.mailFrom,
      subject: sendEmailDto.subject,
      content: sendEmailDto.content,
      attachments: sendEmailDto.attachments,
      templateId: sendEmailDto.template,
      customArgs: sendEmailDto.customArgs,
    };

    return await this.sendgridClient.send(message);
  }

  async sendMultiple(sendMultipleEmailsDto: SendMultipleEmailsDto) {
    const message: MailDataRequired = {
      to: sendMultipleEmailsDto.to,
      from: this.mailFrom,
      subject: sendMultipleEmailsDto.subject,
      content: sendMultipleEmailsDto.content,
      attachments: sendMultipleEmailsDto.attachments,
      templateId: sendMultipleEmailsDto.template,
      customArgs: sendMultipleEmailsDto.customArgs,
    };

    return await this.sendgridClient.sendMultiple(message);
  }
}
