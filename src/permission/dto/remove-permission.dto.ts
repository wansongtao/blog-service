import { ArrayNotEmpty, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RemovePermissionDto {
  @IsNumber({}, { message: 'id 必须为数字', each: true })
  @ArrayNotEmpty({ message: 'id 列表不能为空' })
  @ApiProperty({ description: 'id 列表', type: [Number] })
  ids: number[];
}
