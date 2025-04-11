import { ApiProperty } from '@nestjs/swagger';
import { UserEntity } from './user.entity';

export class UserListItem extends UserEntity {
  @ApiProperty({ description: '用户昵称' })
  nickName: string;

  @ApiProperty({ description: '用户头像' })
  avatar: string;

  @ApiProperty({ description: '角色列表', type: [String] })
  roleNames: string[];
}

export class UserListEntity {
  @ApiProperty({ description: '总数', type: 'number' })
  total: number;

  @ApiProperty({ description: '用户列表', type: [UserListItem] })
  list: UserListItem[];
}
