import { TestBed } from '@automock/jest';
import { PermissionService } from '../permission.service';
import { PrismaService } from 'nestjs-prisma';
import { CreatePermissionDto } from '../dto/create-permission.dto';

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
          create: jest.fn(),
          findFirst: jest.fn(),
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

  describe('findTree', () => {
    it('should return all permissions when containButton is true', async () => {
      const mockPermissions = [
        {
          id: '1',
          pid: '0',
          name: 'test1',
          type: 'MENU',
          disabled: false,
        },
        {
          id: '2',
          pid: '1',
          name: 'test2',
          type: 'BUTTON',
          disabled: false,
        },
      ];

      const mockFindMany = prismaService.permission.findMany as jest.Mock;
      mockFindMany.mockResolvedValue(mockPermissions);

      const result = await permissionService.findTree(true);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: '1',
        name: 'test1',
        children: [
          {
            id: '2',
            name: 'test2',
          },
        ],
      });
      expect(mockFindMany).toHaveBeenCalledWith({
        where: {
          deleted: false,
        },
        select: {
          id: true,
          pid: true,
          name: true,
          type: true,
          disabled: true,
        },
        orderBy: {
          sort: 'desc',
        },
      });
    });

    it('should return non-button permissions when containButton is false', async () => {
      const mockPermissions = [
        {
          id: '1',
          pid: '0',
          name: 'test1',
          type: 'MENU',
          disabled: false,
        },
      ];

      const mockFindMany = prismaService.permission.findMany as jest.Mock;
      mockFindMany.mockResolvedValue(mockPermissions);

      const result = await permissionService.findTree(false);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: '1',
        name: 'test1',
      });
      expect(mockFindMany).toHaveBeenCalledWith({
        where: {
          deleted: false,
          type: {
            not: 'BUTTON',
          },
        },
        select: {
          id: true,
          pid: true,
          name: true,
          type: true,
          disabled: true,
        },
        orderBy: {
          sort: 'desc',
        },
      });
    });
  });

  describe('create', () => {
    it('should throw error when menu/directory path is empty', async () => {
      const createDto: CreatePermissionDto = {
        type: 'MENU',
        name: 'test',
      };

      await expect(permissionService.create(createDto)).rejects.toThrow(
        '目录/菜单的路径不能为空',
      );
    });

    it('should throw error when menu component is empty', async () => {
      const createDto: CreatePermissionDto = {
        type: 'MENU',
        name: 'test',
        path: '/test',
      };

      await expect(permissionService.create(createDto)).rejects.toThrow(
        '菜单的组件地址不能为空',
      );
    });

    it('should throw error when button permission is empty', async () => {
      const createDto: CreatePermissionDto = {
        type: 'BUTTON',
        name: 'test',
      };

      await expect(permissionService.create(createDto)).rejects.toThrow(
        '按钮的权限标识不能为空',
      );
    });

    it('should throw error when parent permission not found', async () => {
      const mockFindFirst = prismaService.permission.findFirst as jest.Mock;
      mockFindFirst.mockResolvedValue(null);

      const createDto: CreatePermissionDto = {
        type: 'MENU',
        name: 'test',
        path: '/test',
        component: 'Test',
        pid: 1,
      };

      await expect(permissionService.create(createDto)).rejects.toThrow(
        '父权限不存在',
      );
    });

    it('should throw error when permission name exists', async () => {
      const mockFindFirst = prismaService.permission.findFirst as jest.Mock;
      mockFindFirst.mockResolvedValue({
        name: 'test',
        type: 'MENU',
      });

      const createDto: CreatePermissionDto = {
        type: 'MENU',
        name: 'test',
        path: '/test',
        component: 'Test',
      };

      await expect(permissionService.create(createDto)).rejects.toThrow(
        '权限名称已存在',
      );
    });

    it('should throw error when permission exists', async () => {
      const mockFindFirst = prismaService.permission.findFirst as jest.Mock;
      mockFindFirst.mockResolvedValueOnce({
        permission: 'test:permission',
      });

      const createDto: CreatePermissionDto = {
        type: 'BUTTON',
        name: 'test',
        permission: 'test:permission',
      };

      await expect(permissionService.create(createDto)).rejects.toThrow(
        '权限标识已存在',
      );
    });

    it('should throw error when trying to add child to button permission', async () => {
      const mockFindFirst = prismaService.permission.findFirst as jest.Mock;
      mockFindFirst.mockResolvedValueOnce({
        type: 'BUTTON',
      });

      const createDto: CreatePermissionDto = {
        type: 'MENU',
        name: 'test',
        path: '/test',
        component: 'Test',
        pid: 1,
      };

      await expect(permissionService.create(createDto)).rejects.toThrow(
        '按钮权限不能添加子权限',
      );
    });

    it('should create permission successfully', async () => {
      const mockFindFirst = prismaService.permission.findFirst as jest.Mock;
      mockFindFirst.mockResolvedValue(null);

      const mockCreate = prismaService.permission.create as jest.Mock;
      mockCreate.mockResolvedValue({});

      const createDto: CreatePermissionDto = {
        type: 'MENU',
        name: 'test',
        path: '/test',
        component: 'Test',
      };

      await expect(permissionService.create(createDto)).resolves.not.toThrow();
      expect(mockCreate).toHaveBeenCalledWith({
        data: createDto,
      });
    });
  });
});
