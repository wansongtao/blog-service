import { ApiProperty } from '@nestjs/swagger';
import { BaseQueryDto } from 'src/common/dto/base-query.dto';
import { IsOptional, Matches, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class QueryArticleDto extends BaseQueryDto {
  @ApiProperty({
    required: false,
    description: '文章标题、摘要关键字, 不能超过50个字符',
  })
  @MaxLength(50)
  @IsOptional()
  keyword?: string;

  @ApiProperty({ required: false, description: '文章分类 ID' })
  @Transform(({ value }) => (value ? parseInt(value, 10) : undefined))
  @Matches(/^\d+$/, { message: '文章分类 ID 必须为数字' })
  @IsOptional()
  categoryId?: number;

  @Matches(/^(PRIVATE|INTERNAL|PUBLIC)$/, { message: '可见性格式错误' })
  @IsOptional()
  @ApiProperty({
    required: false,
    enum: ['PRIVATE', 'INTERNAL', 'PUBLIC'],
    description: '文章可见性',
  })
  visibility?: 'PRIVATE' | 'INTERNAL' | 'PUBLIC';

  @ApiProperty({ required: false, description: '发布状态' })
  @Transform(({ value }) => value === '1')
  @IsOptional()
  published?: boolean;

  @ApiProperty({ required: false, description: '置顶状态' })
  @Transform(({ value }) => value === '1')
  @IsOptional()
  featured?: boolean;
}
