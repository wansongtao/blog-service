import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { create as createCaptcha } from 'svg-captcha';
import { RedisService } from 'src/redis/redis.service';
import { ConfigService } from '@nestjs/config';
import { getBaseConfig } from 'src/common/config';
import { LoginDto } from './dto/auth.dto';
import { UserService } from 'src/modules/user/user.service';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcrypt';
import { generateMenus } from 'src/common/utils';
import { UserInfoEntity } from './entities/userinfo.entity';

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

    this.redisService.captcha(ip, userAgent).set(captcha.text);

    return {
      captcha: `data:image/svg+xml;base64,${Buffer.from(captcha.data).toString('base64')}`,
    };
  }

  async validateCaptcha(ip: string, userAgent: string, captcha: string) {
    const handler = this.redisService.captcha(ip, userAgent);
    const value = await handler.get();

    if (value && value.toLowerCase() === captcha.toLowerCase()) {
      await handler.remove();
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
    const loginAttemptsHandler = this.redisService.trackLoginAttempts(
      ip,
      userAgent,
    );
    const loginAttempts = await loginAttemptsHandler.get();
    const { signInErrorLimit, signInErrorExpireIn } = getBaseConfig(
      this.configService,
    );

    if (loginAttempts >= signInErrorLimit) {
      const minutes = Math.ceil(signInErrorExpireIn / 60);
      throw new BadRequestException(
        `验证码/用户名/密码错误次数过多，请${minutes}分钟后再试`,
      );
    }

    const isCaptchaValid = await this.validateCaptcha(
      ip,
      userAgent,
      data.captcha,
    );
    if (!isCaptchaValid) {
      await loginAttemptsHandler.increment();
      throw new BadRequestException('验证码错误');
    }

    const payload = await this.validateUser(data.userName, data.password);
    if (!payload) {
      await loginAttemptsHandler.increment();
      throw new BadRequestException('用户名或密码错误，或账号已被禁用');
    }

    const tokenObj = this.generateTokens(payload);
    this.redisService.sso(payload.userId).set(tokenObj.accessToken);

    return tokenObj;
  }

  async logout(accessToken: string, userId: string) {
    await this.redisService.blackList().set(accessToken);
    await this.redisService.sso(userId).remove();
  }

  async refreshToken(accessToken: string, refreshToken: string) {
    const isBlackListed = await this.redisService
      .blackList()
      .isBlackListed(accessToken);
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

    const validToken = await this.redisService.sso(payload.userId).get();
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
    this.redisService.sso(payload.userId).set(tokenObj.accessToken);
    return tokenObj;
  }

  async getUserInfo(id: string) {
    const userInfo = await this.userService.findUserPermissionInfo(id);
    if (!userInfo?.length) {
      throw new NotFoundException('用户不存在或账号已被禁用');
    }

    const userInfoItem = userInfo[0];
    const userAuthInfo: UserInfoEntity = {
      name: userInfoItem.nick_name || userInfoItem.user_name,
      avatar: userInfoItem.avatar,
      roles: userInfoItem.role_names ? userInfoItem.role_names.split(',') : [],
      permissions: [],
      menus: [],
    };

    if (!userAuthInfo.roles?.length) {
      return userAuthInfo;
    }

    const config = getBaseConfig(this.configService);
    if (userInfoItem.user_name === config.defaultAdmin.username) {
      userAuthInfo.permissions = [config.defaultAdmin.permission];
    } else {
      userAuthInfo.permissions = userInfo
        .filter((item) => item.permission)
        .map((item) => item.permission);
    }

    this.redisService.userPermissions(id).set(userAuthInfo.permissions);

    const menus = userInfo
      .filter((item) => item.type && item.type !== 'BUTTON')
      .map((item) => {
        return {
          id: item.id,
          pid: item.pid,
          name: item.name,
          path: item.path,
          component: item.component,
          cache: item.cache,
          hidden: item.hidden,
          icon: item.icon,
          redirect: item.redirect,
          props: item.props,
        };
      });
    userAuthInfo.menus = generateMenus(menus);

    return userAuthInfo;
  }
}
