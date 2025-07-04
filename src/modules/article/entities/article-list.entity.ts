import { ApiProperty, OmitType } from '@nestjs/swagger';
import { ArticleEntity } from './article.entity';

export class ArticleList extends OmitType(ArticleEntity, [
  'content',
  'commentCount',
  'likeCount',
  'viewCount',
  'categoryId',
  'theme',
]) {}

export class ArticleListEntity {
  @ApiProperty({ description: '总数' })
  total: number;

  @ApiProperty({ description: '文章列表', type: [ArticleList] })
  list: ArticleList[];
}
