import { TestBed } from '@automock/jest';
import { CategoryService } from '../category.service';
import { PrismaService } from 'nestjs-prisma';
import { CreateCategoryDto } from '../dto/create-category.dto';

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
});
