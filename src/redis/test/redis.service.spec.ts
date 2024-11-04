import { TestBed } from '@automock/jest';
import { RedisService } from '../redis.service';
import Redis from 'ioredis';
import { getBaseConfig } from 'src/common/config';

jest.mock('src/common/config');

describe('RedisService Unit Test', () => {
  let redisService: RedisService;
  let redis: jest.Mocked<Redis>;

  beforeAll(() => {
    const { unit, unitRef } = TestBed.create(RedisService).compile();

    redisService = unit;
    // 获取被注入的 Redis 模拟实例，使用 InjectRedis 注入的 redis 的 key 固定为 default_IORedisModuleConnectionToken
    redis = unitRef.get('default_IORedisModuleConnectionToken');
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });
});
