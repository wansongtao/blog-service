import { Injectable } from '@nestjs/common';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'crypto';
import { getBaseConfig } from 'src/common/config';

@Injectable()
export class RedisService {
  constructor(
    @InjectRedis() private readonly redis: Redis,
    private readonly configService: ConfigService,
  ) {}

  generateCaptchaKey(ip: string, userAgent: string) {
    const data = `${ip}:${userAgent}`;
    const key = createHash('sha256').update(data).digest('hex');
    return `captcha:${key}`;
  }

  setCaptcha(key: string, value: string, expiresIn?: number) {
    if (expiresIn === undefined) {
      expiresIn = getBaseConfig(this.configService).captchaExpireIn;
    }

    return this.redis.set(key, value, 'EX', expiresIn);
  }

  getCaptcha(key: string) {
    return this.redis.get(key);
  }

  delCaptcha(key: string) {
    return this.redis.del(key);
  }

  generateSSOKey(userId: string) {
    return `sso:${userId}`;
  }

  setSSO(key: string, value: string, expiresIn?: number) {
    if (expiresIn === undefined) {
      expiresIn = getBaseConfig(this.configService).jwt.expiresIn;
    }

    return this.redis.set(key, value, 'EX', expiresIn);
  }

  getSSO(key: string) {
    return this.redis.get(key);
  }

  delSSO(key: string) {
    return this.redis.del(key);
  }

  generateSignInErrorsKey(userName: string) {
    return `sign-in:errors:${userName}`;
  }

  setSignInErrors(key: string, value: number) {
    const expiresIn = getBaseConfig(this.configService).signInErrorExpireIn;
    return this.redis.set(key, value, 'EX', expiresIn);
  }

  async getSignInErrors(key: string) {
    const result = (await this.redis.get(key)) || 0;
    return +result;
  }

  delSignInErrors(key: string) {
    return this.redis.del(key);
  }

  generateBlackListKey(token: string) {
    return `blacklist: ${token}`;
  }

  setBlackList(token: string) {
    const key = this.generateBlackListKey(token);
    const expiresIn = getBaseConfig(this.configService).jwt.expiresIn;
    this.redis.set(key, 'logout', 'EX', expiresIn);
  }

  async isBlackListed(token: string) {
    const key = this.generateBlackListKey(token);
    const has = await this.redis.exists(key);
    return !!has;
  }
}
