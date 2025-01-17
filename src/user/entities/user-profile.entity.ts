import { ApiProperty, OmitType } from '@nestjs/swagger';
import { ProfileEntity } from './profile.entity';
import { UserEntity } from './user.entity';

export class UserProfileEntity extends OmitType(ProfileEntity, ['userId']) {
  @ApiProperty({ description: '用户名', type: 'string' })
  userName: UserEntity['userName'];

  @ApiProperty({ description: '角色列表', type: [String] })
  roles: string[];
}
