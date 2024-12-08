import { Controller, Get } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { AnalyticsResponseDto } from './dto/analytics.dto';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get()
  async getAnalytics(): Promise<AnalyticsResponseDto> {
    return this.analyticsService.getApplicationAnalytics();
  }
}
