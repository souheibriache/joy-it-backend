import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@app/config';
import { DatabaseModule } from '@app/database';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { AdminModule } from './admin/admin.module';
import { ClientModule } from './client/client.module';

@Module({
  imports: [ConfigModule, DatabaseModule, UserModule, AuthModule, AdminModule, ClientModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
