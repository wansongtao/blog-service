import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrismaModule } from 'nestjs-prisma';
import { getBaseConfig } from './common/config';
import { WinstonModule, utilities } from 'nest-winston';
import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { join } from 'path';
import { AuthModule } from './auth/auth.module';
import { RedisModule } from '@nestjs-modules/ioredis';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: `.env.${process.env.NODE_ENV || 'development'}`,
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
          transports: [
            new winston.transports.Console({
              level: 'error',
              format: winston.format.combine(
                winston.format.timestamp(),
                utilities.format.nestLike(),
              ),
            }),
            new DailyRotateFile({
              dirname: join(logDir, logLevel),
              filename: 'application-%DATE%.log',
              datePattern,
              zippedArchive: true,
              maxSize,
              maxFiles,
              level: logLevel,
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
          ],
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
    RedisModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        type: 'single',
        url: getBaseConfig(configService).redis.url,
      }),
      inject: [ConfigService],
    }),
    AuthModule,
  ],
  providers: [],
})
export class AppModule {}
