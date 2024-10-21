import { ConfigService } from '@nestjs/config';

export const getBaseConfig = (configService: ConfigService) => ({
  env: configService.get<string>('NODE_ENV'),
  port: +configService.get<number>('PORT', 3000),
  prefix: configService.get<string>('PREFIX'),
  bcryptSaltRounds: +configService.get<number>('BCRYPT_SALT_ROUNDS', 10),
  captchaExpireIn: +configService.get<number>('CAPTCHA_EXPIRES_IN', 120),
  defaultUser: {
    username: configService.get<string>('DEFAULT_ADMIN_USERNAME'),
    password: configService.get<string>('DEFAULT_ADMIN_PASSWORD'),
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
});
