import { TestBed } from '@automock/jest';
import { PermissionController } from '../permission.controller';
import { PermissionService } from '../permission.service';
import { CreatePermissionDto } from '../dto/create-permission.dto';

describe('PermissionController', () => {
  let controller: PermissionController;
  let permissionService: jest.Mocked<PermissionService>;

  beforeAll(() => {
    const { unit, unitRef } = TestBed.create(PermissionController).compile();

    controller = unit;
    permissionService = unitRef.get(PermissionService);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    const mockQueryDto = {
      page: 1,
      pageSize: 10,
    };

    const mockResponse = {
      list: [
        {
          id: 1,
          pid: 0,
          name: 'test1',
          type: 'MENU' as const,
          permission: 'test:1',
          icon: 'icon1',
          path: '/test1',
          sort: 1,
          disabled: false,
          createdAt: '2022-02-02T00:00:00.000Z',
        },
      ],
      total: 1,
      page: 1,
      pageSize: 10,
    };

    it('should return permission list', async () => {
      permissionService.findAll.mockResolvedValue(mockResponse);

      const result = await controller.findAll(mockQueryDto);

      expect(permissionService.findAll).toHaveBeenCalledWith(mockQueryDto);
      expect(result).toEqual(mockResponse);
      expect(permissionService.findAll).toHaveBeenCalledTimes(1);
    });

    it('should handle empty results', async () => {
      const emptyResponse = {
        list: [],
        total: 0,
        page: 1,
        pageSize: 10,
      };

      permissionService.findAll.mockResolvedValue(emptyResponse);

      const result = await controller.findAll(mockQueryDto);

      expect(permissionService.findAll).toHaveBeenCalledWith(mockQueryDto);
      expect(result).toEqual(emptyResponse);
    });
  });

  describe('findTree', () => {
    const mockQueryDto = {
      containButton: false,
    };

    const mockTreeResponse = [
      {
        id: 1,
        pid: 0,
        name: 'test1',
        type: 'MENU' as const,
        permission: 'test:1',
        icon: 'icon1',
        path: '/test1',
        sort: 1,
        disabled: false,
        children: [],
      },
    ];

    it('should return permission tree', async () => {
      permissionService.findTree.mockResolvedValue(mockTreeResponse);

      const result = await controller.findTree(mockQueryDto);

      expect(permissionService.findTree).toHaveBeenCalledWith(
        mockQueryDto.containButton,
      );
      expect(result).toEqual(mockTreeResponse);
      expect(permissionService.findTree).toHaveBeenCalledTimes(1);
    });

    it('should handle empty tree results', async () => {
      permissionService.findTree.mockResolvedValue([]);

      const result = await controller.findTree(mockQueryDto);

      expect(permissionService.findTree).toHaveBeenCalledWith(
        mockQueryDto.containButton,
      );
      expect(result).toEqual([]);
    });

    it('should handle errors when getting tree', async () => {
      const error = new Error('Failed to get permission tree');
      permissionService.findTree.mockRejectedValue(error);

      await expect(controller.findTree(mockQueryDto)).rejects.toThrow(error);
      expect(permissionService.findTree).toHaveBeenCalledWith(
        mockQueryDto.containButton,
      );
    });
  });

  describe('create', () => {
    const mockCreateDto: CreatePermissionDto = {
      pid: 0,
      name: 'test1',
      type: 'MENU' as const,
      permission: 'test:1',
      icon: 'icon1',
      path: '/test1',
      sort: 1,
    };

    it('should create a new permission', async () => {
      permissionService.create.mockResolvedValue(null);

      controller.create(mockCreateDto);
      expect(permissionService.create).toHaveBeenCalledWith(mockCreateDto);
      expect(permissionService.create).toHaveBeenCalledTimes(1);
    });

    it('should handle creation errors', async () => {
      const error = new Error('Creation failed');
      permissionService.create.mockRejectedValue(error);

      await expect(controller.create(mockCreateDto)).rejects.toThrow(error);
      expect(permissionService.create).toHaveBeenCalledWith(mockCreateDto);
    });
  });

  describe('findOne', () => {
    const mockId = 1;
    const mockPermission = {
      id: 1,
      pid: 0,
      name: 'test1',
      type: 'MENU' as const,
      permission: 'test:1',
      icon: 'icon1',
      path: '/test1',
      sort: 1,
      disabled: false,
      createdAt: '2022-02-02T00:00:00.000Z',
    };

    it('should return a permission by id', async () => {
      permissionService.findOne.mockResolvedValue(mockPermission as any);

      const result = await controller.findOne(mockId);

      expect(permissionService.findOne).toHaveBeenCalledWith(mockId);
      expect(result).toEqual(mockPermission);
      expect(permissionService.findOne).toHaveBeenCalledTimes(1);
    });

    it('should handle not found permission', async () => {
      permissionService.findOne.mockResolvedValue(null);

      const result = await controller.findOne(mockId);

      expect(permissionService.findOne).toHaveBeenCalledWith(mockId);
      expect(result).toBeNull();
    });

    it('should handle errors when getting permission', async () => {
      const error = new Error('Failed to get permission');
      permissionService.findOne.mockRejectedValue(error);

      await expect(controller.findOne(mockId)).rejects.toThrow(error);
      expect(permissionService.findOne).toHaveBeenCalledWith(mockId);
    });
  });

  describe('update', () => {
    const mockId = 1;
    const mockUpdateDto = {
      name: 'updated',
      type: 'MENU' as const,
      permission: 'test:updated',
      icon: 'updated-icon',
      path: '/updated',
      sort: 2,
    };

    it('should update a permission', async () => {
      permissionService.update.mockResolvedValue(null);

      await controller.update(mockId, mockUpdateDto);

      expect(permissionService.update).toHaveBeenCalledWith(
        mockId,
        mockUpdateDto,
      );
      expect(permissionService.update).toHaveBeenCalledTimes(1);
    });

    it('should handle update errors', async () => {
      const error = new Error('Update failed');
      permissionService.update.mockRejectedValue(error);

      await expect(controller.update(mockId, mockUpdateDto)).rejects.toThrow(
        error,
      );
      expect(permissionService.update).toHaveBeenCalledWith(
        mockId,
        mockUpdateDto,
      );
    });
  });

  describe('remove', () => {
    const mockId = 1;

    it('should remove a permission', async () => {
      permissionService.remove.mockResolvedValue(null);

      await controller.remove(mockId);

      expect(permissionService.remove).toHaveBeenCalledWith(mockId);
      expect(permissionService.remove).toHaveBeenCalledTimes(1);
    });

    it('should handle remove errors', async () => {
      const error = new Error('Remove failed');
      permissionService.remove.mockRejectedValue(error);

      await expect(controller.remove(mockId)).rejects.toThrow(error);
      expect(permissionService.remove).toHaveBeenCalledWith(mockId);
    });
  });

  describe('batchRemove', () => {
    const mockIds = { ids: [1, 2, 3] };

    it('should remove multiple permissions', async () => {
      permissionService.batchRemove.mockResolvedValue(null);

      await controller.batchRemove(mockIds);

      expect(permissionService.batchRemove).toHaveBeenCalledWith(mockIds.ids);
      expect(permissionService.batchRemove).toHaveBeenCalledTimes(1);
    });

    it('should handle batch remove errors', async () => {
      const error = new Error('Batch remove failed');
      permissionService.batchRemove.mockRejectedValue(error);

      await expect(controller.batchRemove(mockIds)).rejects.toThrow(error);
      expect(permissionService.batchRemove).toHaveBeenCalledWith(mockIds.ids);
    });
  });
});
