import { PickType } from '@nestjs/swagger';
import { RoleEntity } from './role.entity';

export class RoleTreeEntity extends PickType(RoleEntity, ['id', 'name']) {}
