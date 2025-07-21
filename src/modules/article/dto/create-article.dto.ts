import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';

export class CreateArticleDto {
  @MaxLength(150, { message: '文章标题最多150个字符' })
  @MinLength(2, { message: '文章标题最少两个字符' })
  @IsString({ message: '文章标题必须为 string 类型' })
  @ApiProperty({ description: '文章标题', required: true })
  title: string;

  @IsNumber({}, { message: '文章分类 ID 必须为 number 类型' })
  @ApiProperty({ description: '文章分类 ID', required: true })
  categoryId: number;

  @Matches(/^(PRIVATE|INTERNAL|PUBLIC)$/, { message: '可见性格式错误' })
  @ApiProperty({
    description: '可见性',
    enum: ['PRIVATE', 'INTERNAL', 'PUBLIC'],
    required: true,
  })
  visibility: 'PRIVATE' | 'INTERNAL' | 'PUBLIC';

  @IsString({ message: '文章内容必须为 string 类型' })
  @ApiProperty({ description: '文章内容', required: true })
  content: string;

  @MaxLength(255, { message: '封面地址长度不能超过255个字符' })
  @IsUrl(
    {
      host_whitelist: [
        'localhost',
        /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
      ],
    },
    { message: '封面地址格式错误' },
  )
  @IsOptional()
  @ApiProperty({ description: '封面', required: false })
  coverImage?: string;

  @MaxLength(200, { message: '文章摘要长度不能超过200个字符' })
  @ValidateIf((o) => o.summary !== '')
  @IsOptional()
  @ApiProperty({ description: '个性签名', required: false })
  summary?: string;

  @Matches(/^[a-z0-9-]{1,50}$/, {
    message: '主题仅支持小写字母、数字与‘-’组合，最大不超过50个字符',
  })
  @ValidateIf((o) => o.theme !== '')
  @IsOptional()
  @ApiProperty({ description: '主题', required: false })
  theme?: string;

  @IsBoolean()
  @IsOptional()
  @ApiProperty({
    description: '发布状态，默认草稿状态',
    required: false,
    default: false,
  })
  published?: boolean;

  @IsBoolean()
  @IsOptional()
  @ApiProperty({
    description: '精选文章',
    required: false,
    default: false,
  })
  featured?: boolean;

  @IsBoolean()
  @IsOptional()
  @ApiProperty({
    description: '是否加密文章',
    required: false,
    default: false,
  })
  encrypted?: boolean;

  @MaxLength(50, { message: '密码提示长度不能超过50个字符' })
  @ValidateIf((o) => o.passwordHint !== '')
  @IsOptional()
  @ApiProperty({ description: '密码提示', required: false })
  passwordHint?: string;
}
