import { ApiProperty, OmitType } from '@nestjs/swagger';
import { RoleEntity } from './role.entity';

export class RoleDetailEntity extends OmitType(RoleEntity, [
  'createdAt',
  'updatedAt',
]) {
  @ApiProperty({ description: '权限列表', type: 'number', isArray: true })
  permissions: number[];
}
