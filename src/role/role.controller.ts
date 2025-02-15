import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import { RoleService } from './role.service';
import { QueryRoleDto } from './dto/query-role.dto';
import { RoleListEntity } from './entities/role-list.entity';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiBaseResponse } from 'src/common/decorator/api-base-response.decorator';
import { Authority } from 'src/common/decorator/authority.decorator';
import { CreateRoleDto } from './dto/create-role.dto';
import { RoleDetailEntity } from './entities/role-detail.entity';

@ApiTags('role')
@ApiBearerAuth()
@Controller('role')
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @ApiOperation({ summary: '获取角色列表' })
  @ApiBaseResponse(RoleListEntity)
  @Get()
  findAll(@Query() query: QueryRoleDto): Promise<RoleListEntity> {
    return this.roleService.findAll(query);
  }

  @ApiOperation({ summary: '创建角色' })
  @ApiBaseResponse()
  @Post()
  @Authority('system:role:add')
  create(@Body() createRoleDto: CreateRoleDto) {
    return this.roleService.create(createRoleDto);
  }

  @ApiOperation({ summary: '获取角色详情' })
  @ApiBaseResponse(RoleDetailEntity)
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<RoleDetailEntity> {
    return this.roleService.findOne(id);
  }
}
