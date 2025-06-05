import { Body, Controller, Get, Post, Req } from '@nestjs/common';
import { ArticleService } from './article.service';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ArticleVisibilityEntity } from './entities/article-visibility.entity';
import { ApiBaseResponse } from 'src/common/decorator/api-base-response.decorator';
import { Authority } from 'src/common/decorator/authority.decorator';
import { CreateArticleDto } from './dto/create-article.dto';
import { IPayload } from 'src/common/types';

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
}
