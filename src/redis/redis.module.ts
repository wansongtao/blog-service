import { Module } from '@nestjs/common';
import { RedisService } from './redis.service';
import { RedisModule as BaseRedisModule } from '@nestjs-modules/ioredis';
import { ConfigService } from '@nestjs/config';
import { getBaseConfig } from 'src/common/config';

@Module({
  imports: [
    BaseRedisModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        type: 'single',
        url: getBaseConfig(configService).redis.url,
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [RedisService],
  exports: [RedisService],
})
export class RedisModule {}
