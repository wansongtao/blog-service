import { ApiProperty, PickType } from '@nestjs/swagger';
import { PermissionEntity } from './permission.entity';

export class PermissionTreeEntity extends PickType(PermissionEntity, [
  'id',
  'pid',
  'name',
  'type',
  'disabled',
]) {
  @ApiProperty({
    description: '子权限',
    required: false,
    default: [],
    type: [PermissionTreeEntity],
  })
  children?: PermissionTreeEntity[];
}
