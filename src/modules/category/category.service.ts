import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
import { CreateCategoryDto } from './dto/create-category.dto';
import { QueryCategoryDto } from './dto/query-category.dto';
import { generateMenus, deepFindItem } from 'src/common/utils';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Prisma } from '@prisma/client';

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

  async findTree() {
    const categories = await this.prismaService.category.findMany({
      where: {
        deleted: false,
      },
      orderBy: {
        sort: 'desc',
      },
      select: {
        id: true,
        pid: true,
        name: true,
      },
    });

    const tree = generateMenus(categories);
    return tree;
  }

  findOne(id: number) {
    return this.prismaService.category.findUnique({
      where: {
        deleted: false,
        id,
      },
      select: {
        pid: true,
        name: true,
        sort: true,
        hidden: true,
        description: true,
      },
    });
  }

  async update(id: number, data: UpdateCategoryDto) {
    const { name, pid } = data;

    if (pid) {
      if (pid === id) {
        throw new BadRequestException('Parent category cannot be itself');
      }

      const allCategory = await this.prismaService.category.findMany({
        where: { deleted: false },
        select: {
          id: true,
          pid: true,
          name: true,
        },
      });

      if (!allCategory.length || allCategory.every((v) => v.id !== id)) {
        throw new BadRequestException('Category does not exist');
      }
      if (allCategory.every((v) => v.id !== pid)) {
        throw new BadRequestException('Parent category does not exist');
      }
      if (name && allCategory.some((v) => v.name === name)) {
        throw new BadRequestException('Category name already exists');
      }

      const categoryTree = generateMenus(allCategory);
      const own = deepFindItem(categoryTree, (v) => v.id === id);
      if (
        own.children?.length &&
        deepFindItem(own.children, (v) => v.id === pid)
      ) {
        throw new BadRequestException(
          'Parent category cannot be a child of itself',
        );
      }
    } else {
      const whereCondition: Prisma.CategoryWhereInput = {
        deleted: false,
        OR: [{ id }],
      };
      if (name) {
        whereCondition.OR.push({ name });
      }

      const categories = await this.prismaService.category.findMany({
        where: whereCondition,
        select: {
          id: true,
          name: true,
        },
      });

      if (!categories.length || categories.every((v) => v.id !== id)) {
        throw new BadRequestException('Category does not exist');
      }
      if (name && categories.some((v) => v.name === name)) {
        throw new BadRequestException('Category name already exists');
      }
    }

    await this.prismaService.category.update({
      where: {
        id,
      },
      data,
    });
  }

  async remove(id: number) {
    const category = await this.prismaService.category.findUnique({
      where: {
        id,
        deleted: false,
      },
      select: {
        id: true,
        children: {
          select: { id: true },
        },
      },
    });

    if (!category) {
      throw new BadRequestException('Category does not exist');
    }

    if (category.children?.length) {
      throw new BadRequestException('Parent category cannot be deleted');
    }

    await this.prismaService.category.update({
      where: { id },
      data: { deleted: true },
    });
  }
}
