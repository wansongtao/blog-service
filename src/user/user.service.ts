import { Injectable } from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
import { UserPermissionInfoEntity } from './entities/user-permission-info.entity';

@Injectable()
export class UserService {
  constructor(private readonly prismaService: PrismaService) {}

  async findUser(userName: string): Promise<{
    id: string;
    userName: string;
    password: string;
    disabled: boolean;
  } | null> {
    const user = await this.prismaService.user.findUnique({
      where: { userName, deleted: false },
      select: { id: true, userName: true, password: true, disabled: true },
    });

    return user;
  }

  async findUserPermissionInfo(id: string) {
    return await this.prismaService.$queryRaw<UserPermissionInfoEntity[]>`
      WITH filtered_users AS (
        SELECT u.id, u.user_name, p.avatar, p.nick_name
        FROM users u
            LEFT JOIN profiles p ON u.id = p.user_id
        WHERE u.id = ${id} and u.deleted = false and u.disabled = false
      ),
      user_roles AS (
        SELECT ur.user_id, 
        STRING_AGG(r.name, ','ORDER BY r.name) AS role_names, 
        ARRAY_AGG(r.id) AS role_ids
        FROM filtered_users fu
        LEFT JOIN role_in_user ur ON fu.id = ur.user_id
        LEFT JOIN roles r ON ur.role_id = r.id
        WHERE r.disabled = false
        GROUP BY ur.user_id
      ),
      role_permissions AS (
        SELECT DISTINCT
            ur.user_id, p.pid, p.id, p.name, p.path, p.permission, p.type, p.icon, 
            p.component, p.redirect, p.hidden, p.sort, p.cache, p.props
        FROM user_roles ur
          JOIN role_in_permission rp ON rp.role_id = ANY (ur.role_ids)
          JOIN permissions p ON rp.permission_id = p.id AND p.disabled = false
      )
      SELECT fu.user_name, fu.nick_name, fu.avatar, ur.role_names, rp.pid,
      rp.id, rp.name, rp.path, rp.permission, rp.type, rp.icon, rp.component, rp.redirect, rp.hidden, 
      rp.sort, rp.cache, rp.props
      FROM filtered_users fu
        LEFT JOIN user_roles ur ON fu.id = ur.user_id
        LEFT JOIN role_permissions rp ON fu.id = rp.user_id
      ORDER BY rp.sort DESC;
    `;
  }
}
