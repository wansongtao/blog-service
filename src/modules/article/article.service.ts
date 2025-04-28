import { Injectable } from '@nestjs/common';
import { ARTICLE_VISIBILITY } from 'src/common/config/dictionary';

@Injectable()
export class ArticleService {
  findArticleVisibility() {
    const keys = Object.keys(
      ARTICLE_VISIBILITY,
    ) as (keyof typeof ARTICLE_VISIBILITY)[];

    return keys.map((key) => {
      return {
        label: ARTICLE_VISIBILITY[key],
        value: key,
      };
    });
  }
}
