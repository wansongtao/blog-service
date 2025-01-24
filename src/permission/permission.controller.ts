import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { PermissionService } from './permission.service';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiBaseResponse } from 'src/common/decorator/api-base-response.decorator';
import { PermissionListEntity } from './entities/permission-list.entity';
import { QueryPermissionDto } from './dto/query-permission.dto';
import { QueryPermissionTreeDto } from './dto/query-permission-tree.dto';
import { PermissionTreeEntity } from './entities/permission-tree.entity';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { Authority } from 'src/common/decorator/authority.decorator';

@ApiTags('permission')
@ApiBearerAuth()
@Controller('permission')
export class PermissionController {
  constructor(private readonly permissionService: PermissionService) {}

  @ApiOperation({ summary: '获取权限列表' })
  @ApiBaseResponse(PermissionListEntity)
  @Get()
  findAll(
    @Query() queryDto: QueryPermissionDto,
  ): Promise<PermissionListEntity> {
    return this.permissionService.findAll(queryDto);
  }

  @ApiOperation({ summary: '获取权限树' })
  @ApiBaseResponse(PermissionTreeEntity, 'array')
  @Get('tree')
  findTree(
    @Query() queryDto: QueryPermissionTreeDto,
  ): Promise<PermissionTreeEntity[]> {
    return this.permissionService.findTree(queryDto.containButton);
  }

  @ApiOperation({ summary: '创建权限' })
  @ApiBaseResponse()
  @Authority('system:menu:add')
  @Post()
  create(@Body() createPermissionDto: CreatePermissionDto) {
    return this.permissionService.create(createPermissionDto);
  }
}
