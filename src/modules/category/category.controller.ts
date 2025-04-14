import { Body, Controller, Post } from '@nestjs/common';
import { CategoryService } from './category.service';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiBaseResponse } from 'src/common/decorator/api-base-response.decorator';
import { Authority } from 'src/common/decorator/authority.decorator';
import { CreateCategoryDto } from './dto/create-category.dto';

@ApiTags('category')
@ApiBearerAuth()
@Controller('category')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @ApiOperation({ summary: '创建分类' })
  @ApiBaseResponse()
  @Authority('system:category:add')
  @Post()
  create(@Body() data: CreateCategoryDto) {
    return this.categoryService.create(data);
  }
}
