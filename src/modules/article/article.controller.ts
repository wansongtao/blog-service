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
import { ArticleService } from './article.service';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ArticleVisibilityEntity } from './entities/article-visibility.entity';
import { ApiBaseResponse } from 'src/common/decorator/api-base-response.decorator';
import { Authority } from 'src/common/decorator/authority.decorator';
import { CreateArticleDto } from './dto/create-article.dto';
import { IPayload } from 'src/common/types';
import { ArticleListEntity } from './entities/article-list.entity';
import { QueryArticleDto } from './dto/query-article.dto';
import { ArticleEntity } from './entities/article.entity';
import { UpdateArticleDto } from './dto/update-article.dto';

@ApiTags('article')
@ApiBearerAuth()
@Controller('article')
export class ArticleController {
  constructor(private readonly articleService: ArticleService) {}

  @ApiOperation({ summary: '获取文章可见性列表' })
  @ApiBaseResponse(ArticleVisibilityEntity, 'array')
  @Get('visibility')
  findArticleVisibility(): ArticleVisibilityEntity[] {
    return this.articleService.findArticleVisibility();
  }

  @ApiOperation({
    summary: '创建文章',
  })
  @ApiBaseResponse()
  @Authority('system:article:add')
  @Post()
  create(@Req() req: { user: IPayload }, @Body() data: CreateArticleDto) {
    return this.articleService.create(req.user.userId, data);
  }

  @ApiOperation({
    summary: '获取文章列表',
  })
  @ApiBaseResponse(ArticleListEntity)
  @Get()
  findAll(
    @Req() req: { user: IPayload },
    @Query() queryDto: QueryArticleDto,
  ): Promise<ArticleListEntity> {
    return this.articleService.findAll(req.user.userId, queryDto);
  }

  @ApiOperation({ summary: '获取文章详情' })
  @ApiBaseResponse(ArticleEntity)
  @Get(':id')
  findOne(
    @Req() req: { user: IPayload },
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ArticleEntity> {
    return this.articleService.findOne(req.user.userId, id);
  }

  @ApiOperation({ summary: '编辑文章' })
  @ApiBaseResponse()
  @Authority('system:article:edit')
  @Patch(':id')
  update(
    @Req() req: { user: IPayload },
    @Param('id', ParseIntPipe) id: number,
    @Body() data: UpdateArticleDto,
  ) {
    return this.articleService.update(req.user.userId, id, data);
  }

  @ApiOperation({
    summary: '删除文章',
  })
  @ApiBaseResponse()
  @Authority('system:article:del')
  @Patch(':id/delete')
  remove(
    @Req() req: { user: IPayload },
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.articleService.remove(req.user, id);
  }
}
