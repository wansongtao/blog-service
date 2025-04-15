import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
import { CreateCategoryDto } from './dto/create-category.dto';
import { QueryCategoryDto } from './dto/query-category.dto';
import { generateMenus } from 'src/common/utils';

@Injectable()
export class CategoryService {
  constructor(private readonly prismaService: PrismaService) {}

  async create(createCategoryDto: CreateCategoryDto) {
    const { name, pid } = createCategoryDto;
    const existingCategory = await this.prismaService.category.findMany({
      where: {
        OR: [
          {
            id: pid,
          },
          {
            name: name,
          },
        ],
        deleted: false,
      },
      select: {
        name: true,
        id: true,
      },
    });

    if (pid && !existingCategory?.length) {
      throw new BadRequestException('Parent category does not exist');
    }

    if (existingCategory?.length > 1) {
      throw new BadRequestException('Category name already exists');
    }

    if (existingCategory?.length) {
      if (pid) {
        const hasSamePid = existingCategory.some(
          (category) => category.id === pid,
        );
        if (!hasSamePid) {
          throw new BadRequestException('Parent category does not exist');
        }
      }

      const hasSameName = existingCategory.some(
        (category) => category.name === name && category.id !== pid,
      );
      if (hasSameName) {
        throw new BadRequestException('Category name already exists');
      }
    }

    await this.prismaService.category.create({
      data: createCategoryDto,
    });
  }

  async findAll(query: QueryCategoryDto) {
    const {
      keyword,
      page = 1,
      pageSize = 10,
      sort = 'desc',
      beginTime,
      endTime,
    } = query;

    const categories = await this.prismaService.category.findMany({
      where: {
        deleted: false,
        name: {
          contains: keyword,
          mode: 'insensitive',
        },
        createdAt: {
          gte: beginTime,
          lte: endTime,
        },
      },
      orderBy: [
        {
          sort: 'desc',
        },
        {
          createdAt: sort,
        },
      ],
      select: {
        id: true,
        name: true,
        description: true,
        hidden: true,
        pid: true,
        sort: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const offset = (page - 1) * pageSize;
    if (categories.length < offset) {
      return { list: [], total: 0 };
    }

    const tree = generateMenus(
      categories.map((item) => {
        return {
          ...item,
          createdAt: item.createdAt.toISOString(),
          updatedAt: item.updatedAt.toISOString(),
        };
      }),
    );
    if (tree.length < offset) {
      return { list: [], total: 0 };
    }
    const total = tree.length;
    const list = tree.slice(offset, offset + pageSize);
    return { list, total };
  }
}
