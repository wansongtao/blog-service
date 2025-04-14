import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
import { CreateCategoryDto } from './dto/create-category.dto';

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
}
