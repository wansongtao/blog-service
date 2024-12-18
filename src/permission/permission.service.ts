import { Injectable } from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';

@Injectable()
export class PermissionService {
  constructor(private readonly prismaService: PrismaService) {}

  async findPermission(userId: string) {
    const permissions = await this.prismaService.$queryRaw<
      {
        user_name: string;
        permissions: string[];
      }[]
    >`
      WITH user_permissions AS (
        SELECT u.user_name,
          ARRAY_AGG(DISTINCT pe.permission) FILTER (WHERE pe.permission IS NOT NULL) AS permissions
        FROM users u
          LEFT JOIN role_in_user ur ON u.id = ur.user_id
          LEFT JOIN roles r ON ur.role_id = r.id AND r.deleted = false AND r.disabled = false
          LEFT JOIN role_in_permission rp ON r.id = rp.role_id
          LEFT JOIN permissions pe ON rp.permission_id = pe.id AND pe.deleted = false AND pe.disabled = false
        WHERE u.id = ${userId} AND u.deleted = false AND u.disabled = false
        GROUP BY u.user_name
      )
      SELECT * FROM user_permissions;
    `;

    return permissions[0]?.permissions || [];
  }
}
