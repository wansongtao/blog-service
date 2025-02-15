import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
import { QueryRoleDto } from './dto/query-role.dto';
import { Prisma } from '@prisma/client';
import { CreateRoleDto } from './dto/create-role.dto';

@Injectable()
export class RoleService {
  constructor(private readonly prismaService: PrismaService) {}

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
}
