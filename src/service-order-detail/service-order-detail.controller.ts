import { Controller } from '@nestjs/common'
import { ServiceOrderDetailService } from './service-order-detail.service'

@Controller('service-order-detail')
export class ServiceOrderDetailController {
  constructor(
    private readonly serviceOrderDetailService: ServiceOrderDetailService,
  ) {}
}
