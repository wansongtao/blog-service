import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UserModule } from 'src/user/user.module';
import { JwtModule, type JwtModuleOptions } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { getBaseConfig } from 'src/common/config';
import { join } from 'path';
import { readFileSync } from 'fs';

@Module({
  imports: [
    UserModule,
    JwtModule.registerAsync({
      useFactory: (configService: ConfigService) => {
        const config = getBaseConfig(configService);
        const staticPath = join(__dirname, '../../../');
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
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
