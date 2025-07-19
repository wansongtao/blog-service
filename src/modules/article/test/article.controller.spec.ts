import { TestBed } from '@automock/jest';
import { ArticleController } from '../article.controller';
import { ArticleService } from '../article.service';
import { CreateArticleDto } from '../dto/create-article.dto';

describe('ArticleController', () => {
  let controller: ArticleController;
  let service: jest.Mocked<ArticleService>;

  beforeAll(() => {
    const { unit, unitRef } = TestBed.create(ArticleController).compile();

    controller = unit;
    service = unitRef.get(ArticleService);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findArticleVisibility', () => {
    it('should return article visibility list', () => {
      const mockVisibility = [
        { label: 'Public' as any, value: 'PRIVATE' as any },
        { label: 'Private' as any, value: 'INTERNAL' as any },
        { label: 'Unlisted' as any, value: 'PUBLIC' as any },
      ];
      service.findArticleVisibility.mockReturnValue(mockVisibility);

      const result = controller.findArticleVisibility();

      expect(service.findArticleVisibility).toHaveBeenCalled();
      expect(result).toEqual(mockVisibility);
    });
  });

  describe('create', () => {
    it('should create an article', async () => {
      const mockUser = { userId: 'sdsfdfas', userName: 'testuser' };
      const mockCreateDto: CreateArticleDto = {
        title: 'Test Article',
        content: 'Test content',
        categoryId: 1,
        visibility: 'PUBLIC' as any,
      };

      service.create.mockResolvedValue();
      await controller.create({ user: mockUser }, mockCreateDto);

      expect(service.create).toHaveBeenCalledWith(
        mockUser.userId,
        mockCreateDto,
      );
    });

    it('should handle service errors', async () => {
      const mockUser = { userId: '1', userName: 'testuser' };
      const mockCreateDto = {
        title: 'Test Article',
        content: 'Test content',
        categoryId: 1,
        visibility: 'PUBLIC' as any,
      };
      const mockError = new Error('Service error');

      service.create.mockRejectedValue(mockError);

      await expect(
        controller.create({ user: mockUser }, mockCreateDto),
      ).rejects.toThrow('Service error');

      expect(service.create).toHaveBeenCalledWith(
        mockUser.userId,
        mockCreateDto,
      );
    });
  });

  describe('findAll', () => {
    it('should return article list', async () => {
      const mockUser = { userId: 'user123', userName: 'testuser' };
      const mockQueryDto = {
        page: 1,
        limit: 10,
        keyword: 'test',
      };
      const mockArticleList = {
        list: [
          {
            id: 1,
            title: 'Test Article',
            summary: 'This is a test article',
            visibility: 'PUBLIC' as any,
            updatedAt: '2023-01-01T00:00:00Z',
            categoryName: 'Test Category',
            coverImage: 'test-image.jpg',
            author: 'testuser',
            published: true,
            publishedAt: '2023-01-01T00:00:00Z',
            featured: false,
            user: undefined as any, // Exclude user details
            category: undefined as any, // Exclude category details
          },
        ],
        total: 1,
      };

      service.findAll.mockResolvedValue(mockArticleList);

      const result = await controller.findAll({ user: mockUser }, mockQueryDto);

      expect(service.findAll).toHaveBeenCalledWith(
        mockUser.userId,
        mockQueryDto,
      );
      expect(result).toEqual(mockArticleList);
    });

    it('should handle empty query parameters', async () => {
      const mockUser = { userId: 'user123', userName: 'testuser' };
      const mockQueryDto = {};
      const mockEmptyList = {
        list: [],
        total: 0,
        page: 1,
        limit: 10,
      };

      service.findAll.mockResolvedValue(mockEmptyList);

      const result = await controller.findAll({ user: mockUser }, mockQueryDto);

      expect(service.findAll).toHaveBeenCalledWith(
        mockUser.userId,
        mockQueryDto,
      );
      expect(result).toEqual(mockEmptyList);
    });

    it('should handle service errors', async () => {
      const mockUser = { userId: 'user123', userName: 'testuser' };
      const mockQueryDto = { page: 1, limit: 10 };
      const mockError = new Error('Database connection failed');

      service.findAll.mockRejectedValue(mockError);

      await expect(
        controller.findAll({ user: mockUser }, mockQueryDto),
      ).rejects.toThrow('Database connection failed');

      expect(service.findAll).toHaveBeenCalledWith(
        mockUser.userId,
        mockQueryDto,
      );
    });
  });

  describe('findOne', () => {
    it('should return article details', async () => {
      const mockUser = { userId: 'user123', userName: 'testuser' };
      const articleId = 1;
      const mockArticle = {
        id: 1,
        title: 'Test Article',
        content: 'Test article content',
        summary: 'Test summary',
        visibility: 'PUBLIC' as any,
        updatedAt: '2023-01-01T00:00:00Z',
        categoryName: 'Test Category',
        coverImage: 'test-image.jpg',
        author: 'testuser',
        published: true,
        publishedAt: '2023-01-01T00:00:00Z',
        featured: false,
        user: undefined as any,
        category: undefined as any,
        theme: 'default',
        viewCount: 100,
        likeCount: 10,
        commentCount: 5,
        categoryId: 1,
      };

      service.findOne.mockResolvedValue(mockArticle);

      const result = await controller.findOne({ user: mockUser }, articleId);

      expect(service.findOne).toHaveBeenCalledWith(mockUser.userId, articleId);
      expect(result).toEqual(mockArticle);
    });

    it('should handle service errors when article not found', async () => {
      const mockUser = { userId: 'user123', userName: 'testuser' };
      const articleId = 999;
      const mockError = new Error('Article not found');

      service.findOne.mockRejectedValue(mockError);

      await expect(
        controller.findOne({ user: mockUser }, articleId),
      ).rejects.toThrow('Article not found');

      expect(service.findOne).toHaveBeenCalledWith(mockUser.userId, articleId);
    });
  });

  describe('update', () => {
    it('should update an article', async () => {
      const mockUser = { userId: 'user123', userName: 'testuser' };
      const articleId = 1;
      const mockUpdateDto = {
        title: 'Updated Article',
        content: 'Updated content',
        categoryId: 2,
        visibility: 'PRIVATE' as any,
      };

      service.update.mockResolvedValue();

      await controller.update({ user: mockUser }, articleId, mockUpdateDto);

      expect(service.update).toHaveBeenCalledWith(
        mockUser.userId,
        articleId,
        mockUpdateDto,
      );
    });

    it('should handle partial updates', async () => {
      const mockUser = { userId: 'user123', userName: 'testuser' };
      const articleId = 1;
      const mockUpdateDto = {
        title: 'Updated Title Only',
      };

      service.update.mockResolvedValue();

      await controller.update({ user: mockUser }, articleId, mockUpdateDto);

      expect(service.update).toHaveBeenCalledWith(
        mockUser.userId,
        articleId,
        mockUpdateDto,
      );
    });

    it('should handle service errors during update', async () => {
      const mockUser = { userId: 'user123', userName: 'testuser' };
      const articleId = 1;
      const mockUpdateDto = {
        title: 'Updated Article',
      };
      const mockError = new Error('Update failed');

      service.update.mockRejectedValue(mockError);

      await expect(
        controller.update({ user: mockUser }, articleId, mockUpdateDto),
      ).rejects.toThrow('Update failed');

      expect(service.update).toHaveBeenCalledWith(
        mockUser.userId,
        articleId,
        mockUpdateDto,
      );
    });
  });

  describe('remove', () => {
    it('should delete an article', async () => {
      const mockUser = { userId: 'user123', userName: 'testuser' };
      const articleId = 1;

      service.remove.mockResolvedValue();

      await controller.remove({ user: mockUser }, articleId);

      expect(service.remove).toHaveBeenCalledWith(mockUser, articleId);
    });

    it('should handle service errors during deletion', async () => {
      const mockUser = { userId: 'user123', userName: 'testuser' };
      const articleId = 1;
      const mockError = new Error('Article not found or unauthorized');

      service.remove.mockRejectedValue(mockError);

      await expect(
        controller.remove({ user: mockUser }, articleId),
      ).rejects.toThrow('Article not found or unauthorized');

      expect(service.remove).toHaveBeenCalledWith(mockUser, articleId);
    });

    it('should handle deletion of non-existent article', async () => {
      const mockUser = { userId: 'user123', userName: 'testuser' };
      const articleId = 999;
      const mockError = new Error('Article does not exist');

      service.remove.mockRejectedValue(mockError);

      await expect(
        controller.remove({ user: mockUser }, articleId),
      ).rejects.toThrow('Article does not exist');

      expect(service.remove).toHaveBeenCalledWith(mockUser, articleId);
    });
  });
});
