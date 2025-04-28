import { Controller, Get } from '@nestjs/common';
import { ArticleService } from './article.service';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ArticleVisibilityEntity } from './entities/article-visibility.entity';
import { ApiBaseResponse } from 'src/common/decorator/api-base-response.decorator';

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
}
