import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
import { QueryPermissionDto } from './dto/query-permission.dto';
import { generateMenus } from 'src/common/utils';
import { Prisma } from '@prisma/client';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { RedisService } from 'src/redis/redis.service';

@Injectable()
export class PermissionService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly redisService: RedisService,
  ) {}

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

  async findAll(query: QueryPermissionDto) {
    const {
      keyword,
      disabled,
      type,
      page = 1,
      pageSize = 10,
      sort = 'desc',
      beginTime,
      endTime,
    } = query;

    const permissions = await this.prismaService.permission.findMany({
      where: {
        deleted: false,
        name: {
          contains: keyword,
          mode: 'insensitive',
        },
        disabled,
        type,
        createdAt: {
          gte: beginTime,
          lte: endTime,
        },
      },
      select: {
        id: true,
        pid: true,
        name: true,
        type: true,
        permission: true,
        icon: true,
        path: true,
        sort: true,
        disabled: true,
        createdAt: true,
      },
      orderBy: [
        {
          sort: 'desc',
        },
        {
          createdAt: sort,
        },
      ],
    });

    const offset = (page - 1) * pageSize;
    if (permissions.length < offset) {
      return { list: [], total: 0 };
    }

    const permissionTree = generateMenus(
      permissions.map((item) => {
        return {
          ...item,
          createdAt: item.createdAt.toISOString(),
        };
      }),
    );
    if (permissionTree.length < offset) {
      return { list: [], total: 0 };
    }
    const total = permissionTree.length;
    const list = permissionTree.slice(offset, offset + pageSize);
    return { list, total };
  }

  async findTree(containButton = false) {
    const whereCondition: Prisma.PermissionWhereInput = {
      deleted: false,
    };
    if (!containButton) {
      whereCondition.type = {
        not: 'BUTTON',
      };
    }

    const permissions = await this.prismaService.permission.findMany({
      where: whereCondition,
      select: {
        id: true,
        pid: true,
        name: true,
        type: true,
        disabled: true,
      },
      orderBy: {
        sort: 'desc',
      },
    });

    const tree = generateMenus(permissions);
    return tree;
  }

  async create(createDto: CreatePermissionDto) {
    if (createDto.type !== 'BUTTON' && !createDto.path) {
      throw new BadRequestException('目录/菜单的路径不能为空');
    }

    if (createDto.type === 'MENU' && !createDto.component) {
      throw new BadRequestException('菜单的组件地址不能为空');
    }

    if (createDto.type === 'BUTTON' && !createDto.permission) {
      throw new BadRequestException('按钮的权限标识不能为空');
    }

    const permission = await this.prismaService.permission.findFirst({
      where: {
        OR: [
          {
            id: createDto.pid,
          },
          {
            name: createDto.name,
          },
          {
            permission: createDto.permission,
          },
        ],
        deleted: false,
      },
      select: {
        type: true,
        name: true,
        permission: true,
      },
    });

    if (!permission && createDto.pid) {
      throw new BadRequestException('父权限不存在');
    }

    if (permission) {
      if (permission.name === createDto.name) {
        throw new BadRequestException('权限名称已存在');
      }

      if (
        createDto.permission &&
        permission.permission === createDto.permission
      ) {
        throw new BadRequestException('权限标识已存在');
      }

      if (permission.type === 'BUTTON') {
        throw new BadRequestException('按钮权限不能添加子权限');
      }
    }

    await this.prismaService.permission.create({
      data: createDto,
    });
  }

  findOne(id: number) {
    return this.prismaService.permission.findUnique({
      where: {
        id,
        deleted: false,
      },
      select: {
        pid: true,
        name: true,
        type: true,
        path: true,
        permission: true,
        icon: true,
        cache: true,
        props: true,
        hidden: true,
        component: true,
        disabled: true,
        redirect: true,
        sort: true,
      },
    });
  }

  async update(id: number, updateDto: UpdatePermissionDto) {
    const permission = await this.prismaService.permission.findUnique({
      where: { id, deleted: false },
      include: {
        permissionInRole: {
          where: {
            roles: {
              deleted: false,
            },
          },
          include: {
            roles: {
              include: {
                roleInUser: {
                  select: {
                    userId: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!permission) {
      throw new BadRequestException('权限不存在');
    }

    if (permission.permissionInRole.length > 0) {
      const sensitiveFields = ['type', 'permission', 'pid'];
      const hasChangeSensitiveField = sensitiveFields.some(
        (field) => updateDto[field] && updateDto[field] !== permission[field],
      );

      if (hasChangeSensitiveField) {
        throw new BadRequestException(
          '该权限已被角色使用，不能修改类型、权限标识、父权限',
        );
      }
    }

    const safeFields = [
      'name',
      'icon',
      'sort',
      'path',
      'component',
      'hidden',
      'disabled',
      'cache',
      'redirect',
      'props',
    ];
    const updateData: UpdatePermissionDto = Object.keys(updateDto)
      .filter((key) => safeFields.includes(key))
      .reduce(
        (acc, key) => ({
          ...acc,
          [key]: updateDto[key],
        }),
        {},
      );

    // 如果禁用了权限，删除用户的权限缓存
    if (updateData.disabled === false) {
      const userIds = permission.permissionInRole.flatMap((item) => {
        return item.roles.roleInUser.map((item) => item.userId);
      });

      userIds.forEach((userId) => {
        this.redisService.delUserPermission(userId);
      });
    }

    await this.prismaService.permission.update({
      where: { id },
      data: updateData,
    });
  }

  async remove(id: number) {
    const permission = await this.prismaService.permission.findUnique({
      where: { id, deleted: false },
      include: {
        permissionInRole: {
          where: {
            roles: {
              deleted: false,
            },
          },
        },
        children: {
          where: {
            deleted: false,
          },
        },
      },
    });

    if (!permission) {
      throw new BadRequestException('权限不存在');
    }

    if (permission.permissionInRole.length > 0) {
      throw new BadRequestException('该权限已被角色使用，不能删除');
    }

    if (permission.children.length > 0) {
      throw new BadRequestException('该权限下存在子权限，不能删除');
    }

    await this.prismaService.permission.update({
      where: { id },
      data: {
        deleted: true,
      },
    });
  }

  async batchRemove(ids: number[]) {
    const permissions = await this.prismaService.permission.findMany({
      where: {
        id: {
          in: ids,
        },
        deleted: false,
      },
      select: {
        id: true,
        permissionInRole: {
          where: {
            roles: {
              deleted: false,
            },
          },
        },
        children: {
          where: {
            deleted: false,
          },
        },
      },
    });

    const canRemovePermissions = permissions.filter((item) => {
      return item.permissionInRole.length === 0 && item.children.length === 0;
    });

    if (canRemovePermissions.length < ids.length) {
      throw new BadRequestException(
        '部分权限已被角色使用或存在子权限，不能删除',
      );
    }

    await this.prismaService.permission.updateMany({
      where: {
        id: {
          in: ids,
        },
      },
      data: {
        deleted: true,
      },
    });
  }
}
