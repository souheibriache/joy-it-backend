import { Module } from '@nestjs/common';
import { UploadService } from './upload.service';
import { UploadProvider } from './providers/upload.provider';

@Module({
  providers: [UploadService, UploadProvider],
  exports: [UploadService, UploadProvider],
})
export class UploadModule {}
