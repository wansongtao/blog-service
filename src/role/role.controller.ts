import { Controller, Get, Query } from '@nestjs/common';
import { RoleService } from './role.service';
import { QueryRoleDto } from './dto/query-role.dto';
import { RoleListEntity } from './entities/role-list.entity';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiBaseResponse } from 'src/common/decorator/api-base-response.decorator';

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
}
