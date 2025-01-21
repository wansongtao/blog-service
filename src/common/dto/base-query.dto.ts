import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, Matches, Min } from 'class-validator';
import { Transform } from 'class-transformer';

export class BaseQueryDto {
  @Min(1)
  @IsNumber()
  @Transform(({ value }) => parseInt(value))
  @IsOptional()
  @ApiProperty({ required: false, default: 1 })
  page?: number;

  @Min(10)
  @IsNumber()
  @Transform(({ value }) => parseInt(value))
  @IsOptional()
  @ApiProperty({ required: false, default: 10 })
  pageSize?: number;

  @Matches(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(.\d{3})?Z$/, {
    message: '开始时间格式错误',
  })
  @IsOptional()
  @ApiProperty({
    required: false,
    description: '开始时间',
  })
  beginTime?: string;

  @Matches(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(.\d{3})?Z$/, {
    message: '结束时间格式错误',
  })
  @IsOptional()
  @ApiProperty({
    required: false,
    description: '结束时间',
  })
  endTime?: string;

  @Matches(/^(asc|desc)$/, { message: '排序格式错误' })
  @IsOptional()
  @ApiProperty({
    required: false,
    default: 'desc',
    enum: ['asc', 'desc'],
    description: '排序方式，默认按创建时间倒序排列',
  })
  sort?: 'asc' | 'desc';
}
