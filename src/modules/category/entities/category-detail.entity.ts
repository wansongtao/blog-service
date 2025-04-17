import { OmitType } from '@nestjs/swagger';
import { CategoryEntity } from './category.entity';

export class CategoryDetailEntity extends OmitType(CategoryEntity, [
  'id',
  'createdAt',
  'updatedAt',
]) {}
