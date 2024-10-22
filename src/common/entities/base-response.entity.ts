import { HttpStatus } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';

export class BaseResponseEntity<T = unknown> {
  @ApiProperty({ default: 200, description: '状态码' })
  statusCode: HttpStatus;

  @ApiProperty({ description: '返回数据' })
  data?: T;

  @ApiProperty({ default: 'Success', description: '返回信息' })
  message: string;
}

export class NullResponseEntity extends BaseResponseEntity<null> {
  @ApiProperty({ default: null })
  data: null;
}
