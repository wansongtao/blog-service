import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import { PermissionService } from './permission.service';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiBaseResponse } from 'src/common/decorator/api-base-response.decorator';
import { PermissionListEntity } from './entities/permission-list.entity';
import { QueryPermissionDto } from './dto/query-permission.dto';
import { QueryPermissionTreeDto } from './dto/query-permission-tree.dto';
import { PermissionTreeEntity } from './entities/permission-tree.entity';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { Authority } from 'src/common/decorator/authority.decorator';
import { PermissionEntity } from './entities/permission.entity';

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

  @ApiOperation({ summary: '获取单个权限详情' })
  @ApiBaseResponse(PermissionEntity)
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.permissionService.findOne(id);
  }
}
