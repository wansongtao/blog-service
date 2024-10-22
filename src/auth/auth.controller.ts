import { Controller, Get, Ip, Headers } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiOperation } from '@nestjs/swagger';
import { ApiBaseResponse } from 'src/common/decorator/api-base-response.decorator';
import { AuthEntity } from './entities/auth.entity';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({
    summary: '获取验证码',
  })
  @ApiBaseResponse(AuthEntity)
  @Get('captcha')
  getCaptcha(
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ): AuthEntity {
    return this.authService.generateCaptcha(ip, userAgent);
  }
}
