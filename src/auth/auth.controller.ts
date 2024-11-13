import {
  Controller,
  Get,
  Ip,
  Headers,
  Body,
  Post,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ApiBaseResponse } from 'src/common/decorator/api-base-response.decorator';
import { AuthEntity, LoginEntity } from './entities/auth.entity';
import { LoginDto, RefreshTokenDto } from './dto/auth.dto';
import { Public } from 'src/common/decorator/public.decorator';

import { IPayload } from 'src/common/types';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({
    summary: '获取验证码',
  })
  @ApiBaseResponse(AuthEntity)
  @Public()
  @Get('captcha')
  getCaptcha(
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ): AuthEntity {
    return this.authService.generateCaptcha(ip, userAgent);
  }

  @ApiOperation({
    summary: '登录',
  })
  @ApiBaseResponse(LoginEntity)
  @Public()
  @Post('login')
  login(
    @Body() data: LoginDto,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ): Promise<LoginEntity> {
    return this.authService.login(data, ip, userAgent);
  }

  @ApiOperation({
    summary: '用户登出',
  })
  @ApiBearerAuth()
  @ApiBaseResponse()
  @Post('logout')
  logout(
    @Headers('authorization') token: string,
    @Req() req: { user: IPayload },
  ) {
    return this.authService.logout(token.split(' ')[1], req.user.userId);
  }

  @ApiOperation({ summary: '刷新 token' })
  @ApiBearerAuth()
  @ApiBaseResponse(LoginEntity)
  @Public()
  @Post('refresh-token')
  refreshToken(
    @Headers('authorization') token: string,
    @Body() data: RefreshTokenDto,
  ): BadRequestException | Promise<LoginEntity> {
    if (!token) {
      return new BadRequestException('请求头中必须包含 authorization 属性');
    }

    return this.authService.refreshToken(
      token.split(' ')[1],
      data.refreshToken,
    );
  }
}
