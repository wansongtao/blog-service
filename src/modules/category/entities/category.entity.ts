import { Category } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class CategoryEntity
  implements Omit<Category, 'deleted' | 'updatedAt' | 'createdAt'>
{
  @ApiProperty({ description: '分类ID' })
  id: number;

  @ApiProperty({ description: '父类ID', default: null })
  pid: number;

  @ApiProperty({ description: '分类名称' })
  name: string;

  @ApiProperty({ description: '分类描述' })
  description: string;

  @ApiProperty({ description: '排序' })
  sort: number;

  @ApiProperty({ description: '隐藏分类', default: false })
  hidden: boolean;

  @ApiProperty({ description: '创建时间(UTC)' })
  createdAt: string;

  @ApiProperty({ description: '更新时间(UTC)' })
  updatedAt: string;
}
