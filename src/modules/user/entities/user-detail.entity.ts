import { ApiProperty, PickType } from '@nestjs/swagger';
import { UserEntity } from './user.entity';
import { ProfileEntity } from './profile.entity';

export class UserDetailEntity extends PickType(UserEntity, [
  'userName',
  'disabled',
]) {
  @ApiProperty({ description: '用户昵称', type: 'string' })
  nickName: ProfileEntity['nickName'];

  @ApiProperty({ description: '角色 id 列表', type: [Number] })
  roles: number[];
}
