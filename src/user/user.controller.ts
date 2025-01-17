import { Controller, Get, Req } from '@nestjs/common';
import { UserService } from './user.service';
import { ApiOperation } from '@nestjs/swagger';
import { ApiBaseResponse } from 'src/common/decorator/api-base-response.decorator';
import { UserProfileEntity } from './entities/user-profile.entity';
import { IPayload } from 'src/common/types';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @ApiOperation({
    summary: '获取当前用户个人信息',
  })
  @ApiBaseResponse(UserProfileEntity)
  @Get('profile')
  findProfile(@Req() req: { user: IPayload }): Promise<UserProfileEntity> {
    return this.userService.findProfile(req.user.userId);
  }
}
