import { Module } from '@nestjs/common';
import { CompanyService } from './company.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Company } from './entities';
import { MediaModule } from '@app/media';
import { UploadModule } from '@app/upload';
import { CompanyAdminController } from './controllers/admin-company.controller';
import { CompanyController } from './controllers/company.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Company]), MediaModule, UploadModule],
  controllers: [CompanyController, CompanyAdminController],
  providers: [CompanyService],
  exports: [CompanyService],
})
export class CompanyModule {}
