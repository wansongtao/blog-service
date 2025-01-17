import { Profile } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class ProfileEntity
  implements Omit<Profile, 'id' | 'createdAt' | 'updatedAt' | 'birthday'>
{
  @ApiProperty({ description: '用户id' })
  userId: string;

  @ApiProperty({ description: '用户昵称' })
  nickName: string;

  @ApiProperty({ description: '用户头像' })
  avatar: string;

  @ApiProperty({ description: '用户邮箱' })
  email: string;

  @ApiProperty({ description: '用户手机号' })
  phone: string;

  @ApiProperty({ description: '用户性别', enum: ['MA', 'FE', 'OT'] })
  gender: 'MA' | 'FE' | 'OT';

  @ApiProperty({ description: '用户生日(UTC)' })
  birthday: string;

  @ApiProperty({ description: '用户描述' })
  description: string;
}
