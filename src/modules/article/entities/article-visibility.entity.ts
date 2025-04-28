import { ApiProperty } from '@nestjs/swagger';

export class ArticleVisibilityEntity {
  @ApiProperty({ description: '文章可见性描述' })
  label: string;

  @ApiProperty({ description: '文章可见性' })
  value: string;
}
