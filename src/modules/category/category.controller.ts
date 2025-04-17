import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import { CategoryService } from './category.service';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiBaseResponse } from 'src/common/decorator/api-base-response.decorator';
import { Authority } from 'src/common/decorator/authority.decorator';
import { CreateCategoryDto } from './dto/create-category.dto';
import { QueryCategoryDto } from './dto/query-category.dto';
import { CategoryListEntity } from './entities/category-list.entity';
import { CategoryTreeEntity } from './entities/category-tree.entity';
import { CategoryDetailEntity } from './entities/category-detail.entity';

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

  @ApiOperation({ summary: '获取分类列表' })
  @ApiBaseResponse(CategoryListEntity)
  @Get()
  findAll(@Query() params: QueryCategoryDto): Promise<CategoryListEntity> {
    return this.categoryService.findAll(params);
  }

  @ApiOperation({ summary: '获取分类树' })
  @ApiBaseResponse(CategoryTreeEntity, 'array')
  @Get('tree')
  findTree(): Promise<CategoryTreeEntity[]> {
    return this.categoryService.findTree();
  }

  @ApiOperation({ summary: '获取单个分类详情' })
  @ApiBaseResponse(CategoryDetailEntity)
  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<CategoryDetailEntity> {
    return this.categoryService.findOne(id);
  }
}
