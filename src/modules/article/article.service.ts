import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
import { ARTICLE_VISIBILITY } from 'src/common/config/dictionary';
import { CreateArticleDto } from './dto/create-article.dto';
import { QueryArticleDto } from './dto/query-article.dto';
import { ConfigService } from '@nestjs/config';
import { getBaseConfig } from 'src/common/config';

import { Prisma } from '@prisma/client';
import { UpdateArticleDto } from './dto/update-article.dto';
import { IPayload } from 'src/common/types';

@Injectable()
export class ArticleService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly configService: ConfigService,
  ) {}

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
        publishedAt: published ? new Date() : null,
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

  async findAll(userId: string, queryDto: QueryArticleDto) {
    const {
      keyword,
      visibility,
      categoryId,
      published,
      featured,
      page = 1,
      pageSize = 10,
      sort = 'desc',
      beginTime,
      endTime,
    } = queryDto;

    // Base conditions
    const whereCondition: Prisma.ArticleWhereInput = {
      deleted: false,
      ...(keyword && {
        OR: [
          { title: { contains: keyword, mode: 'insensitive' } },
          { summary: { contains: keyword, mode: 'insensitive' } },
        ],
      }),
      ...(beginTime && { updatedAt: { gte: beginTime, lte: endTime } }),
      ...(published !== undefined && { published }),
      ...(featured !== undefined && { featured }),
      ...(categoryId && { categoryId }),
    };

    // Handle visibility logic
    if (visibility === 'PRIVATE') {
      // For private articles, only show user's own
      whereCondition.visibility = 'PRIVATE';
      whereCondition.authorId = userId;
    } else if (visibility) {
      // For specific non-private visibility
      whereCondition.visibility = visibility;
    } else {
      // Default: show all articles visible to user
      whereCondition.OR = [
        { authorId: userId }, // All user's articles
        { visibility: { not: 'PRIVATE' } }, // Public articles from others
      ];
    }

    const results = await this.prismaService.$transaction([
      this.prismaService.article.findMany({
        where: whereCondition,
        select: {
          id: true,
          title: true,
          visibility: true,
          coverImage: true,
          summary: true,
          published: true,
          featured: true,
          publishedAt: true,
          updatedAt: true,
          category: {
            select: {
              name: true,
            },
          },
          user: {
            select: {
              userName: true,
            },
          },
        },
        orderBy: {
          updatedAt: sort,
        },
        take: pageSize,
        skip: (page - 1) * pageSize,
      }),
      this.prismaService.article.count({ where: whereCondition }),
    ]);

    return {
      list: results[0].map((item) => ({
        ...item,
        publishedAt: item.publishedAt?.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
        categoryName: item.category.name,
        author: item.user.userName,
      })),
      total: results[1],
    };
  }

  async findOne(userId: string, id: number) {
    const article = await this.prismaService.article.findUnique({
      where: {
        id,
        deleted: false,
        OR: [
          { authorId: userId }, // User's own articles
          { visibility: { not: 'PRIVATE' } }, // Public articles from others
        ],
      },
      select: {
        id: true,
        title: true,
        content: true,
        visibility: true,
        coverImage: true,
        summary: true,
        theme: true,
        published: true,
        featured: true,
        publishedAt: true,
        updatedAt: true,
        commentCount: true,
        likeCount: true,
        viewCount: true,
        categoryId: true,
        category: {
          select: {
            name: true,
          },
        },
        user: {
          select: {
            userName: true,
          },
        },
      },
    });

    if (!article) {
      throw new BadRequestException('文章不存在');
    }

    const results = {
      ...article,
      categoryName: article.category.name,
      author: article.user.userName,
      publishedAt: article.publishedAt?.toISOString(),
      updatedAt: article.updatedAt.toISOString(),
    };

    results.user = undefined;
    results.category = undefined;
    return results;
  }

  async update(userId: string, id: number, dto: UpdateArticleDto) {
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
    } = dto;

    const article = await this.prismaService.article.findUnique({
      where: { id, deleted: false },
      select: {
        id: true,
        authorId: true,
      },
    });

    if (!article) {
      throw new BadRequestException('文章不存在');
    }

    if (
      article.authorId !== userId &&
      (title || content || coverImage || summary || theme || visibility)
    ) {
      throw new BadRequestException('无权限修改此文章内容');
    }

    if (categoryId) {
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
    }

    const data: Prisma.ArticleUpdateInput = {
      title,
      content,
      visibility,
      coverImage,
      summary,
      theme,
      published,
      featured,
    };
    if (categoryId) {
      data.category = {
        connect: {
          id: categoryId,
        },
      };
    }
    if (published) {
      data.publishedAt = new Date();
    } else {
      data.publishedAt = null;
    }

    await this.prismaService.article.update({
      where: { id },
      data,
    });
  }

  async remove(user: IPayload, id: number) {
    const article = await this.prismaService.article.findUnique({
      where: { id, deleted: false },
      select: {
        id: true,
        authorId: true,
      },
    });

    if (!article) {
      throw new BadRequestException('文章不存在');
    }

    if (
      article.authorId !== user.userId &&
      user.userName !== getBaseConfig(this.configService).defaultAdmin.username
    ) {
      throw new BadRequestException('无权限删除此文章');
    }

    await this.prismaService.article.update({
      where: { id },
      data: { deleted: true },
    });
  }
}
