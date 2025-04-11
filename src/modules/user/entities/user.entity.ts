import { User } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class UserEntity
  implements Omit<User, 'deleted' | 'password' | 'createdAt' | 'updatedAt'>
{
  @ApiProperty({ description: '用户 ID' })
  id: string;

  @ApiProperty({ description: '用户名' })
  userName: string;

  @ApiProperty({ description: '是否禁用' })
  disabled: boolean;

  @ApiProperty({ description: '创建时间(UTC)' })
  createdAt: string;

  @ApiProperty({ description: '更新时间(UTC)' })
  updatedAt: string;
}
