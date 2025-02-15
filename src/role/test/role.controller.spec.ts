import { TestBed } from '@automock/jest';
import { RoleController } from '../role.controller';
import { RoleService } from '../role.service';
import { RoleListEntity } from '../entities/role-list.entity';

describe('RoleController', () => {
  let controller: RoleController;
  let service: jest.Mocked<RoleService>;

  beforeAll(() => {
    const { unit, unitRef } = TestBed.create(RoleController).compile();

    controller = unit;
    service = unitRef.get(RoleService);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    const mockQuery = {
      page: 1,
      pageSize: 10,
      name: 'admin',
    };

    const mockResult: RoleListEntity = {
      list: [
        {
          id: 1,
          name: 'admin',
          description: 'Admin role',
          disabled: false,
          createdAt: '2023-01-01 00:00:00',
          updatedAt: '2023-01-01 00:00:00',
        },
      ],
      total: 10,
    };

    it('should return role list', async () => {
      service.findAll.mockResolvedValue(mockResult);

      const result = await controller.findAll(mockQuery);

      expect(service.findAll).toHaveBeenCalledWith(mockQuery);
      expect(result).toEqual(mockResult);
    });
  });

  describe('create', () => {
    const mockBody = {
      name: 'admin',
      description: 'Admin role',
    };

    it('should create role', async () => {
      service.create.mockResolvedValue(undefined);

      await controller.create(mockBody);

      expect(service.create).toHaveBeenCalledWith(mockBody);
    });

    it('should throw error when create role failed', async () => {
      service.create.mockRejectedValue(new Error('Create role failed'));

      await expect(controller.create(mockBody)).rejects.toThrowError(
        'Create role failed',
      );
    });
  });
});
