import { TestBed } from '@automock/jest';
import { PermissionController } from '../permission.controller';
import { PermissionService } from '../permission.service';

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
});
