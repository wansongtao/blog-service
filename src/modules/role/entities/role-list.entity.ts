import { ApiProperty } from '@nestjs/swagger';
import { RoleEntity } from './role.entity';

export class RoleListEntity {
  @ApiProperty({ description: '总数' })
  total: number;

  @ApiProperty({ description: '角色列表', type: [RoleEntity] })
  list: RoleEntity[];
}
