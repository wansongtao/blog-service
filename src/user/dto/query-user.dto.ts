import { BaseQueryDto } from '../../common/dto/base-query.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, Matches, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class QueryUserDto extends BaseQueryDto {
  @Transform(({ value }) => value === '1')
  @IsOptional()
  @ApiProperty({ required: false, description: '禁用状态' })
  disabled?: boolean;

  @MaxLength(50)
  @Matches(/[a-zA-Z0-9\u4e00-\u9fa5']$/, { message: '关键字格式错误' })
  @IsOptional()
  @ApiProperty({
    required: false,
    description: '用户名/昵称关键字, 不能超过50个字符',
  })
  keyword?: string;
}
