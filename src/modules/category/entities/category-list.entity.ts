import { ApiProperty } from '@nestjs/swagger';
import { CategoryEntity } from './category.entity';

class CategoryList extends CategoryEntity {
  @ApiProperty({
    description: '子菜单',
    required: false,
    default: [],
    type: [CategoryList],
  })
  children?: CategoryList[];
}

export class CategoryListEntity {
  @ApiProperty({ description: '总数' })
  total: number;

  @ApiProperty({ description: '分类列表', type: [CategoryList] })
  list: CategoryList[];
}
