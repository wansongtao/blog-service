import { TestBed } from '@automock/jest';
import { CategoryController } from '../category.controller';
import { CategoryService } from '../category.service';
import { CreateCategoryDto } from '../dto/create-category.dto';

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
});
