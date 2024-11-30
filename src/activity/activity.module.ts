import { Module } from '@nestjs/common';
import { ActivityService } from './activity.service';
import { ActivityController } from './activity.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Activity, ActivityImage } from './entities';

@Module({
  imports: [TypeOrmModule.forFeature([Activity, ActivityImage])],
  controllers: [ActivityController],
  providers: [ActivityService],
})
export class ActivityModule {}
