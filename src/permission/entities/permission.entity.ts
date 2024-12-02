import { Permission } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class PermissionEntity implements Omit<Permission, 'deleted'> {
  @ApiProperty({ description: '权限ID', type: 'number' })
  id: Permission['id'];

  @ApiProperty({ description: '父权限ID', type: 'number', default: null })
  pid: Permission['pid'];

  @ApiProperty({ description: '权限名称', type: 'string' })
  name: Permission['name'];

  @ApiProperty({ description: '权限路径', type: 'string' })
  path: Permission['path'];

  @ApiProperty({
    description: '权限类型',
    enum: ['DIRECTORY', 'MENU', 'BUTTON'],
  })
  type: Permission['type'];

  @ApiProperty({ description: '权限标识', type: 'string' })
  permission: Permission['permission'];

  @ApiProperty({ description: '组件路径', type: 'string' })
  component: Permission['component'];

  @ApiProperty({ description: '图标', type: 'string' })
  icon: Permission['icon'];

  @ApiProperty({ description: '排序', type: 'number' })
  sort: Permission['sort'];

  @ApiProperty({ description: '重定向地址', type: 'string' })
  redirect: string;

  @ApiProperty({ description: '是否隐藏', type: 'boolean', default: false })
  hidden: Permission['hidden'];

  @ApiProperty({ description: '是否缓存', type: 'boolean', default: false })
  cache: Permission['cache'];

  @ApiProperty({ description: '是否禁用', type: 'boolean', default: false })
  disabled: Permission['disabled'];

  @ApiProperty({
    description: 'vue-router 的 props 属性',
    type: 'boolean',
    default: false,
  })
  props: Permission['props'];

  @ApiProperty({ description: '创建时间(UTC)', type: 'string' })
  createdAt: Permission['createdAt'];

  @ApiProperty({ description: '更新时间(UTC)', type: 'string' })
  updatedAt: Permission['updatedAt'];
}
