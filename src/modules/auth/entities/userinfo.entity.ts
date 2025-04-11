import { ApiProperty, OmitType } from '@nestjs/swagger';
import { PermissionEntity } from 'src/modules/permission/entities/permission.entity';

class MenuEntity extends OmitType(PermissionEntity, [
  'createdAt',
  'updatedAt',
  'disabled',
  'permission',
  'sort',
  'type',
]) {
  @ApiProperty({
    description: '子菜单',
    type: () => [MenuEntity],
    required: false,
    default: [],
  })
  children?: MenuEntity[];
}

export class UserInfoEntity {
  @ApiProperty({ description: '用户名/昵称' })
  name: string;

  @ApiProperty({ description: '用户头像', required: false })
  avatar?: string;

  @ApiProperty({
    description: '用户角色',
    required: false,
  })
  roles?: string[];

  @ApiProperty({
    description: '用户权限',
    required: false,
  })
  permissions?: string[];

  @ApiProperty({
    description: '用户可访问菜单',
    type: () => [MenuEntity],
    required: false,
  })
  menus?: MenuEntity[];
}
