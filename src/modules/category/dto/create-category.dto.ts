import {
  IsOptional,
  Length,
  IsInt,
  Min,
  Matches,
  Max,
  IsBoolean,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCategoryDto {
  @ApiProperty({ description: '分类名称', example: '前端技术' })
  @Matches(/^[\u4e00-\u9fa5a-zA-Z0-9_&+]+$/, {
    message: '分类名称只能包含中文、字母、数字等字符',
  })
  @Length(1, 50, { message: '分类名称长度应在1到50个字符之间' })
  name: string;

  @ApiProperty({
    description: '分类描述',
    example: '前端相关技术文章',
    required: false,
  })
  @Matches(/^[\u4e00-\u9fa5a-zA-Z0-9_&+,.，。'"‘“]+$/, {
    message: '分类描述只能包含中文、字母、数字等字符',
  })
  @IsOptional()
  @Length(0, 150, { message: '分类描述长度不应超过150个字符' })
  description?: string;

  @ApiProperty({ description: '父分类ID', example: null, required: false })
  @IsInt({ message: '父分类ID必须是整数' })
  @Min(1, { message: '父分类ID不能为负数' })
  @IsOptional()
  pid?: number;

  @ApiProperty({ description: '排序', example: 1, required: false })
  @Max(100, { message: '排序不能大于100' })
  @Min(0, { message: '排序不能小于0' })
  @IsInt({ message: '排序必须是整数' })
  @IsOptional()
  sort?: number;

  @ApiProperty({ description: '是否隐藏', example: false, required: false })
  @IsBoolean({ message: '是否隐藏必须是布尔值' })
  @IsOptional()
  hidden?: boolean;
}
