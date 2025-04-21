import { TestBed } from '@automock/jest';
import { CategoryController } from '../category.controller';
import { CategoryService } from '../category.service';
import { CreateCategoryDto } from '../dto/create-category.dto';
import { CategoryListEntity } from '../entities/category-list.entity';

describe('CategoryController', () => {
  let controller: CategoryController;
  let service: jest.Mocked<CategoryService>;

  beforeAll(() => {
    const { unit, unitRef } = TestBed.create(CategoryController).compile();

    controller = unit;
    service = unitRef.get(CategoryService);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should call categoryService.create with the provided data', async () => {
      // Arrange
      const createCategoryDto: CreateCategoryDto = {
        name: 'Test Category',
        description: 'Test Description',
      };
      service.create.mockResolvedValue();

      // Act
      const result = await controller.create(createCategoryDto);

      // Assert
      expect(service.create).toHaveBeenCalledWith(createCategoryDto);
      expect(result).toBeUndefined();
    });

    it('should throw an error when categoryService.create fails', async () => {
      // Arrange
      const createCategoryDto = {
        name: 'Test Category',
        description: 'Test Description',
      };
      const error = new Error('Create category failed');
      service.create.mockRejectedValue(error);

      // Act & Assert
      await expect(controller.create(createCategoryDto)).rejects.toThrow(error);
      expect(service.create).toHaveBeenCalledWith(createCategoryDto);
    });
  });

  describe('findAll', () => {
    it('should return category list when categoryService.findAll succeeds', async () => {
      // Arrange
      const queryParams = {
        page: 1,
        pageSize: 10,
        name: 'test',
      };
      const categoryList: CategoryListEntity = {
        list: [
          {
            id: 1,
            pid: null,
            name: 'Category 1',
            description: 'Description 1',
            hidden: false,
            sort: 0,
            updatedAt: '2025-02-20 12:12:12',
            createdAt: '2025-02-25 13:13:13',
            children: [],
          },
          {
            id: 2,
            pid: null,
            name: 'Category 2',
            description: 'Description 2',
            hidden: false,
            sort: 0,
            updatedAt: '2025-02-20 12:12:12',
            createdAt: '2025-02-25 13:13:13',
          },
        ],
        total: 2,
      };
      service.findAll.mockResolvedValue(categoryList);

      // Act
      const result = await controller.findAll(queryParams);

      // Assert
      expect(service.findAll).toHaveBeenCalledWith(queryParams);
      expect(result).toEqual(categoryList);
    });

    it('should throw an error when categoryService.findAll fails', async () => {
      // Arrange
      const queryParams = {
        page: 1,
        pageSize: 10,
      };
      const error = new Error('Failed to retrieve categories');
      service.findAll.mockRejectedValue(error);

      // Act & Assert
      await expect(controller.findAll(queryParams)).rejects.toThrow(error);
      expect(service.findAll).toHaveBeenCalledWith(queryParams);
    });
  });

  describe('findTree', () => {
    it('should return category tree when categoryService.findTree succeeds', async () => {
      // Arrange
      const categoryTree = [
        {
          id: 1,
          pid: null,
          name: 'Category 1',
          children: [
            {
              id: 3,
              pid: 1,
              name: 'Subcategory 1',
            },
          ],
        },
        {
          id: 2,
          pid: null,
          name: 'Category 2',
        },
      ];
      service.findTree.mockResolvedValue(categoryTree);

      // Act
      const result = await controller.findTree();

      // Assert
      expect(service.findTree).toHaveBeenCalled();
      expect(result).toEqual(categoryTree);
    });

    it('should throw an error when categoryService.findTree fails', async () => {
      // Arrange
      const error = new Error('Failed to retrieve category tree');
      service.findTree.mockRejectedValue(error);

      // Act & Assert
      await expect(controller.findTree()).rejects.toThrow(error);
      expect(service.findTree).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return category detail when categoryService.findOne succeeds', async () => {
      // Arrange
      const categoryId = 1;
      const categoryDetail = {
        id: 1,
        pid: null,
        name: 'Category 1',
        description: 'Description 1',
        hidden: false,
        sort: 0,
        updatedAt: '2025-02-20 12:12:12',
        createdAt: '2025-02-25 13:13:13',
      };
      service.findOne.mockResolvedValue(categoryDetail);

      // Act
      const result = await controller.findOne(categoryId);

      // Assert
      expect(service.findOne).toHaveBeenCalledWith(categoryId);
      expect(result).toEqual(categoryDetail);
    });

    it('should throw an error when categoryService.findOne fails', async () => {
      // Arrange
      const categoryId = 999;
      const error = new Error('Category not found');
      service.findOne.mockRejectedValue(error);

      // Act & Assert
      await expect(controller.findOne(categoryId)).rejects.toThrow(error);
      expect(service.findOne).toHaveBeenCalledWith(categoryId);
    });
  });

  describe('update', () => {
    it('should call categoryService.update with the correct parameters', async () => {
      // Arrange
      const categoryId = 1;
      const updateCategoryDto = {
        name: 'Updated Category',
        description: 'Updated Description',
        sort: 1,
      };
      service.update.mockResolvedValue();

      // Act
      const result = await controller.update(categoryId, updateCategoryDto);

      // Assert
      expect(service.update).toHaveBeenCalledWith(
        categoryId,
        updateCategoryDto,
      );
      expect(result).toEqual(undefined);
    });

    it('should throw an error when categoryService.update fails', async () => {
      // Arrange
      const categoryId = 1;
      const updateCategoryDto = {
        name: 'Updated Category',
      };
      const error = new Error('Update failed');
      service.update.mockRejectedValue(error);

      // Act & Assert
      await expect(
        controller.update(categoryId, updateCategoryDto),
      ).rejects.toThrow(error);
      expect(service.update).toHaveBeenCalledWith(
        categoryId,
        updateCategoryDto,
      );
    });
  });

  describe('remove', () => {
    it('should call categoryService.remove with the correct id', async () => {
      // Arrange
      const categoryId = 1;
      service.remove.mockResolvedValue();

      // Act
      const result = await controller.remove(categoryId);

      // Assert
      expect(service.remove).toHaveBeenCalledWith(categoryId);
      expect(result).toEqual(undefined);
    });

    it('should throw an error when categoryService.remove fails', async () => {
      // Arrange
      const categoryId = 1;
      const error = new Error('Category cannot be deleted');
      service.remove.mockRejectedValue(error);

      // Act & Assert
      await expect(controller.remove(categoryId)).rejects.toThrow(error);
      expect(service.remove).toHaveBeenCalledWith(categoryId);
    });
  });
});
