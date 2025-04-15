import { ApiProperty } from '@nestjs/swagger';
import { BaseQueryDto } from 'src/common/dto/base-query.dto';
import { IsOptional, Matches, MaxLength } from 'class-validator';

export class QueryCategoryDto extends BaseQueryDto {
  @ApiProperty({
    required: false,
    description: '名称关键字, 不能超过50个字符',
  })
  @Matches(/^[\u4e00-\u9fa5a-zA-Z0-9_&+]+$/, { message: '名称格式错误' })
  @MaxLength(50)
  @IsOptional()
  keyword?: string;
}
