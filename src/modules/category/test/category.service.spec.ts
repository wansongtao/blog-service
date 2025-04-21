import { TestBed } from '@automock/jest';
import { CategoryService } from '../category.service';
import { PrismaService } from 'nestjs-prisma';
import { CreateCategoryDto } from '../dto/create-category.dto';
import { QueryCategoryDto } from '../dto/query-category.dto';
import { CategoryTreeEntity } from '../entities/category-tree.entity';
import { CategoryDetailEntity } from '../entities/category-detail.entity';

describe('CategoryService', () => {
  let service: CategoryService;
  let prismaService: jest.Mocked<PrismaService>;

  beforeEach(async () => {
    const { unit, unitRef } = TestBed.create(CategoryService)
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
    prismaService = unitRef.get(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const mockCreateDto: CreateCategoryDto = { name: 'Test Category', pid: 1 };

    it('should throw BadRequestException if parent category does not exist', async () => {
      (prismaService.category.findMany as jest.Mock).mockResolvedValueOnce([]);

      await expect(service.create(mockCreateDto)).rejects.toThrow(
        'Parent category does not exist',
      );
    });

    it('should throw BadRequestException if category name already exists', async () => {
      (prismaService.category.findMany as jest.Mock).mockResolvedValueOnce([
        { id: 2, name: 'Test Category' },
        { id: 1, name: 'Parent Category' },
      ]);

      await expect(service.create(mockCreateDto)).rejects.toThrow(
        'Category name already exists',
      );
    });

    it('should throw BadRequestException if same name exists but not as parent', async () => {
      (prismaService.category.findMany as jest.Mock).mockResolvedValueOnce([
        { id: 2, name: 'Test Category' },
      ]);

      await expect(service.create({ name: 'Test Category' })).rejects.toThrow(
        'Category name already exists',
      );
    });

    it('should throw BadRequestException if parent category does not exist but category name exists elsewhere', async () => {
      (prismaService.category.findMany as jest.Mock).mockResolvedValueOnce([
        { id: 2, name: 'Test Category' },
      ]);

      await expect(service.create(mockCreateDto)).rejects.toThrow(
        'Parent category does not exist',
      );
    });

    it('should create category successfully when parent exists and name is unique', async () => {
      (prismaService.category.findMany as jest.Mock).mockResolvedValueOnce([
        { id: 1, name: 'Parent Category' },
      ]);
      (prismaService.category.create as jest.Mock).mockResolvedValueOnce({
        id: 3,
        ...mockCreateDto,
      });

      await expect(service.create(mockCreateDto)).resolves.not.toThrow();
      expect(prismaService.category.create).toHaveBeenCalledWith({
        data: mockCreateDto,
      });
    });

    it('should create category successfully without parent', async () => {
      const dtoWithoutParent: CreateCategoryDto = { name: 'Test Category' };
      (prismaService.category.findMany as jest.Mock).mockResolvedValueOnce([]);
      (prismaService.category.create as jest.Mock).mockResolvedValueOnce({
        id: 3,
        ...dtoWithoutParent,
      });

      await expect(service.create(dtoWithoutParent)).resolves.not.toThrow();
      expect(prismaService.category.create).toHaveBeenCalledWith({
        data: dtoWithoutParent,
      });
    });
  });

  describe('findAll', () => {
    const mockDate = new Date('2023-01-01T00:00:00Z');
    const mockCategories = [
      {
        id: 1,
        name: 'Category 1',
        description: 'Description 1',
        hidden: false,
        pid: null,
        sort: 1,
        createdAt: mockDate,
        updatedAt: mockDate,
      },
      {
        id: 2,
        name: 'Category 2',
        description: 'Description 2',
        hidden: false,
        pid: 1,
        sort: 2,
        createdAt: mockDate,
        updatedAt: mockDate,
      },
    ];

    it('should return empty list when no categories found', async () => {
      (prismaService.category.findMany as jest.Mock).mockResolvedValueOnce([]);
      const query: QueryCategoryDto = { page: 1, pageSize: 10 };

      const result = await service.findAll(query);

      expect(result).toEqual({ list: [], total: 0 });
      expect(prismaService.category.findMany).toHaveBeenCalled();
    });

    it('should return categories with pagination', async () => {
      (prismaService.category.findMany as jest.Mock).mockResolvedValueOnce(
        mockCategories,
      );
      const query: QueryCategoryDto = { page: 1, pageSize: 10 };

      const result = await service.findAll(query);

      expect(result.total).toBe(1); // After tree transformation
      expect(result.list.length).toBeLessThanOrEqual(query.pageSize);
      expect(prismaService.category.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            deleted: false,
          }),
          orderBy: expect.any(Array),
          select: expect.any(Object),
        }),
      );
    });

    it('should apply search filters correctly', async () => {
      (prismaService.category.findMany as jest.Mock).mockResolvedValueOnce([]);
      const query: QueryCategoryDto = {
        keyword: 'test',
        beginTime: '2025-03-25',
        endTime: '2025-04-15',
        sort: 'asc',
      };

      await service.findAll(query);

      expect(prismaService.category.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            deleted: false,
            name: {
              contains: 'test',
              mode: 'insensitive',
            },
            createdAt: {
              gte: query.beginTime,
              lte: query.endTime,
            },
          }),
          orderBy: expect.arrayContaining([{ createdAt: 'asc' }]),
        }),
      );
    });

    it('should return empty list when offset exceeds available categories', async () => {
      (prismaService.category.findMany as jest.Mock).mockResolvedValueOnce(
        mockCategories,
      );
      const query: QueryCategoryDto = { page: 10, pageSize: 10 };

      const result = await service.findAll(query);

      expect(result).toEqual({ list: [], total: 0 });
    });

    it('should return empty list when categories exist but result in empty tree', async () => {
      // Mock some categories that after tree transformation would result in empty tree
      // This can happen when all categories are sub-categories but parent doesn't exist
      const orphanCategories = [
        {
          id: 2,
          name: 'Child Category',
          description: 'Description',
          hidden: false,
          sort: 1,
          createdAt: new Date('2023-01-01'),
          updatedAt: new Date('2023-01-01'),
        },
        {
          id: 3,
          name: 'Child Category',
          description: 'Description',
          hidden: false,
          pid: 2, // Non-existent parent
          sort: 1,
          createdAt: new Date('2023-01-01'),
          updatedAt: new Date('2023-01-01'),
        },
      ];

      (prismaService.category.findMany as jest.Mock).mockResolvedValueOnce(
        orphanCategories,
      );
      const query: QueryCategoryDto = { page: 2, pageSize: 2 };

      const result = await service.findAll(query);

      expect(result).toEqual({ list: [], total: 0 });
      expect(prismaService.category.findMany).toHaveBeenCalled();
    });

    it('should convert dates to ISO strings in response', async () => {
      (prismaService.category.findMany as jest.Mock).mockResolvedValueOnce(
        mockCategories,
      );
      const query: QueryCategoryDto = { page: 1, pageSize: 10 };

      const result = await service.findAll(query);

      if (result.list.length > 0) {
        expect(typeof result.list[0].createdAt).toBe('string');
        expect(typeof result.list[0].updatedAt).toBe('string');
      }
    });
  });

  describe('findTree', () => {
    it('should return an empty array when no categories exist', async () => {
      (prismaService.category.findMany as jest.Mock).mockResolvedValueOnce([]);

      const result = await service.findTree();

      expect(result).toEqual([]);
      expect(prismaService.category.findMany).toHaveBeenCalledWith({
        where: {
          deleted: false,
        },
        orderBy: {
          sort: 'desc',
        },
        select: {
          id: true,
          pid: true,
          name: true,
        },
      });
    });

    it('should return properly structured category tree', async () => {
      const mockCategories: CategoryTreeEntity[] = [
        { id: 1, name: 'Parent 1', pid: null },
        { id: 2, name: 'Child 1', pid: 1 },
        { id: 3, name: 'Child 2', pid: 1 },
        { id: 4, name: 'Parent 2', pid: null },
        { id: 5, name: 'Grandchild', pid: 2 },
      ];

      (prismaService.category.findMany as jest.Mock).mockResolvedValueOnce(
        mockCategories,
      );

      const result: CategoryTreeEntity[] = await service.findTree();

      expect(result).toHaveLength(2); // Two root categories

      // Check first root node and children
      expect(result[0].id).toBe(1);
      expect(result[0].name).toBe('Parent 1');
      expect(result[0].children).toHaveLength(2);

      // Check second root node
      expect(result[1].id).toBe(4);
      expect(result[1].name).toBe('Parent 2');
      expect(result[1].children).toBeUndefined();

      // Check nested child
      expect(result[0].children[0].id).toBe(2);
      expect(result[0].children[0].children).toHaveLength(1);
      expect(result[0].children[0].children[0].id).toBe(5);
    });

    it('should handle single-level categories correctly', async () => {
      const mockCategories: CategoryTreeEntity[] = [
        { id: 1, name: 'Category 1', pid: null },
        { id: 2, name: 'Category 2', pid: null },
        { id: 3, name: 'Category 3', pid: null },
      ];

      (prismaService.category.findMany as jest.Mock).mockResolvedValueOnce(
        mockCategories,
      );

      const result = await service.findTree();

      expect(result).toHaveLength(3);
      expect(
        result.every((item) => !item.children || item.children.length === 0),
      ).toBe(true);
    });
  });

  describe('findOne', () => {
    const mockCategoryId = 1;
    const mockCategory: CategoryDetailEntity = {
      pid: null,
      name: 'Test Category',
      sort: 0,
      hidden: false,
      description: 'Test Description',
    };

    it('should return category when it exists', async () => {
      (prismaService.category.findUnique as jest.Mock).mockResolvedValueOnce(
        mockCategory,
      );

      const result = await service.findOne(mockCategoryId);

      expect(result).toEqual(mockCategory);
      expect(prismaService.category.findUnique).toHaveBeenCalledWith({
        where: {
          deleted: false,
          id: mockCategoryId,
        },
        select: {
          pid: true,
          name: true,
          sort: true,
          hidden: true,
          description: true,
        },
      });
    });

    it('should return null when category does not exist', async () => {
      (prismaService.category.findUnique as jest.Mock).mockResolvedValueOnce(
        null,
      );

      const result = await service.findOne(mockCategoryId);

      expect(result).toBeNull();
      expect(prismaService.category.findUnique).toHaveBeenCalled();
    });

    it('should correctly select only required fields', async () => {
      (prismaService.category.findUnique as jest.Mock).mockResolvedValueOnce(
        {},
      );

      await service.findOne(mockCategoryId);

      expect(prismaService.category.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          select: {
            pid: true,
            name: true,
            sort: true,
            hidden: true,
            description: true,
          },
        }),
      );
    });
  });

  describe('update', () => {
    const mockUpdateDto = { name: 'Updated Category', sort: 2 };
    const categoryId = 1;

    it('should throw BadRequestException when setting parent category to itself', async () => {
      await expect(
        service.update(categoryId, { pid: categoryId }),
      ).rejects.toThrow('Parent category cannot be itself');
      expect(prismaService.category.findMany).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when category does not exist', async () => {
      (prismaService.category.findMany as jest.Mock).mockResolvedValueOnce([
        { id: 2, name: 'Other Category', pid: null },
      ]);

      await expect(service.update(categoryId, mockUpdateDto)).rejects.toThrow(
        'Category does not exist',
      );
    });

    it('should throw BadRequestException when parent category does not exist', async () => {
      (prismaService.category.findMany as jest.Mock).mockResolvedValueOnce([
        { id: categoryId, name: 'Original Category', pid: null },
      ]);

      await expect(service.update(categoryId, { pid: 999 })).rejects.toThrow(
        'Parent category does not exist',
      );
    });

    it('should throw BadRequestException when category name already exists', async () => {
      (prismaService.category.findMany as jest.Mock).mockResolvedValueOnce([
        { id: categoryId, name: 'Original Category', pid: null },
        { id: 2, name: 'Updated Category', pid: null },
      ]);

      await expect(service.update(categoryId, mockUpdateDto)).rejects.toThrow(
        'Category name already exists',
      );
    });

    it('should throw BadRequestException when parent would create circular reference', async () => {
      const allCategories = [
        { id: 1, name: 'Parent', pid: null },
        { id: 2, name: 'Child', pid: 1 },
        { id: 3, name: 'Grandchild', pid: 2 },
      ];

      (prismaService.category.findMany as jest.Mock).mockResolvedValueOnce(
        allCategories,
      );

      await expect(service.update(1, { pid: 3 })).rejects.toThrow(
        'Parent category cannot be a child of itself',
      );
    });

    it('should update category successfully when changing properties without pid', async () => {
      (prismaService.category.findMany as jest.Mock).mockResolvedValueOnce([
        { id: categoryId, name: 'Original Category' },
      ]);
      (prismaService.category.update as jest.Mock).mockResolvedValueOnce({
        id: categoryId,
        ...mockUpdateDto,
      });

      await expect(
        service.update(categoryId, mockUpdateDto),
      ).resolves.not.toThrow();
      expect(prismaService.category.update).toHaveBeenCalledWith({
        where: { id: categoryId },
        data: mockUpdateDto,
      });
    });

    it('should update category successfully when changing parent', async () => {
      const updateData = { pid: 2 };
      (prismaService.category.findMany as jest.Mock).mockResolvedValueOnce([
        { id: categoryId, name: 'Original Category', pid: null },
        { id: 2, name: 'New Parent', pid: null },
      ]);
      (prismaService.category.update as jest.Mock).mockResolvedValueOnce({
        id: categoryId,
        ...updateData,
      });

      await expect(
        service.update(categoryId, updateData),
      ).resolves.not.toThrow();
      expect(prismaService.category.update).toHaveBeenCalledWith({
        where: { id: categoryId },
        data: updateData,
      });
    });

    it('should throw BadRequestException when updating pid of non-existent category', async () => {
      const nonExistentCategoryId = 999;
      const updateData = { pid: 2 };

      // Mock findMany to return categories, but none matching our target ID
      (prismaService.category.findMany as jest.Mock).mockResolvedValueOnce([
        { id: 1, name: 'Category 1', pid: null },
        { id: 2, name: 'Category 2', pid: null },
        // Notice no category with id 999
      ]);

      await expect(
        service.update(nonExistentCategoryId, updateData),
      ).rejects.toThrow('Category does not exist');

      expect(prismaService.category.findMany).toHaveBeenCalled();
      expect(prismaService.category.update).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when updating both pid and name, but name already exists', async () => {
      const categoryId = 1;
      const updateData = { pid: 3, name: 'Existing Name' };

      const allCategories = [
        { id: categoryId, name: 'Original Category', pid: null },
        { id: 2, name: 'Existing Name', pid: null }, // category with same name already exists
        { id: 3, name: 'New Parent', pid: null },
      ];

      (prismaService.category.findMany as jest.Mock).mockResolvedValueOnce(
        allCategories,
      );

      await expect(service.update(categoryId, updateData)).rejects.toThrow(
        'Category name already exists',
      );

      expect(prismaService.category.findMany).toHaveBeenCalled();
      expect(prismaService.category.update).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    const categoryId = 1;

    it('should throw BadRequestException when category does not exist', async () => {
      (prismaService.category.findUnique as jest.Mock).mockResolvedValueOnce(
        null,
      );

      await expect(service.remove(categoryId)).rejects.toThrow(
        'Category does not exist',
      );
      expect(prismaService.category.findUnique).toHaveBeenCalledWith({
        where: {
          id: categoryId,
          deleted: false,
        },
        select: {
          id: true,
          children: {
            select: { id: true },
          },
        },
      });
    });

    it('should throw BadRequestException when category has children', async () => {
      (prismaService.category.findUnique as jest.Mock).mockResolvedValueOnce({
        id: categoryId,
        children: [{ id: 2 }, { id: 3 }],
      });

      await expect(service.remove(categoryId)).rejects.toThrow(
        'Parent category cannot be deleted',
      );
      expect(prismaService.category.update).not.toHaveBeenCalled();
    });

    it('should soft delete category successfully when it exists and has no children', async () => {
      (prismaService.category.findUnique as jest.Mock).mockResolvedValueOnce({
        id: categoryId,
        children: [],
      });
      (prismaService.category.update as jest.Mock).mockResolvedValueOnce({
        id: categoryId,
        deleted: true,
      });

      await expect(service.remove(categoryId)).resolves.not.toThrow();
      expect(prismaService.category.update).toHaveBeenCalledWith({
        where: { id: categoryId },
        data: { deleted: true },
      });
    });
  });
});
