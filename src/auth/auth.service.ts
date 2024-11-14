import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { create as createCaptcha } from 'svg-captcha';
import { RedisService } from 'src/redis/redis.service';
import { ConfigService } from '@nestjs/config';
import { getBaseConfig } from 'src/common/config';
import { LoginDto } from './dto/auth.dto';
import { UserService } from 'src/user/user.service';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcrypt';

import type { IPayload } from 'src/common/types';

@Injectable()
export class AuthService {
  constructor(
    private readonly redisService: RedisService,
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

    this.redisService.setCaptcha(
      this.redisService.generateCaptchaKey(ip, userAgent),
      captcha.text,
    );

    return {
      captcha: `data:image/svg+xml;base64,${Buffer.from(captcha.data).toString('base64')}`,
    };
  }

  async validateCaptcha(ip: string, userAgent: string, captcha: string) {
    const key = this.redisService.generateCaptchaKey(ip, userAgent);
    const value = await this.redisService.getCaptcha(key);

    if (value && value.toLowerCase() === captcha.toLowerCase()) {
      this.redisService.delCaptcha(key);
      return true;
    }

    return false;
  }

  validateUser(
    userName: string,
    password: string,
    isValidatePwd?: true,
  ): Promise<false | IPayload>;
  validateUser(
    userName: string,
    password: undefined,
    isValidatePwd: false,
  ): Promise<false | IPayload>;
  async validateUser(
    userName: string,
    password: string,
    isValidatePwd?: boolean,
  ): Promise<false | IPayload> {
    const user = await this.userService.findUser(userName);
    if (!user || user.disabled) {
      return false;
    }

    if (isValidatePwd === false) {
      return { userName: user.userName, userId: user.id };
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return false;
    }

    return { userName: user.userName, userId: user.id };
  }

  generateTokens(payload: IPayload) {
    const config = getBaseConfig(this.configService);
    const algorithm = config.jwt.algorithm;
    const accessToken = this.jwtService.sign(payload, {
      algorithm,
      expiresIn: config.jwt.expiresIn,
    });
    const refreshToken = this.jwtService.sign(payload, {
      algorithm,
      expiresIn: config.jwt.refreshTokenIn,
    });

    return { accessToken, refreshToken };
  }

  async login(data: LoginDto, ip: string, userAgent: string) {
    const signInErrorsKey = this.redisService.generateSignInErrorsKey(
      ip,
      userAgent,
    );
    const signInErrors =
      await this.redisService.getSignInErrors(signInErrorsKey);
    if (signInErrors >= getBaseConfig(this.configService).signInErrorLimit) {
      const expiresIn =
        getBaseConfig(this.configService).signInErrorExpireIn / 60;

      throw new BadRequestException(
        `验证码/用户名/密码错误次数过多，请${expiresIn}分钟后再试`,
      );
    }

    const isCaptchaValid = await this.validateCaptcha(
      ip,
      userAgent,
      data.captcha,
    );
    if (!isCaptchaValid) {
      this.redisService.setSignInErrors(signInErrorsKey, signInErrors + 1);
      throw new BadRequestException('验证码错误');
    }

    const payload = await this.validateUser(data.userName, data.password);
    if (!payload) {
      this.redisService.setSignInErrors(signInErrorsKey, signInErrors + 1);
      throw new BadRequestException('用户名或密码错误，或账号已被禁用');
    }

    const tokenObj = this.generateTokens(payload);
    this.redisService.setSSO(
      this.redisService.generateSSOKey(payload.userId),
      tokenObj.accessToken,
    );

    return tokenObj;
  }

  async logout(accessToken: string, userId: string) {
    this.redisService.setBlackList(accessToken);
    this.redisService.delSSO(this.redisService.generateSSOKey(userId));
  }

  async refreshToken(accessToken: string, refreshToken: string) {
    const isBlackListed = await this.redisService.isBlackListed(accessToken);
    if (isBlackListed) {
      throw new UnauthorizedException('请重新登录');
    }

    let payload: IPayload;
    try {
      const { userId, userName } =
        this.jwtService.verify<IPayload>(refreshToken);
      payload = { userId, userName };
    } catch {
      throw new UnauthorizedException('请重新登录');
    }

    const validToken = await this.redisService.getSSO(
      this.redisService.generateSSOKey(payload.userId),
    );
    if (accessToken !== validToken) {
      throw new UnauthorizedException('该账号已在其他地方登录，请重新登录');
    }

    const validUser = await this.validateUser(
      payload.userName,
      undefined,
      false,
    );
    if (validUser === false) {
      throw new UnauthorizedException('用户不存在或账号已被禁用');
    }

    const tokenObj = this.generateTokens(payload);
    this.redisService.setSSO(
      this.redisService.generateSSOKey(payload.userId),
      tokenObj.accessToken,
    );
    return tokenObj;
  }
}
