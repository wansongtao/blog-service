import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AUTHORITY_KEY } from '../decorator/authority.decorator';
import { RedisService } from 'src/redis/redis.service';
import { ConfigService } from '@nestjs/config';
import { getBaseConfig } from 'src/common/config';
import { PermissionService } from 'src/modules/permission/permission.service';

import { IPayload } from '../types';

@Injectable()
export class AuthorityGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
    private readonly permissionService: PermissionService,
  ) {}

  async canActivate(context: ExecutionContext) {
    const needPermissions = this.reflector.get<string[]>(
      AUTHORITY_KEY,
      context.getHandler(),
    );
    if (!needPermissions) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user: IPayload = request.user;

    const { defaultAdmin } = getBaseConfig(this.configService);
    if (user.userName === defaultAdmin.username) {
      return true;
    }

    const permissions = await this.redisService
      .userPermissions(user.userId)
      .get();
    if (
      permissions.some((permission) => needPermissions.includes(permission))
    ) {
      return true;
    }

    const userPermissions = await this.permissionService.findPermission(
      user.userId,
    );
    if (userPermissions.length) {
      this.redisService.userPermissions(user.userId).set(userPermissions);
    }
    if (
      userPermissions.some((permission) => needPermissions.includes(permission))
    ) {
      return true;
    }

    return false;
  }
}
