import { Role } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class RoleEntity
  implements Omit<Role, 'deleted' | 'createdAt' | 'updatedAt'>
{
  @ApiProperty({ description: '角色ID', type: 'number' })
  id: Role['id'];

  @ApiProperty({ description: '角色名称', type: 'string' })
  name: Role['name'];

  @ApiProperty({ description: '角色描述', type: 'string' })
  description: Role['description'];

  @ApiProperty({ description: '禁用状态', type: 'boolean' })
  disabled: Role['disabled'];

  @ApiProperty({ description: '创建时间(UTC)' })
  createdAt: string;

  @ApiProperty({ description: '更新时间(UTC)' })
  updatedAt: string;
}
