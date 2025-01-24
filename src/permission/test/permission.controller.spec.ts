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
});
