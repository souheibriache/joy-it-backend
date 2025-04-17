import { Module } from '@nestjs/common'
import { FaqService } from './faq.service'
import { FaqController } from './faq.controller'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Faq } from './entities'

@Module({
  imports: [TypeOrmModule.forFeature([Faq])],
  controllers: [FaqController],
  providers: [FaqService],
})
export class FaqModule {}
