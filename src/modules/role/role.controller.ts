import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { RoleService } from './role.service';
import { QueryRoleDto } from './dto/query-role.dto';
import { RoleListEntity } from './entities/role-list.entity';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiBaseResponse } from 'src/common/decorator/api-base-response.decorator';
import { Authority } from 'src/common/decorator/authority.decorator';
import { CreateRoleDto } from './dto/create-role.dto';
import { RoleDetailEntity } from './entities/role-detail.entity';
import { UpdateRoleDto } from './dto/update-role.dto';
import { RoleTreeEntity } from './entities/role-tree.entity';
import { IPayload } from 'src/common/types';

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

  @ApiOperation({ summary: '获取所有有效角色树' })
  @ApiBaseResponse(RoleTreeEntity, 'array')
  @Get('tree')
  findRoleTree(@Req() req: { user: IPayload }) {
    return this.roleService.findRoleTree(req.user);
  }

  @ApiOperation({ summary: '获取角色详情' })
  @ApiBaseResponse(RoleDetailEntity)
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<RoleDetailEntity> {
    return this.roleService.findOne(id);
  }

  @ApiOperation({ summary: '更新角色信息' })
  @ApiBaseResponse()
  @Authority('system:role:edit')
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateRoleDto: UpdateRoleDto,
  ) {
    return this.roleService.update(id, updateRoleDto);
  }

  @ApiOperation({ summary: '删除角色' })
  @ApiBaseResponse()
  @Authority('system:role:del')
  @Patch(':id/delete')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.roleService.remove(id);
  }
}
