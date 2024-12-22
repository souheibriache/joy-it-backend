import { Module } from '@nestjs/common'
import { ActivityService } from './activity.service'
import { ActivityController } from './activity.controller'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Activity, ActivityImage } from './entities'
import { UploadModule } from '@app/upload'

@Module({
  imports: [TypeOrmModule.forFeature([Activity, ActivityImage]), UploadModule],
  controllers: [ActivityController],
  providers: [ActivityService],
  exports: [ActivityService],
})
export class ActivityModule {}
