import { BaseQueryDto } from 'src/common/dto/base-query.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, Matches, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class QueryRoleDto extends BaseQueryDto {
  @Transform(({ value }) => value === '1')
  @IsOptional()
  @ApiProperty({ required: false, description: '禁用状态' })
  disabled?: boolean;

  @MaxLength(50)
  @Matches(/^[a-zA-Z\u4e00-\u9fa5,_-]*$/, { message: '角色名称格式错误' })
  @IsOptional()
  @ApiProperty({
    required: false,
    description: '角色名称关键字, 不能超过50个字符',
  })
  keyword?: string;
}
