import { Injectable } from '@nestjs/common';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'crypto';
import { getBaseConfig } from 'src/common/config';
import { getSeconds } from 'src/common/utils';

@Injectable()
export class RedisService {
  constructor(
    @InjectRedis() private readonly redis: Redis,
    private readonly configService: ConfigService,
  ) {}

  captcha(ip: string, userAgent: string) {
    const generateKey = () => {
      const data = `${ip}:${userAgent}`;
      const key = createHash('sha256').update(data).digest('hex');
      return `captcha: ${key}`;
    };
    const key = generateKey();

    const set = (value: string) => {
      const expiresIn = getBaseConfig(this.configService).captchaExpireIn;
      return this.redis.set(key, value, 'EX', expiresIn);
    };

    return {
      set,
      get: () => {
        return this.redis.get(key);
      },
      remove: () => {
        return this.redis.del(key);
      },
    };
  }

  sso(userId: string) {
    const key = `sso: ${userId}`;

    return {
      set: (value: string) => {
        const time = getBaseConfig(this.configService).jwt.refreshTokenIn;
        const expiresIn = getSeconds(parseInt(time), 'd');

        return this.redis.set(key, value, 'EX', expiresIn);
      },
      get: () => {
        return this.redis.get(key);
      },
      remove: () => {
        return this.redis.del(key);
      },
    };
  }

  trackLoginAttempts(ip: string, userAgent: string) {
    const generateKey = () => {
      const data = `${ip}:${userAgent}`;
      const key = createHash('sha256').update(data).digest('hex');
      return `login-attempts: ${key}`;
    };

    const key = generateKey();
    const get = async () => {
      const current = await this.redis.get(key);
      return +(current ?? 0);
    };
    const set = (value: number) => {
      const expiresIn = getBaseConfig(this.configService).signInErrorExpireIn;
      return this.redis.set(key, value, 'EX', expiresIn);
    };

    return {
      increment: async () => {
        const current = await get();
        return set(current + 1);
      },
      get,
      reset: () => {
        return this.redis.del(key);
      },
      set,
    };
  }

  blackList() {
    return {
      set: (token: string) => {
        const expiresIn = getBaseConfig(this.configService).jwt.expiresIn;
        return this.redis.set(token, 'logout', 'EX', expiresIn);
      },
      isBlackListed: async (token: string) => {
        const has = await this.redis.exists(token);
        return !!has;
      },
    };
  }

  userPermissions(id: string) {
    const key = `permissions: ${id}`;

    return {
      set: async (permissions: string[]) => {
        await this.redis.sadd(key, permissions);
        await this.redis.expire(
          key,
          getBaseConfig(this.configService).jwt.expiresIn,
        );
      },
      get: () => {
        return this.redis.smembers(key);
      },
      remove: () => {
        return this.redis.del(key);
      },
    };
  }
}
