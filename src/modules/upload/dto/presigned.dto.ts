import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class PresignedDto {
  @IsString({ message: '文件名必须是字符串' })
  @IsNotEmpty({ message: '文件名不能为空' })
  @ApiProperty({ description: '文件名' })
  filename: string;
}
