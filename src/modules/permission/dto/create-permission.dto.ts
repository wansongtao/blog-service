import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreatePermissionDto {
  @IsNumber({}, { message: '父权限 ID 类型错误' })
  @IsOptional()
  @ApiProperty({
    description: '父级权限ID',
    default: null,
    required: false,
  })
  pid?: number;

  @Matches(/^[a-zA-Z\u4e00-\u9fa5]{1,50}$/, { message: '权限名称格式错误' })
  @IsNotEmpty({ message: '权限名称不能为空' })
  @ApiProperty({ description: '权限名称' })
  name: string;

  @IsEnum(['DIRECTORY', 'MENU', 'BUTTON'], { message: '权限类型错误' })
  @ApiProperty({
    description: '权限类型',
    enum: ['DIRECTORY', 'MENU', 'BUTTON'],
  })
  type: 'DIRECTORY' | 'MENU' | 'BUTTON';

  @Matches(/^[a-z:]{1,50}$/, { message: '权限标识格式错误' })
  @IsOptional()
  @ApiProperty({ description: '权限标识', required: false })
  permission?: string;

  @MaxLength(50, { message: '图标名称长度不能超过50' })
  @IsString({ message: '图标名称必须为字符串类型' })
  @IsOptional()
  @ApiProperty({ description: '图标名称', required: false })
  icon?: string;

  @MinLength(2, { message: '路径长度不能小于2' })
  @MaxLength(50, { message: '路径长度不能超过50' })
  @Matches(/^\/?([a-zA-Z]+)(\/[a-zA-Z]+|\/:[a-zA-Z]+)*$/, {
    message: '路径格式错误',
  })
  @IsOptional()
  @ApiProperty({ description: '权限路径', required: false })
  path?: string;

  @MinLength(6, { message: '组件地址长度不能小于6' })
  @MaxLength(100, { message: '组件地址长度不能超过100' })
  @Matches(/^(\/[a-zA-Z]+[-_]?[a-zA-Z]+)+(.vue|.tsx|.jsx)$/, {
    message: '组件地址格式错误',
  })
  @IsOptional()
  @ApiProperty({ description: '组件地址', required: false })
  component?: string;

  @Max(255, { message: '最大255' })
  @Min(0, { message: '最小0' })
  @IsNumber({}, { message: '排序权重必须为数字类型' })
  @IsOptional()
  @ApiProperty({
    description: '排序权重',
    required: false,
    default: 0,
  })
  sort?: number;

  @MinLength(2, { message: '重定向地址长度不能小于2' })
  @MaxLength(50, { message: '重定向地址长度不能超过50' })
  @Matches(/^(\/?[a-zA-Z0-9]+)+$/, { message: '重定向地址格式错误' })
  @IsOptional()
  @ApiProperty({
    description: '重定向地址',
    required: false,
  })
  redirect?: string;

  @IsBoolean({ message: '禁用状态必须为布尔值' })
  @IsOptional()
  @ApiProperty({
    description: '禁用状态',
    required: false,
    default: false,
  })
  disabled?: boolean;

  @IsBoolean({ message: '隐藏状态必须为布尔值' })
  @IsOptional()
  @ApiProperty({
    description: '隐藏状态',
    required: false,
    default: false,
  })
  hidden?: boolean;

  @IsBoolean({ message: '是否缓存必须为布尔值' })
  @IsOptional()
  @ApiProperty({
    description: '是否缓存',
    required: false,
    default: false,
  })
  cache?: boolean;

  @IsBoolean({ message: 'vue-router 的 props 属性必须为布尔值' })
  @IsOptional()
  @ApiProperty({
    description: 'vue-router 的 props 属性',
    required: false,
    default: false,
  })
  props?: boolean;
}
