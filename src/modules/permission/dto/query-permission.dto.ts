import { ApiProperty } from '@nestjs/swagger';
import { BaseQueryDto } from 'src/common/dto/base-query.dto';
import { Permission } from '@prisma/client';
import { IsBoolean, IsOptional, Matches, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class QueryPermissionDto extends BaseQueryDto {
  @IsBoolean()
  @Transform(({ value }) => value === '1')
  @IsOptional()
  @ApiProperty({ required: false })
  disabled?: boolean;

  @Matches(/^(DIRECTORY|MENU|BUTTON)$/, { message: '类型格式错误' })
  @IsOptional()
  @ApiProperty({
    required: false,
    enum: ['DIRECTORY', 'MENU', 'BUTTON'],
  })
  type?: Permission['type'];

  @MaxLength(50)
  @Matches(/^[a-zA-Z0-9\u4e00-\u9fa5]+$/, { message: '名称格式错误' })
  @IsOptional()
  @ApiProperty({
    required: false,
    description: '名称关键字, 不能超过50个字符',
  })
  keyword?: string;
}
