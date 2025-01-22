import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';

export class QueryPermissionTreeDto {
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  @IsOptional()
  @ApiProperty({ required: false, description: '是否包含按钮级' })
  containButton?: boolean;
}
