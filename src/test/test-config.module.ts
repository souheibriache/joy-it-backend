import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [
        () => ({
          jwt: {
            auth_key: 'test_jwt_key',
            reset_password_secret_key: 'test_reset_key',
          },
          database: {
            host: 'localhost',
            port: 5432,
            username: 'test_user',
            password: 'test_password',
            name: 'test_db',
          },
          stripe: {
            secret_key: 'test_stripe_key',
          },
          cloudinary: {
            cloud_name: 'test_cloud',
            api_key: 'test_api_key',
            api_secret: 'test_api_secret',
          },
        }),
      ],
    }),
  ],
  exports: [ConfigModule],
})
export class TestConfigModule {}
