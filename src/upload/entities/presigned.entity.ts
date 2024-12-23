import { ApiProperty } from '@nestjs/swagger';

export class PresignedEntity {
  @ApiProperty({
    description: '预签名 URL',
  })
  presignedUrl: string;
}
