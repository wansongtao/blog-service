import { HttpStatus, Injectable } from '@nestjs/common';
import { create as createCaptcha } from 'svg-captcha';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';
import { ConfigService } from '@nestjs/config';
import { getBaseConfig } from 'src/common/config';
import { getCaptchaKey, getSSOKey } from 'src/common/config/redis-key';
import { LoginDto } from './dto/auth.dto';
import { UserService } from 'src/user/user.service';
import { JwtService } from '@nestjs/jwt';

import type { IPayload } from 'src/common/types';

@Injectable()
export class AuthService {
  constructor(
    @InjectRedis() private readonly redis: Redis,
    private readonly configService: ConfigService,
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
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

  async validateCaptcha(ip: string, userAgent: string, captcha: string) {
    const key = getCaptchaKey(ip, userAgent);
    const value = await this.redis.get(key);

    if (value && value.toLowerCase() === captcha.toLowerCase()) {
      this.redis.del(key);
      return true;
    }

    return false;
  }

  async login(data: LoginDto, ip: string, userAgent: string) {
    const isCaptchaValid = await this.validateCaptcha(
      ip,
      userAgent,
      data.captcha,
    );
    if (!isCaptchaValid) {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        message: '验证码错误',
      };
    }

    const isUserValid = await this.userService.validateUser(
      data.userName,
      data.password,
    );
    if (!isUserValid) {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        message: '用户名或密码错误',
      };
    }

    const config = getBaseConfig(this.configService);
    const algorithm = config.jwt.algorithm;
    const payload: IPayload = { userName: data.userName };
    const token = this.jwtService.sign(payload, {
      algorithm,
      expiresIn: config.jwt.expiresIn,
    });
    const refreshToken = this.jwtService.sign(payload, {
      algorithm,
      expiresIn: config.jwt.refreshTokenIn,
    });

    const ssoKey = getSSOKey(data.userName);
    this.redis.set(ssoKey, token, 'EX', config.jwt.expiresIn);

    return { token, refreshToken };
  }
}
