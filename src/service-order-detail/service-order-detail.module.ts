import { Module } from '@nestjs/common'
import { ServiceOrderDetailService } from './service-order-detail.service'
import { ServiceOrderDetailController } from './service-order-detail.controller'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ServiceOrderDetail } from './entities'

@Module({
  imports: [TypeOrmModule.forFeature([ServiceOrderDetail])],
  controllers: [ServiceOrderDetailController],
  providers: [ServiceOrderDetailService],
})
export class ServiceOrderDetailModule {}
