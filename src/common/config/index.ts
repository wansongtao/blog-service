import { ConfigService } from '@nestjs/config';
import type { JwtSignOptions } from '@nestjs/jwt';

export const getBaseConfig = (configService: ConfigService) => ({
  env: configService.get<string>('NODE_ENV'),
  port: +configService.get<number>('PORT', 3000),
  prefix: configService.get<string>('PREFIX'),
  bcryptSaltRounds: +configService.get<number>('BCRYPT_SALT_ROUNDS', 10),
  captchaExpireIn: +configService.get<number>('CAPTCHA_EXPIRES_IN', 120),
  signInErrorLimit: +configService.get<number>('SIGN_IN_ERROR_LIMIT', 5),
  signInErrorExpireIn: +configService.get<number>(
    'SIGN_IN_ERROR_EXPIRES_IN',
    60 * 5,
  ),
  defaultAdmin: {
    username: configService.get<string>('DEFAULT_ADMIN_USERNAME'),
    password: configService.get<string>('DEFAULT_ADMIN_PASSWORD'),
    permission: configService.get<string>('DEFAULT_ADMIN_PERMISSION'),
    role: configService.get<string>('DEFAULT_ADMIN_ROLE'),
  },
  db: {
    url: configService.get<string>('DATABASE_URL'),
  },
  swagger: {
    title: configService.get<string>('SWAGGER_TITLE'),
    description: configService.get<string>('SWAGGER_DESCRIPTION'),
    version: configService.get<string>('SWAGGER_VERSION'),
  },
  winston: {
    logLevel: configService.get<string>('LOG_LEVEL'),
    logDir: configService.get<string>('LOG_DIR'),
    logMaxSize: configService.get<string>('LOG_MAX_SIZE'),
    logMaxFiles: configService.get<string>('LOG_MAX_FILES'),
    logDatePattern: configService.get<string>('LOG_DATE_PATTERN'),
  },
  redis: {
    url: configService.get<string>('REDIS_URL'),
  },
  jwt: {
    algorithm: configService.get(
      'JWT_ALGORITHM',
    ) as JwtSignOptions['algorithm'],
    publicKeyPath: configService.get<string>('JWT_PUBLIC_KEY_PATH'),
    privateKeyPath: configService.get<string>('JWT_PRIVATE_KEY_PATH'),
    expiresIn: +configService.get<number>('JWT_EXPIRES_IN'),
    refreshTokenIn: configService.get<string>('JWT_REFRESH_TOKEN_EXPIRES_IN'),
  },
});
