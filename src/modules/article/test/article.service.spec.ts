import { TestBed } from '@automock/jest';
import { ArticleService } from '../article.service';
import { PrismaService } from 'nestjs-prisma';

describe('ArticleService', () => {
  let service: ArticleService;
  // let prismaService: jest.Mocked<PrismaService>;

  beforeEach(async () => {
    const { unit, unitRef } = TestBed.create(ArticleService)
      .mock(PrismaService)
      .using({
        category: {
          findUnique: jest.fn(),
          findMany: jest.fn(),
          create: jest.fn(),
          findFirst: jest.fn(),
        },
      })
      .compile();

    service = unit;
    // prismaService = unitRef.get(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
