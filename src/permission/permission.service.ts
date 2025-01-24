import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
import { QueryPermissionDto } from './dto/query-permission.dto';
import { generateMenus } from 'src/common/utils';
import { Prisma } from '@prisma/client';
import { CreatePermissionDto } from './dto/create-permission.dto';

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
}
