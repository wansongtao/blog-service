import { ExtractJwt, Strategy, StrategyOptionsWithRequest } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisService } from 'src/redis/redis.service';
import { UserService } from 'src/user/user.service';
import { IPayload } from 'src/common/types';
import { join } from 'path';
import { readFileSync } from 'fs';
import { getBaseConfig } from 'src/common/config';

import { Request } from 'express';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
    private readonly userService: UserService,
  ) {
    const staticPath = join(__dirname, '../../../');
    const publicKeyPath = getBaseConfig(configService).jwt.publicKeyPath;
    const publicKey = readFileSync(join(staticPath, publicKeyPath));

    const options: StrategyOptionsWithRequest = {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: publicKey,
      passReqToCallback: true,
    };

    super(options);
  }

  async validate(req: Request, payload: IPayload): Promise<IPayload> {
    const token = req.headers.authorization?.split(' ')[1];
    const validToken = await this.redisService.getSSO(
      this.redisService.generateSSOKey(payload.userName),
    );
    if (validToken !== token) {
      throw new UnauthorizedException('账号已在其他地方登录');
    }

    const isValidUser = await this.userService.validateUser(payload.userName);
    if (!isValidUser) {
      throw new UnauthorizedException('用户不存在或账号已被禁用');
    }

    return payload;
  }
}
