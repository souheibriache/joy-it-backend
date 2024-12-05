import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RefreshToken } from './entities/refresh-token.entity';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@app/config';
import { UserModule } from 'src/user/user.module';
import { JwtStrategy } from './strategies';
import { ClientModule } from 'src/client/client.module';
import { SuperUserGuard } from './guards/super-user.guard';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_AUTH_KEY'),
        signOptions: { expiresIn: '7d' },
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([RefreshToken]),
    UserModule,
    ConfigModule,
    ClientModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
