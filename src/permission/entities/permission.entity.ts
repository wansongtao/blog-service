import { Permission } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class PermissionEntity
  implements Omit<Permission, 'deleted' | 'updatedAt' | 'createdAt'>
{
  @ApiProperty({ description: '权限ID' })
  id: number;

  @ApiProperty({ description: '父权限ID', default: null })
  pid: number;

  @ApiProperty({ description: '权限名称' })
  name: string;

  @ApiProperty({ description: '权限路径' })
  path: string;

  @ApiProperty({
    description: '权限类型',
    enum: ['DIRECTORY', 'MENU', 'BUTTON'],
  })
  type: Permission['type'];

  @ApiProperty({ description: '权限标识' })
  permission: string;

  @ApiProperty({ description: '组件路径' })
  component: string;

  @ApiProperty({ description: '图标' })
  icon: string;

  @ApiProperty({ description: '排序' })
  sort: number;

  @ApiProperty({ description: '重定向地址' })
  redirect: string;

  @ApiProperty({ description: '是否隐藏', default: false })
  hidden: boolean;

  @ApiProperty({ description: '是否缓存', default: false })
  cache: boolean;

  @ApiProperty({ description: '是否禁用', default: false })
  disabled: boolean;

  @ApiProperty({
    description: 'vue-router 的 props 属性',
    default: false,
  })
  props: boolean;

  @ApiProperty({ description: '创建时间(UTC)' })
  createdAt: string;

  @ApiProperty({ description: '更新时间(UTC)' })
  updatedAt: string;
}
