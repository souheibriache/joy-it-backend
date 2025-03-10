import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Req,
  Request,
  UseGuards,
} from '@nestjs/common'
import { ServiceOrderService } from './service-order.service'
import { CreateServiceOrderDto, UpdateServiceOrderDto } from './dto'
import { IRequestWithUser } from '@app/common/interfaces/request-user.interface.dto'
import { AccessTokenGuard } from 'src/auth/guards/access-token.guard'

@Controller('service-order')
// @UseGuards(AccessTokenGuard)
export class ServiceOrderController {
  constructor(private readonly serviceOrderService: ServiceOrderService) {}

  @Post()
  async create(
    @Body() createServiceOrderDto: CreateServiceOrderDto,
    @Request() req: IRequestWithUser,
  ) {
    const userId = req?.user?.id
    return await this.serviceOrderService.create(createServiceOrderDto, userId)
  }

  @Get()
  async fetch(@Request() req: IRequestWithUser) {
    const userId = req?.user?.id
    return await this.serviceOrderService.find(
      { company: { client: { id: userId } } },
      { details: true, company: { client: true } },
    )
  }

  @Post('/:orderId/checkout')
  async checkout(
    @Param('orderId') orderId: string,
    @Request() req: IRequestWithUser,
  ) {
    const userId = req?.user?.id
    const session = await this.serviceOrderService.createCheckoutSession(
      orderId,
      userId,
    )
    return { url: session.url }
  }

  @Get('checkout/:session_id')
  async getCheckoutSession(@Param('session_id') sessionId: string) {
    return await this.serviceOrderService.getSessionById(sessionId)
  }

  @Get('/:id')
  async findOne(@Param('id') id: string, @Request() req: IRequestWithUser) {
    const userId = req?.user?.id

    return await this.serviceOrderService.findOne(
      {
        id,
        company: { client: { id: userId } },
      },
      {
        details: true,
      },
    )
  }
}
