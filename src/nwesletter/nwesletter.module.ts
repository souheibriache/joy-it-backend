import { Module } from '@nestjs/common'
import { NwesletterService } from './nwesletter.service'
import { NwesletterController } from './nwesletter.controller'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Newsletter } from './entities'

@Module({
  imports: [TypeOrmModule.forFeature([Newsletter])],
  controllers: [NwesletterController],
  providers: [NwesletterService],
})
export class NwesletterModule {}
