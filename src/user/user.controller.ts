import { Body, Controller, Get, Patch, Post, Query, Req } from '@nestjs/common';
import { UserService } from './user.service';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiBaseResponse } from 'src/common/decorator/api-base-response.decorator';
import { UserProfileEntity } from './entities/user-profile.entity';
import { IPayload } from 'src/common/types';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { UserListEntity } from './entities/user-list.entity';
import { QueryUserDto } from './dto/query-user.dto';
import { Authority } from 'src/common/decorator/authority.decorator';
import { CreateUserDto } from './dto/create-user.dto';

@ApiTags('user')
@ApiBearerAuth()
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @ApiOperation({
    summary: '创建用户',
  })
  @ApiBaseResponse()
  @Authority('system:user:add')
  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  @ApiOperation({
    summary: '获取用户列表',
  })
  @ApiBaseResponse(UserListEntity)
  @Get()
  findAll(@Query() query: QueryUserDto): Promise<UserListEntity> {
    return this.userService.findAll(query);
  }

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

  @ApiOperation({
    summary: '修改密码',
  })
  @ApiBaseResponse()
  @Patch('password')
  updatePassword(
    @Req() req: { user: IPayload },
    @Body() updatePasswordDto: UpdatePasswordDto,
  ) {
    return this.userService.updatePassword(req.user.userId, updatePasswordDto);
  }
}
