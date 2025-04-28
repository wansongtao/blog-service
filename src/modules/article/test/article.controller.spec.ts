import { TestBed } from '@automock/jest';
import { ArticleController } from '../article.controller';
import { ArticleService } from '../article.service';

describe('ArticleController', () => {
  let controller: ArticleController;
  // let service: jest.Mocked<CategoryService>;

  beforeAll(() => {
    const { unit, unitRef } = TestBed.create(ArticleController).compile();

    controller = unit;
    // service = unitRef.get(ArticleService);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
