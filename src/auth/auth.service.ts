import { Injectable } from '@nestjs/common';
import { create as createCaptcha } from 'svg-captcha';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';
import { ConfigService } from '@nestjs/config';
import { getBaseConfig } from 'src/common/config';
import { getCaptchaKey } from 'src/common/config/redis-key';

@Injectable()
export class AuthService {
  constructor(
    @InjectRedis() private readonly redis: Redis,
    private readonly configService: ConfigService,
  ) {}

  generateCaptcha(ip: string, userAgent: string) {
    const captcha = createCaptcha({
      size: 4,
      noise: 2,
      color: true,
      ignoreChars: '0o1i',
      background: '#f0f0f0',
    });

    const key = getCaptchaKey(ip, userAgent);
    const expiresIn = getBaseConfig(this.configService).captchaExpireIn;
    this.redis.set(key, captcha.text, 'EX', expiresIn);

    return {
      captcha: `data:image/svg+xml;base64,${Buffer.from(captcha.data).toString('base64')}`,
    };
  }
}
