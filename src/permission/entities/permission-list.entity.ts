import { ApiProperty, OmitType } from '@nestjs/swagger';
import { PermissionEntity } from './permission.entity';

export class PermissionList extends OmitType(PermissionEntity, [
  'redirect',
  'hidden',
  'cache',
  'props',
  'component',
  'createdAt',
  'updatedAt',
] as const) {
  @ApiProperty({ description: '创建时间(UTC)' })
  createdAt: string;

  @ApiProperty({
    description: '子菜单',
    required: false,
    default: [],
    type: [PermissionList],
  })
  children?: PermissionList[];
}

export class PermissionListEntity {
  @ApiProperty({ description: '总数' })
  total: number;

  @ApiProperty({ description: '权限列表', type: [PermissionList] })
  list: PermissionList[];
}
