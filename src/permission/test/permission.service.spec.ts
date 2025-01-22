import { TestBed } from '@automock/jest';
import { PermissionService } from '../permission.service';
import { PrismaService } from 'nestjs-prisma';

describe('PermissionService', () => {
  let permissionService: PermissionService;
  let prismaService: jest.Mocked<PrismaService>;

  beforeEach(async () => {
    const { unit, unitRef } = TestBed.create(PermissionService)
      .mock(PrismaService)
      .using({
        permission: {
          findUnique: jest.fn(),
          findMany: jest.fn(),
        },
      })
      .compile();

    permissionService = unit;
    prismaService = unitRef.get(PrismaService);
  });

  describe('findPermission', () => {
    it('should return user permission', async () => {
      const mockQueryRaw = prismaService.$queryRaw as jest.Mock;
      const userPermission = ['test'];
      mockQueryRaw.mockResolvedValue([
        { user_name: '', permissions: userPermission },
      ]);

      const result = await permissionService.findPermission('testId');
      expect(result).toEqual(userPermission);
    });

    it('should return empty array when user not found', async () => {
      const mockQueryRaw = prismaService.$queryRaw as jest.Mock;
      mockQueryRaw.mockResolvedValue([]);

      const result = await permissionService.findPermission('testId');
      expect(result).toEqual([]);
    });
  });

  describe('findAll', () => {
    it('should return empty list when no permissions found', async () => {
      const mockFindMany = prismaService.permission.findMany as jest.Mock;
      mockFindMany.mockResolvedValue([]);

      const result = await permissionService.findAll({});
      expect(result).toEqual({ list: [], total: 0 });
    });

    it('should return paginated permission list', async () => {
      const mockPermissions = [
        {
          id: '1',
          pid: '0',
          name: 'test1',
          type: 1,
          permission: 'test:1',
          icon: 'icon1',
          path: '/test1',
          sort: 1,
          disabled: false,
          createdAt: new Date('2023-01-01'),
        },
        {
          id: '2',
          pid: '0',
          name: 'test2',
          type: 1,
          permission: 'test:2',
          icon: 'icon2',
          path: '/test2',
          sort: 2,
          disabled: false,
          createdAt: new Date('2023-01-02'),
        },
      ];

      const mockFindMany = prismaService.permission.findMany as jest.Mock;
      mockFindMany.mockResolvedValue(mockPermissions);

      const result = await permissionService.findAll({
        page: 1,
        pageSize: 10,
      });

      expect(result.total).toBe(2);
      expect(result.list).toHaveLength(2);
      expect(result.list[0]).toMatchObject({
        id: '1',
        name: 'test1',
        createdAt: '2023-01-01T00:00:00.000Z',
      });
    });
  });
});
