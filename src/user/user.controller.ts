import { Body, Controller, Get, Patch, Req } from '@nestjs/common';
import { UserService } from './user.service';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiBaseResponse } from 'src/common/decorator/api-base-response.decorator';
import { UserProfileEntity } from './entities/user-profile.entity';
import { IPayload } from 'src/common/types';
import { UpdateProfileDto } from './dto/update-profile.dto';

@ApiTags('user')
@ApiBearerAuth()
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

  @ApiOperation({
    summary: '更新当前用户个人信息',
  })
  @ApiBaseResponse()
  @Patch('profile')
  updateProfile(
    @Req() req: { user: IPayload },
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    return this.userService.updateProfile(req.user.userId, updateProfileDto);
  }
}
