import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrismaModule } from 'nestjs-prisma';
import { getBaseConfig } from './common/config';
import {
  WinstonModule,
  type WinstonModuleOptions,
  utilities,
} from 'nest-winston';
import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { join } from 'path';
import { AuthModule } from './modules/auth/auth.module';
import { BaseResponseInterceptor } from 'src/common/interceptor/base-response.interceptor';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { UserModule } from './modules/user/user.module';
import { RedisModule } from './redis/redis.module';
import { JwtAuthGuard } from './common/guard/jwt-auth.guard';
import { PermissionModule } from './modules/permission/permission.module';
import { AuthorityGuard } from './common/guard/authority.guard';
import { UploadModule } from './modules/upload/upload.module';
import { RoleModule } from './modules/role/role.module';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { CategoryModule } from './modules/category/category.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath:
        process.env.NODE_ENV === 'production'
          ? '../.env.production.local'
          : `../.env.${process.env.NODE_ENV || 'development'}`,
      isGlobal: true,
      cache: true,
    }),
    PrismaModule.forRootAsync({
      isGlobal: true,
      useFactory: (configService: ConfigService) => {
        return {
          prismaOptions: {
            datasources: {
              db: {
                url: getBaseConfig(configService).db.url,
              },
            },
          },
          explicitConnect: false,
        };
      },
      inject: [ConfigService],
    }),
    WinstonModule.forRootAsync({
      useFactory: (configService: ConfigService) => {
        const config = getBaseConfig(configService);
        const logLevel = config.winston.logLevel;
        const logDir = config.winston.logDir;
        const maxSize = config.winston.logMaxSize;
        const maxFiles = config.winston.logMaxFiles;
        const datePattern = config.winston.logDatePattern;

        const transports: WinstonModuleOptions['transports'] = [
          new DailyRotateFile({
            dirname: join(logDir, logLevel),
            filename: 'application-%DATE%.log',
            datePattern,
            zippedArchive: true,
            maxSize,
            maxFiles,
            format: winston.format.combine(
              winston.format((info) => {
                if (info.level === 'error') {
                  return false;
                }
                return info;
              })(),
            ),
          }),
          new DailyRotateFile({
            dirname: join(logDir, 'error'),
            filename: 'error-%DATE%.log',
            datePattern,
            zippedArchive: true,
            maxSize,
            maxFiles,
            level: 'error',
          }),
        ];

        if (config.env !== 'production') {
          transports.push(
            new winston.transports.Console({
              level: 'error',
              format: winston.format.combine(
                winston.format.timestamp(),
                utilities.format.nestLike(),
              ),
            }),
          );
        }

        return {
          level: logLevel,
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.ms(),
            utilities.format.nestLike('MyApp', {
              prettyPrint: true,
              colors: true,
            }),
            winston.format.errors({ stack: true }),
          ),
          transports,
          exceptionHandlers: [
            new DailyRotateFile({
              dirname: join(logDir, 'exceptions'),
              filename: 'exceptions-%DATE%.log',
              datePattern,
              zippedArchive: true,
              maxSize,
              maxFiles,
            }),
          ],
        };
      },
      inject: [ConfigService],
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          ttl: getBaseConfig(config).throttle.ttl,
          limit: getBaseConfig(config).throttle.limit,
        },
      ],
    }),
    AuthModule,
    UserModule,
    RedisModule,
    PermissionModule,
    UploadModule,
    RoleModule,
    CategoryModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: BaseResponseInterceptor,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: AuthorityGuard,
    },
  ],
})
export class AppModule {}
