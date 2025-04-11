import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
import { QueryRoleDto } from './dto/query-role.dto';
import { Prisma } from '@prisma/client';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { RedisService } from 'src/redis/redis.service';

@Injectable()
export class RoleService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly redisService: RedisService,
  ) {}

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

  async create(createRoleDto: CreateRoleDto) {
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

  async update(id: number, updateRoleDto: UpdateRoleDto) {
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

  findRoleTree() {
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
