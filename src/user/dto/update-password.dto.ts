import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, Matches } from 'class-validator';

export class UpdatePasswordDto {
  @Matches(/^[a-zA-Z](?=.*[.?!&_])(?=.*\d)[a-zA-Z\d.?!&_]{5,15}$/, {
    message: '密码格式错误',
  })
  @IsNotEmpty({ message: '原密码不能为空' })
  @ApiProperty({ description: '原密码' })
  oldPassword: string;

  @Matches(/^[a-zA-Z](?=.*[.?!&_])(?=.*\d)[a-zA-Z\d.?!&_]{5,15}$/, {
    message: '密码格式错误',
  })
  @IsNotEmpty({ message: '新密码不能为空' })
  @ApiProperty({ description: '新密码' })
  newPassword: string;
}
