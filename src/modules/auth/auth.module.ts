import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { RedisModule } from 'src/redis/redis.module';
import { UserModule } from 'src/modules/user/user.module';
import { JwtModule, type JwtModuleOptions } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { getBaseConfig } from 'src/common/config';
import { join } from 'path';
import { readFileSync } from 'fs';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [
    RedisModule,
    UserModule,
    JwtModule.registerAsync({
      useFactory: (configService: ConfigService) => {
        const config = getBaseConfig(configService);
        const staticPath = join(__dirname, '../../../../');
        const privateKey = readFileSync(
          join(staticPath, config.jwt.privateKeyPath),
        );
        const publicKey = readFileSync(
          join(staticPath, config.jwt.publicKeyPath),
        );

        const options: JwtModuleOptions = {
          privateKey,
          publicKey,
        };

        return options;
      },
      inject: [ConfigService],
    }),
    PassportModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
})
export class AuthModule {}
