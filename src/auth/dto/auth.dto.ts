import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class LoginDto {
  @Matches(/^[a-zA-Z][a-zA-Z0-9]{2,10}$/, { message: '用户名格式错误' })
  @IsNotEmpty({ message: '用户名不能为空' })
  @ApiProperty({ description: '用户名' })
  userName: string;

  @Matches(/^[a-zA-Z](?=.*[.?!&_])(?=.*\d)[a-zA-Z\d.?!&_]{5,15}$/, {
    message: '密码格式错误',
  })
  @IsNotEmpty({ message: '密码不能为空' })
  @ApiProperty({ description: '密码' })
  password: string;

  @Matches(/^[a-zA-Z0-9]{4}$/, { message: '验证码格式错误' })
  @IsNotEmpty({ message: '验证码不能为空' })
  @ApiProperty({ description: '验证码' })
  captcha: string;
}

export class RefreshTokenDto {
  @IsString({ message: 'refreshToken 必须是字符串' })
  @IsNotEmpty({ message: 'refreshToken 不能为空' })
  @ApiProperty({ description: '刷新令牌' })
  refreshToken: string;
}
