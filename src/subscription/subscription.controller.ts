import { Body, Controller, Post, Request, UseGuards } from '@nestjs/common'
import { SubscriptionService } from './subscription.service'
import { CreateSubscriptionDto } from './dto/create-subscription.dto'
import { IRequestWithUser } from '@app/common/interfaces/request-user.interface.dto'
import { AccessTokenGuard } from 'src/auth/guards/access-token.guard'
import { CreateSubscriptionByAdminDto } from './dto/create-subscription-admin.dto'
import { ApiBearerAuth } from '@nestjs/swagger'
import { SuperUserGuard } from 'src/auth/guards/super-user.guard'

@Controller('subscription')
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Post()
  @ApiBearerAuth()
  @UseGuards(AccessTokenGuard)
  async create(
    @Body() createSubscriptionDto: CreateSubscriptionDto,
    @Request() req: IRequestWithUser,
  ) {
    const clientId = req?.user?.id
    return await this.subscriptionService.create(
      createSubscriptionDto.planId,
      clientId,
    )
  }

  @Post('admin')
  @ApiBearerAuth()
  @UseGuards(AccessTokenGuard, SuperUserGuard)
  async createByAdmin(
    @Body() createSubscriptionDto: CreateSubscriptionByAdminDto,
  ) {
    return await this.subscriptionService.createByAdmin(
      createSubscriptionDto.planId,
      createSubscriptionDto.companyId,
    )
  }
}
