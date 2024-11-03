import { ApiProperty } from '@nestjs/swagger';

export class AuthEntity {
  @ApiProperty({
    description: 'base64 格式验证码',
    default: 'data:image/svg+xml;base64,***',
  })
  captcha: string;
}

export class LoginEntity {
  @ApiProperty({ description: '认证身份 token' })
  token: string;

  @ApiProperty({ description: '用来刷新 token 的凭证' })
  refreshToken: string;
}
