import { TestBed } from '@automock/jest';
import { ArticleService } from '../article.service';
import { PrismaService } from 'nestjs-prisma';

describe('ArticleService', () => {
  let service: ArticleService;
  let prismaService: jest.Mocked<PrismaService>;

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
        article: {
          create: jest.fn(),
          findMany: jest.fn(),
          findUnique: jest.fn(),
          update: jest.fn(),
        },
      })
      .compile();

    service = unit;
    prismaService = unitRef.get(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findArticleVisibility', () => {
    it('should return article visibility options', () => {
      const result = service.findArticleVisibility();

      expect(result).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            label: expect.any(String),
            value: expect.any(String),
          }),
        ]),
      );
      expect(result.length).toBeGreaterThan(0);
    });

    it('should return visibility options with correct structure', () => {
      const result = service.findArticleVisibility();

      result.forEach((option) => {
        expect(option).toHaveProperty('label');
        expect(option).toHaveProperty('value');
        expect(typeof option.label).toBe('string');
        expect(typeof option.value).toBe('string');
      });
    });
  });

  describe('create', () => {
    const userId = 'user-123';
    const createArticleDto = {
      title: 'Test Article',
      categoryId: 123,
      visibility: 'PUBLIC' as const,
      content: 'Test content',
      coverImage: 'test-image.jpg',
      summary: 'Test summary',
      theme: 'default',
      published: true,
      featured: false,
    };

    it('should create an article successfully', async () => {
      // Arrange
      (prismaService.category.findUnique as jest.Mock).mockResolvedValue({
        id: 123,
      });
      (prismaService.article.create as jest.Mock).mockResolvedValue({
        id: 1,
        ...createArticleDto,
      } as any);

      // Act
      await service.create(userId, createArticleDto);

      // Assert
      expect(prismaService.category.findUnique).toHaveBeenCalledWith({
        where: {
          id: createArticleDto.categoryId,
          deleted: false,
        },
        select: {
          id: true,
        },
      });

      expect(prismaService.article.create).toHaveBeenCalledWith({
        data: {
          title: createArticleDto.title,
          content: createArticleDto.content,
          visibility: createArticleDto.visibility,
          coverImage: createArticleDto.coverImage,
          summary: createArticleDto.summary,
          theme: createArticleDto.theme,
          published: createArticleDto.published,
          featured: createArticleDto.featured,
          publishedAt: expect.any(Date),
          user: {
            connect: {
              id: userId,
            },
          },
          category: {
            connect: {
              id: createArticleDto.categoryId,
            },
          },
        },
      });
    });

    it('should set publishedAt to null when article is not published', async () => {
      // Arrange
      const draftArticleDto = {
        ...createArticleDto,
        published: false,
      };

      (prismaService.category.findUnique as jest.Mock).mockResolvedValue({
        id: 123,
      });
      (prismaService.article.create as jest.Mock).mockResolvedValue({
        id: 1,
        ...draftArticleDto,
      } as any);

      // Act
      await service.create(userId, draftArticleDto);

      // Assert
      expect(prismaService.article.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          publishedAt: null,
        }),
      });
    });

    it('should throw BadRequestException when category does not exist', async () => {
      // Arrange
      (prismaService.category.findUnique as jest.Mock).mockResolvedValue(null);

      // Act & Assert
      await expect(service.create(userId, createArticleDto)).rejects.toThrow(
        '分类不存在',
      );

      expect(prismaService.category.findUnique).toHaveBeenCalledWith({
        where: {
          id: createArticleDto.categoryId,
          deleted: false,
        },
        select: {
          id: true,
        },
      });

      expect(prismaService.article.create).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when category is deleted', async () => {
      // Arrange
      (prismaService.category.findUnique as jest.Mock).mockResolvedValue({
        id: undefined,
      } as any);

      // Act & Assert
      await expect(service.create(userId, createArticleDto)).rejects.toThrow(
        '分类不存在',
      );

      expect(prismaService.article.create).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    const userId = 'user-123';
    const mockArticles = [
      {
        id: 1,
        title: 'Test Article 1',
        visibility: 'PUBLIC',
        coverImage: 'image1.jpg',
        summary: 'Summary 1',
        published: true,
        featured: false,
        publishedAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-01'),
        category: { name: 'Tech' },
        user: { userName: 'author1' },
      },
      {
        id: 2,
        title: 'Test Article 2',
        visibility: 'PRIVATE',
        coverImage: 'image2.jpg',
        summary: 'Summary 2',
        published: false,
        featured: true,
        publishedAt: null,
        updatedAt: new Date('2023-01-02'),
        category: { name: 'Science' },
        user: { userName: 'author2' },
      },
    ];

    beforeEach(() => {
      (prismaService.$transaction as jest.Mock).mockResolvedValue([
        mockArticles,
        2,
      ]);
    });

    it('should return paginated articles with default parameters', async () => {
      const mockPrismaService = {
        $transaction: jest.fn().mockResolvedValue([mockArticles, 2]),
      };

      jest
        .spyOn(service['prismaService'], '$transaction')
        .mockImplementation(mockPrismaService.$transaction);

      const result = await service.findAll(userId, {});

      expect(result).toEqual({
        list: [
          {
            ...mockArticles[0],
            publishedAt: mockArticles[0].publishedAt.toISOString(),
            updatedAt: mockArticles[0].updatedAt.toISOString(),
            categoryName: 'Tech',
            author: 'author1',
            user: undefined, // Exclude user details
            category: undefined, // Exclude category details
          },
          {
            ...mockArticles[1],
            publishedAt: undefined,
            updatedAt: mockArticles[1].updatedAt.toISOString(),
            categoryName: 'Science',
            author: 'author2',
            user: undefined, // Exclude user details
            category: undefined, // Exclude category details
          },
        ],
        total: 2,
      });

      expect(mockPrismaService.$transaction).toHaveBeenCalledTimes(1);
    });

    it('should filter by keyword in title and summary', async () => {
      await service.findAll(userId, { keyword: 'test' });

      expect(prismaService.$transaction).toHaveBeenCalledWith(
        expect.arrayContaining([undefined, undefined]),
      );
    });

    it('should handle empty result', async () => {
      (prismaService.$transaction as jest.Mock).mockResolvedValue([[], 0]);

      const result = await service.findAll(userId, {});

      expect(result).toEqual({
        list: [],
        total: 0,
      });
    });

    it('should handle articles with null publishedAt', async () => {
      const articlesWithNullDates = [
        {
          ...mockArticles[0],
          publishedAt: null,
        },
      ];

      (prismaService.$transaction as jest.Mock).mockResolvedValue([
        articlesWithNullDates,
        1,
      ]);

      const result = await service.findAll(userId, {});

      expect(result.list[0].publishedAt).toBeUndefined();
    });
  });

  describe('findOne', () => {
    const userId = 'user-123';
    const articleId = 1;
    const mockArticle = {
      id: 1,
      title: 'Test Article',
      content: 'Test content',
      visibility: 'PUBLIC',
      coverImage: 'image.jpg',
      summary: 'Test summary',
      theme: 'default',
      published: true,
      featured: false,
      publishedAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-01'),
      commentCount: 5,
      likeCount: 10,
      viewCount: 100,
      categoryId: 1,
      category: { name: 'Tech' },
      user: { userName: 'author' },
    };

    it('should return article details successfully', async () => {
      (prismaService.article.findUnique as jest.Mock).mockResolvedValue(
        mockArticle,
      );

      const result = await service.findOne(userId, articleId);

      expect(result).toEqual({
        ...mockArticle,
        categoryName: 'Tech',
        author: 'author',
        publishedAt: mockArticle.publishedAt.toISOString(),
        updatedAt: mockArticle.updatedAt.toISOString(),
        user: undefined,
        category: undefined,
      });

      expect(prismaService.article.findUnique).toHaveBeenCalledWith({
        where: {
          id: articleId,
          deleted: false,
          OR: [{ authorId: userId }, { visibility: { not: 'PRIVATE' } }],
        },
        select: expect.objectContaining({
          id: true,
          title: true,
          content: true,
          visibility: true,
          coverImage: true,
          summary: true,
          theme: true,
          published: true,
          featured: true,
          publishedAt: true,
          updatedAt: true,
          commentCount: true,
          likeCount: true,
          viewCount: true,
          categoryId: true,
          category: { select: { name: true } },
          user: { select: { userName: true } },
        }),
      });
    });

    it('should handle article with null publishedAt', async () => {
      const articleWithNullDate = {
        ...mockArticle,
        publishedAt: null,
      };

      (prismaService.article.findUnique as jest.Mock).mockResolvedValue(
        articleWithNullDate,
      );

      const result = await service.findOne(userId, articleId);

      expect(result.publishedAt).toBeUndefined();
    });

    it('should throw BadRequestException when article not found', async () => {
      (prismaService.article.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.findOne(userId, articleId)).rejects.toThrow(
        '文章不存在',
      );

      expect(prismaService.article.findUnique).toHaveBeenCalledWith({
        where: {
          id: articleId,
          deleted: false,
          OR: [{ authorId: userId }, { visibility: { not: 'PRIVATE' } }],
        },
        select: expect.any(Object),
      });
    });

    it('should not return private articles from other users', async () => {
      (prismaService.article.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.findOne('other-user', articleId)).rejects.toThrow(
        '文章不存在',
      );
    });
  });

  describe('update', () => {
    const userId = 'user-123';
    const articleId = 1;
    const updateDto = {
      title: 'Updated Title',
      categoryId: 2,
      visibility: 'PUBLIC' as const,
      content: 'Updated content',
      published: true,
    };

    it('should update article successfully', async () => {
      (prismaService.article.findUnique as jest.Mock)
        .mockResolvedValueOnce({ id: 1, authorId: userId })
        .mockResolvedValueOnce({ id: 1, authorId: userId });

      (prismaService.category.findUnique as jest.Mock).mockResolvedValue({
        id: 2,
      });
      (prismaService.article.update as jest.Mock).mockResolvedValue({});

      await service.update(userId, articleId, updateDto);

      expect(prismaService.article.update).toHaveBeenCalledWith({
        where: { id: articleId },
        data: expect.objectContaining({
          title: updateDto.title,
          content: updateDto.content,
          visibility: updateDto.visibility,
          published: updateDto.published,
          publishedAt: expect.any(Date),
          category: { connect: { id: updateDto.categoryId } },
        }),
      });
    });

    it('should set publishedAt to null when published is false', async () => {
      const draftDto = { ...updateDto, published: false };

      (prismaService.article.findUnique as jest.Mock).mockResolvedValueOnce({
        id: 1,
        authorId: userId,
      });
      (prismaService.category.findUnique as jest.Mock).mockResolvedValue({
        id: 2,
      });
      (prismaService.article.update as jest.Mock).mockResolvedValue({});

      await service.update(userId, articleId, draftDto);

      expect(prismaService.article.update).toHaveBeenCalledWith({
        where: { id: articleId },
        data: expect.objectContaining({
          publishedAt: null,
        }),
      });
    });

    it('should throw BadRequestException when article not found', async () => {
      (prismaService.article.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        service.update(userId, articleId, updateDto),
      ).rejects.toThrow('文章不存在');
    });

    it('should throw BadRequestException when user has no permission to edit content', async () => {
      (prismaService.article.findUnique as jest.Mock).mockResolvedValue({
        id: 1,
        authorId: 'other-user',
      });

      await expect(
        service.update(userId, articleId, updateDto),
      ).rejects.toThrow('无权限修改此文章内容');
    });

    it('should throw BadRequestException when category does not exist', async () => {
      (prismaService.article.findUnique as jest.Mock).mockResolvedValue({
        id: 1,
        authorId: userId,
      });
      (prismaService.category.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        service.update(userId, articleId, updateDto),
      ).rejects.toThrow('分类不存在');
    });

    it('should allow featured update for non-author users', async () => {
      const featuredOnlyDto = { featured: true };

      (prismaService.article.findUnique as jest.Mock).mockResolvedValue({
        id: 1,
        authorId: 'other-user',
      });
      (prismaService.article.update as jest.Mock).mockResolvedValue({});

      await service.update(userId, articleId, featuredOnlyDto);

      expect(prismaService.article.update).toHaveBeenCalledWith({
        where: { id: articleId },
        data: expect.objectContaining({
          featured: true,
        }),
      });
    });
  });

  describe('remove', () => {
    const user = { userId: 'user-123', userName: 'testuser' };
    const articleId = 1;

    it('should remove article successfully as author', async () => {
      (prismaService.article.findUnique as jest.Mock).mockResolvedValue({
        id: 1,
        authorId: user.userId,
      });
      (prismaService.article.update as jest.Mock).mockResolvedValue({});

      await service.remove(user, articleId);

      expect(prismaService.article.update).toHaveBeenCalledWith({
        where: { id: articleId },
        data: { deleted: true },
      });
    });

    it('should throw BadRequestException when article not found', async () => {
      (prismaService.article.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.remove(user, articleId)).rejects.toThrow(
        '文章不存在',
      );
    });

    it('should throw BadRequestException when user has no permission', async () => {
      (prismaService.article.findUnique as jest.Mock).mockResolvedValue({
        id: 1,
        authorId: 'other-user',
      });

      await expect(service.remove(user, articleId)).rejects.toThrow(
        '无权限删除此文章',
      );
    });
  });
});
