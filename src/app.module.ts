import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@app/config';
import { DatabaseModule } from '@app/database';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { AdminModule } from './admin/admin.module';
import { ClientModule } from './client/client.module';
import { CompanyModule } from './company/company.module';
import { SubscriptionModule } from './subscription/subscription.module';
import { PlanModule } from './plan/plan.module';
import { ActivityModule } from './activity/activity.module';
import { MediaModule } from '@app/media';
import { ScheduleModule } from './schedule/schedule.module';
import { APP_FILTER } from '@nestjs/core';
import { ValidationErrorFilter } from '@app/common/utils/error-handler/validation-error-filter';
import { AnalyticsModule } from './analytics/analytics.module';

@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    UserModule,
    AuthModule,
    AdminModule,
    ClientModule,
    CompanyModule,
    SubscriptionModule,
    PlanModule,
    ActivityModule,
    MediaModule,
    ScheduleModule,
    AnalyticsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_FILTER,
      useClass: ValidationErrorFilter,
    },
  ],
})
export class AppModule {}
