import { Module } from '@nestjs/common'
import { MailerService } from './mailer.service'
import { ConfigModule } from '@app/config'

@Module({
  imports: [ConfigModule],
  providers: [MailerService],
  exports: [MailerService],
})
export class MailerModule {}
