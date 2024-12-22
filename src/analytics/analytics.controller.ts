import { Controller, Get, UseGuards } from '@nestjs/common'
import { AnalyticsService } from './analytics.service'
import { AnalyticsResponseDto } from './dto/analytics.dto'
import { SuperUserGuard } from 'src/auth/guards/super-user.guard'
import { AccessTokenGuard } from 'src/auth/guards/access-token.guard'
import { ApiBearerAuth } from '@nestjs/swagger'

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get()
  @UseGuards(AccessTokenGuard, SuperUserGuard)
  @ApiBearerAuth()
  async getAnalytics(): Promise<AnalyticsResponseDto> {
    return this.analyticsService.getApplicationAnalytics()
  }
}
