import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
import { QueryRoleDto } from './dto/query-role.dto';
import { Prisma } from '@prisma/client';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { RedisService } from 'src/redis/redis.service';
import { ConfigService } from '@nestjs/config';
import { getBaseConfig } from 'src/common/config';
import { IPayload } from 'src/common/types';
@Injectable()
export class RoleService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
  ) {}

  async findUserPermission(userId: string) {
    const permissions = await this.prismaService.$queryRaw<
      {
        user_name: string;
        permissions: number[];
      }[]
    >`
      WITH user_permissions AS (
        SELECT u.user_name,
          ARRAY_AGG(DISTINCT pe.id) FILTER (WHERE pe.id IS NOT NULL) AS permissions
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

    return permissions[0]?.permissions.map((v) => Number(v)) || [];
  }

  async findAll(queryRoleDto: QueryRoleDto) {
    const {
      keyword,
      disabled,
      page = 1,
      pageSize = 10,
      sort = 'desc',
      beginTime,
      endTime,
    } = queryRoleDto;

    const whereCondition: Prisma.RoleWhereInput = {
      disabled: disabled,
      deleted: false,
      name: {
        contains: keyword,
        mode: 'insensitive',
      },
      createdAt: {
        gte: beginTime,
        lte: endTime,
      },
    };

    const results = await this.prismaService.$transaction([
      this.prismaService.role.findMany({
        where: whereCondition,
        select: {
          id: true,
          name: true,
          description: true,
          disabled: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: {
          createdAt: sort,
        },
        take: pageSize,
        skip: (page - 1) * pageSize,
      }),
      this.prismaService.role.count({ where: whereCondition }),
    ]);

    return {
      list: results[0].map((item) => ({
        ...item,
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
      })),
      total: results[1],
    };
  }

  async create(createRoleDto: CreateRoleDto, user) {
    const role = await this.prismaService.role.findUnique({
      where: {
        name: createRoleDto.name,
      },
      select: {
        id: true,
      },
    });
    if (role) {
      throw new BadRequestException('该角色已存在');
    }

    const data: Prisma.RoleCreateInput = {
      name: createRoleDto.name,
      description: createRoleDto.description,
      disabled: createRoleDto.disabled,
    };
    if (createRoleDto.permissions?.length) {
      // 非默认管理员角色，赋予角色的权限不能超出自身拥有的权限范围
      const defaultAdmin = getBaseConfig(this.configService).defaultAdmin;
      if (defaultAdmin.username !== user.userName) {
        const userPermissions = await this.findUserPermission(user.userId);
        if (
          createRoleDto.permissions.some(
            (permission) => !userPermissions.includes(permission),
          )
        ) {
          throw new BadRequestException('没有权限进行此操作');
        }
      }

      data.permissionInRole = {
        create: createRoleDto.permissions.map((permissionId) => ({
          permissionId,
        })),
      };
    }

    await this.prismaService.role.create({
      data,
    });
  }

  async findOne(id: number) {
    const role = await this.prismaService.role.findUnique({
      where: {
        id,
        deleted: false,
      },
      include: {
        permissionInRole: {
          where: {
            permissions: {
              deleted: false,
            },
          },
          select: {
            permissionId: true,
          },
        },
      },
    });

    if (!role) {
      throw new BadRequestException('该角色不存在');
    }

    const permissions = role.permissionInRole.map(
      (roleInPermission) => roleInPermission.permissionId,
    );

    return {
      id: role.id,
      name: role.name,
      description: role.description,
      disabled: role.disabled,
      permissions,
    };
  }

  async update(id: number, updateRoleDto: UpdateRoleDto, user: IPayload) {
    if (updateRoleDto.name) {
      const roleInfo = await this.prismaService.role.findUnique({
        where: {
          name: updateRoleDto.name,
        },
      });

      if (roleInfo?.id) {
        throw new BadRequestException('该角色名称已存在');
      }
    }

    const roleAndUser = await this.prismaService.role.findUnique({
      where: {
        id,
        deleted: false,
      },
      include: {
        roleInUser: {
          select: {
            userId: true,
          },
          where: {
            users: {
              disabled: false,
              deleted: false,
            },
          },
        },
      },
    });
    if (!roleAndUser) {
      throw new BadRequestException('角色不存在');
    }

    const defaultAdmin = getBaseConfig(this.configService).defaultAdmin;
    if (roleAndUser.name === defaultAdmin.role) {
      throw new BadRequestException('默认管理员角色不允许修改');
    }

    if (roleAndUser.roleInUser?.length) {
      if (updateRoleDto.disabled) {
        throw new BadRequestException('该角色已被用户使用，不能禁用');
      }

      if (updateRoleDto.permissions !== undefined) {
        const userIds = roleAndUser.roleInUser.map((item) => {
          return item.userId;
        });

        userIds.forEach((userId) => {
          this.redisService.userPermissions(userId).remove();
        });
      }
    }

    const data: Prisma.RoleUpdateInput = {
      name: updateRoleDto.name,
      description: updateRoleDto.description,
      disabled: updateRoleDto.disabled,
    };
    if (updateRoleDto.permissions !== undefined) {
      data.permissionInRole = {
        deleteMany: {},
      };

      if (updateRoleDto.permissions.length) {
        // 非默认管理员角色，赋予角色的权限不能超出自身拥有的权限范围
        if (defaultAdmin.username !== user.userName) {
          const userPermissions = await this.findUserPermission(
            user.userId,
          );
          if (
            updateRoleDto.permissions.some((permission) =>
              !userPermissions.includes(permission),
            )
          ) {
            throw new BadRequestException('没有权限进行此操作');
          }
        }

        data.permissionInRole.create = updateRoleDto.permissions.map(
          (permissionId) => ({
            permissionId,
          }),
        );
      }
    }

    await this.prismaService.role.update({
      where: {
        id,
      },
      data,
    });
  }

  async remove(id: number) {
    const roleAndUser = await this.prismaService.role.findUnique({
      where: {
        id,
        deleted: false,
      },
      include: {
        roleInUser: {
          select: {
            userId: true,
          },
          where: {
            users: {
              deleted: false,
            },
          },
        },
      },
    });
    if (!roleAndUser) {
      throw new BadRequestException('角色不存在');
    }

    if (roleAndUser.roleInUser?.length) {
      throw new BadRequestException('该角色已被用户使用，不允许删除');
    }

    await this.prismaService.role.update({
      where: {
        id,
      },
      data: {
        deleted: true,
      },
    });
  }

  findRoleTree(user: IPayload) {
    const adminUserName = getBaseConfig(this.configService).defaultAdmin
      .username;

    // If the user is not the admin, return only roles assigned to the user
    if (user.userName !== adminUserName) {
      return this.prismaService.role.findMany({
        where: {
          deleted: false,
          disabled: false,
          roleInUser: {
            some: {
              userId: user.userId,
            },
          },
        },
        select: {
          id: true,
          name: true,
        },
      });
    }

    return this.prismaService.role.findMany({
      where: {
        deleted: false,
        disabled: false,
      },
      select: {
        id: true,
        name: true,
      },
    });
  }
}
