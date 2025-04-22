import { Module } from '@nestjs/common'
import { SupportService } from './support.service'
import { SupportController } from './support.controller'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Support } from './entities'
import { SupportVisitorController } from './support-visitor.controller'
import { MediaModule } from '@app/media'
import { MailerModule } from '@app/mailer'
import { AuthModule } from 'src/auth/auth.module'
import { UserModule } from 'src/user/user.module'
import { UploadModule } from '@app/upload'
import { ClientModule } from 'src/client/client.module'

@Module({
  imports: [
    TypeOrmModule.forFeature([Support]),
    MediaModule,
    MailerModule,
    AuthModule,
    UserModule,
    ClientModule,
    UploadModule,
  ],
  controllers: [SupportController, SupportVisitorController],
  providers: [SupportService],
  exports: [SupportService],
})
export class SupportModule {}
