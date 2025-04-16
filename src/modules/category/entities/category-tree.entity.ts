import { ApiProperty, PickType } from '@nestjs/swagger';
import { CategoryEntity } from './category.entity';

export class CategoryTreeEntity extends PickType(CategoryEntity, [
  'id',
  'name',
  'pid',
]) {
  @ApiProperty({
    description: '子分类',
    required: false,
    default: [],
    type: [CategoryTreeEntity],
  })
  children?: CategoryTreeEntity[];
}
