import { Module } from '@nestjs/common'
import { CompanyService } from './company.service'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Company } from './entities'
import { MediaModule } from '@app/media'
import { UploadModule } from '@app/upload'
import { CompanyAdminController } from './controllers/admin-company.controller'
import { CompanyController } from './controllers/company.controller'
import { ClientModule } from 'src/client/client.module'
import { StripeModule } from 'src/stripe/stripe.module'

@Module({
  imports: [
    TypeOrmModule.forFeature([Company]),
    MediaModule,
    UploadModule,
    ClientModule,
    StripeModule,
  ],
  controllers: [CompanyController, CompanyAdminController],
  providers: [CompanyService],
  exports: [CompanyService],
})
export class CompanyModule {}
