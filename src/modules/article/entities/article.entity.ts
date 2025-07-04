import { Article } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class ArticleEntity
  implements
    Omit<
      Article,
      'deleted' | 'createdAt' | 'updatedAt' | 'authorId' | 'publishedAt'
    >
{
  @ApiProperty({ description: '文章ID' })
  id: number;

  @ApiProperty({ description: '文章标题' })
  title: string;

  @ApiProperty({ description: '文章内容' })
  content: string;

  @ApiProperty({
    description: '可见性',
    enum: ['PRIVATE', 'INTERNAL', 'PUBLIC'],
  })
  visibility: string;

  @ApiProperty({ description: '封面地址', required: false })
  coverImage: string;

  @ApiProperty({ description: '文章摘要', required: false })
  summary: string;

  @ApiProperty({ description: '主题', required: false })
  theme: string;

  @ApiProperty({ description: '是否已发布', default: false })
  published: boolean;

  @ApiProperty({ description: '是否置顶', default: false })
  featured: boolean;

  @ApiProperty({ description: '文章分类 ID' })
  categoryId: number;

  @ApiProperty({ description: '文章分类名称' })
  categoryName: string;

  @ApiProperty({ description: '作者用户名' })
  author: string;

  @ApiProperty({ description: '文章浏览量', default: 0 })
  viewCount: number;

  @ApiProperty({ description: '文章点赞量', default: 0 })
  likeCount: number;

  @ApiProperty({ description: '文章评论量', default: 0 })
  commentCount: number;

  @ApiProperty({ description: '发布时间(UTC)', required: false })
  publishedAt: string;

  @ApiProperty({ description: '更新时间(UTC)' })
  updatedAt: string;
}
