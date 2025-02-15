import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  Matches,
  MaxLength,
  ValidateIf,
} from 'class-validator';

export class CreateRoleDto {
  @Matches(/^[a-zA-Z0-9._-]{1,50}$/, { message: '角色名称格式错误' })
  @IsNotEmpty({ message: '角色名称不能为空' })
  @ApiProperty({ description: '角色名称' })
  name: string;

  @MaxLength(150, { message: '角色描述不能超过150个字符' })
  @ValidateIf((o) => o.description !== '')
  @IsOptional()
  @ApiProperty({ description: '角色描述', required: false })
  description?: string;

  @IsNumber({}, { message: '权限 ID 必须为数字', each: true })
  @ValidateIf((o) => o.permissions?.length !== 0)
  @IsOptional()
  @ApiProperty({ description: '权限 ID 列表', type: [Number], required: false })
  permissions?: number[];

  @IsBoolean({ message: '禁用状态必须为布尔值' })
  @IsOptional()
  @ApiProperty({ description: '禁用状态', required: false })
  disabled?: boolean;
}
