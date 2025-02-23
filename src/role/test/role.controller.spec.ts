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

  describe('findOne', () => {
    const mockId = 1;
    const mockResult = {
      id: 1,
      name: 'admin',
      description: 'Admin role',
      disabled: false,
      createdAt: '2023-01-01 00:00:00',
      updatedAt: '2023-01-01 00:00:00',
      permissions: [1, 2],
    };

    it('should return role detail', async () => {
      service.findOne.mockResolvedValue(mockResult);

      const result = await controller.findOne(mockId);

      expect(service.findOne).toHaveBeenCalledWith(mockId);
      expect(result).toEqual(mockResult);
    });

    it('should throw error when role not found', async () => {
      service.findOne.mockRejectedValue(new Error('Role not found'));

      await expect(controller.findOne(mockId)).rejects.toThrow(
        'Role not found',
      );
    });
  });

  describe('update', () => {
    const mockId = 1;
    const mockBody = {
      name: 'admin',
      description: 'Updated role',
      permissions: [1, 2, 3],
    };

    it('should update role successfully', async () => {
      service.update.mockResolvedValue(undefined);

      await controller.update(mockId, mockBody);

      expect(service.update).toHaveBeenCalledWith(mockId, mockBody);
    });

    it('should throw error when update role failed', async () => {
      service.update.mockRejectedValue(new Error('Update role failed'));

      await expect(controller.update(mockId, mockBody)).rejects.toThrow(
        'Update role failed',
      );
    });
  });

  describe('remove', () => {
    const mockId = 1;

    it('should remove role successfully', async () => {
      service.remove.mockResolvedValue(undefined);

      await controller.remove(mockId);

      expect(service.remove).toHaveBeenCalledWith(mockId);
    });

    it('should throw error when remove role failed', async () => {
      service.remove.mockRejectedValue(new Error('Remove role failed'));

      await expect(controller.remove(mockId)).rejects.toThrow(
        'Remove role failed',
      );
    });
  });
});
