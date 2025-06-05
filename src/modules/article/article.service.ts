import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
import { ARTICLE_VISIBILITY } from 'src/common/config/dictionary';
import { CreateArticleDto } from './dto/create-article.dto';

@Injectable()
export class ArticleService {
  constructor(private readonly prismaService: PrismaService) {}

  findArticleVisibility() {
    const keys = Object.keys(
      ARTICLE_VISIBILITY,
    ) as (keyof typeof ARTICLE_VISIBILITY)[];

    return keys.map((key) => {
      return {
        label: ARTICLE_VISIBILITY[key],
        value: key,
      };
    });
  }

  async create(userId: string, data: CreateArticleDto) {
    const {
      title,
      categoryId,
      visibility,
      content,
      coverImage,
      summary,
      theme,
      published,
      featured,
    } = data;

    const category = await this.prismaService.category.findUnique({
      where: {
        id: categoryId,
        deleted: false,
      },
      select: {
        id: true,
      },
    });

    if (!category?.id) {
      throw new BadRequestException('分类不存在');
    }

    await this.prismaService.article.create({
      data: {
        title,
        content,
        visibility,
        coverImage,
        summary,
        theme,
        published,
        featured,
        user: {
          connect: {
            id: userId,
          },
        },
        category: {
          connect: {
            id: categoryId,
          },
        },
      },
    });
  }
}
