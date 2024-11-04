import { HttpStatus, Injectable } from '@nestjs/common';
import { create as createCaptcha } from 'svg-captcha';
import { RedisService } from 'src/redis/redis.service';
import { ConfigService } from '@nestjs/config';
import { getBaseConfig } from 'src/common/config';
import { LoginDto } from './dto/auth.dto';
import { UserService } from 'src/user/user.service';
import { JwtService } from '@nestjs/jwt';

import type { IPayload } from 'src/common/types';

@Injectable()
export class AuthService {
  constructor(
    private readonly redis: RedisService,
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

    this.redis.setCaptcha(
      this.redis.generateCaptchaKey(ip, userAgent),
      captcha.text,
    );

    return {
      captcha: `data:image/svg+xml;base64,${Buffer.from(captcha.data).toString('base64')}`,
    };
  }

  async validateCaptcha(ip: string, userAgent: string, captcha: string) {
    const key = this.redis.generateCaptchaKey(ip, userAgent);
    const value = await this.redis.getCaptcha(key);

    if (value && value.toLowerCase() === captcha.toLowerCase()) {
      this.redis.delCaptcha(key);
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

    this.redis.setSSO(this.redis.generateSSOKey(data.userName), token);

    return { token, refreshToken };
  }
}
