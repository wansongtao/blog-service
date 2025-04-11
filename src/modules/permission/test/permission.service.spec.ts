import { TestBed } from '@automock/jest';
import { PermissionService } from '../permission.service';
import { PrismaService } from 'nestjs-prisma';
import { CreatePermissionDto } from '../dto/create-permission.dto';
import { UpdatePermissionDto } from '../dto/update-permission.dto';

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
    it('should return empty list when no permissions match criteria', async () => {
      const mockPermissions = [];
      const mockFindMany = prismaService.permission.findMany as jest.Mock;
      mockFindMany.mockResolvedValue(mockPermissions);

      const query = { page: 1, pageSize: 10 };
      const result = await permissionService.findAll(query);

      expect(result).toEqual({ list: [], total: 0 });
      expect(mockFindMany).toHaveBeenCalledWith({
        where: {
          deleted: false,
          name: {
            contains: undefined,
            mode: 'insensitive',
          },
          disabled: undefined,
          type: undefined,
          createdAt: {
            gte: undefined,
            lte: undefined,
          },
        },
        select: {
          id: true,
          pid: true,
          name: true,
          type: true,
          permission: true,
          icon: true,
          path: true,
          sort: true,
          disabled: true,
          createdAt: true,
        },
        orderBy: [{ sort: 'desc' }, { createdAt: 'desc' }],
      });
    });

    it('should return paginated list when permissions found', async () => {
      const createdAt = new Date();
      const mockPermissions = [
        {
          id: 1,
          pid: 0,
          name: 'test1',
          type: 'MENU',
          permission: null,
          icon: 'icon1',
          path: '/test1',
          sort: 1,
          disabled: false,
          createdAt,
        },
        {
          id: 2,
          pid: 1,
          name: 'test2',
          type: 'BUTTON',
          permission: 'test:permission',
          icon: 'icon2',
          path: '/test2',
          sort: 2,
          disabled: false,
          createdAt,
        },
      ];

      const mockFindMany = prismaService.permission.findMany as jest.Mock;
      mockFindMany.mockResolvedValue(mockPermissions);

      const query = {
        keyword: 'test',
        sort: 'asc' as const,
      };
      const result = await permissionService.findAll(query);

      expect(result.total).toBe(1); // Because mockPermissions will generate 1 root item with 1 child
      expect(result.list).toHaveLength(1);
      expect(result.list[0]).toMatchObject({
        id: 1,
        name: 'test1',
        children: [expect.objectContaining({ id: 2, name: 'test2' })],
      });
    });

    it('should apply all filtering criteria correctly', async () => {
      const mockPermissions = [];
      const mockFindMany = prismaService.permission.findMany as jest.Mock;
      mockFindMany.mockResolvedValue(mockPermissions);

      const beginTime = '2023-01-01';
      const endTime = '2023-12-31';

      const query = {
        page: 2,
        pageSize: 5,
        keyword: 'admin',
        disabled: false,
        type: 'MENU' as const,
        sort: 'asc' as const,
        beginTime,
        endTime,
      };

      await permissionService.findAll(query);

      expect(mockFindMany).toHaveBeenCalledWith({
        where: {
          deleted: false,
          name: {
            contains: 'admin',
            mode: 'insensitive',
          },
          disabled: false,
          type: 'MENU',
          createdAt: {
            gte: beginTime,
            lte: endTime,
          },
        },
        select: {
          id: true,
          pid: true,
          name: true,
          type: true,
          permission: true,
          icon: true,
          path: true,
          sort: true,
          disabled: true,
          createdAt: true,
        },
        orderBy: [{ sort: 'desc' }, { createdAt: 'asc' }],
      });
    });

    it('should return empty list when page is out of bounds', async () => {
      const mockPermissions = [
        {
          id: 1,
          pid: 0,
          name: 'test',
          type: 'MENU',
          permission: null,
          icon: 'icon',
          path: '/test',
          sort: 1,
          disabled: false,
          createdAt: '2023-01-01',
        },
      ];

      const mockFindMany = prismaService.permission.findMany as jest.Mock;
      mockFindMany.mockResolvedValue(mockPermissions);

      const query = { page: 3, pageSize: 10 }; // Page 3 is out of bounds for 1 item
      const result = await permissionService.findAll(query);

      expect(result).toEqual({ list: [], total: 0 });
    });

    it('should return empty list when page is out of permissionTree', async () => {
      const mockPermissions = [
        {
          id: 1,
          pid: 0,
          name: 'test',
          type: 'MENU',
          permission: null,
          icon: 'icon',
          path: '/test',
          sort: 1,
          disabled: false,
          createdAt: new Date(),
        },
        {
          id: 2,
          pid: 1,
          name: 'test',
          type: 'MENU',
          permission: null,
          icon: 'icon',
          path: '/test',
          sort: 1,
          disabled: false,
          createdAt: new Date(),
        },
      ];

      const mockFindMany = prismaService.permission.findMany as jest.Mock;
      mockFindMany.mockResolvedValue(mockPermissions);

      const query = { page: 3, pageSize: 1 }; // Page 3 is out of bounds for 1 item
      const result = await permissionService.findAll(query);

      expect(result).toEqual({ list: [], total: 0 });
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

      const result = await permissionService.findTree();

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

  describe('findOne', () => {
    it('should return permission when found', async () => {
      const mockPermission = {
        pid: 1,
        name: 'test',
        type: 'MENU',
        path: '/test',
        permission: 'test:permission',
        icon: 'icon',
        cache: true,
        props: true,
        hidden: false,
        component: 'Test',
        disabled: false,
        redirect: '/redirect',
        sort: 1,
      };

      const mockFindUnique = prismaService.permission.findUnique as jest.Mock;
      mockFindUnique.mockResolvedValue(mockPermission);

      const result = await permissionService.findOne(1);

      expect(result).toEqual(mockPermission);
      expect(mockFindUnique).toHaveBeenCalledWith({
        where: {
          id: 1,
          deleted: false,
        },
        select: {
          pid: true,
          name: true,
          type: true,
          path: true,
          permission: true,
          icon: true,
          cache: true,
          props: true,
          hidden: true,
          component: true,
          disabled: true,
          redirect: true,
          sort: true,
        },
      });
    });

    it('should return null when permission not found', async () => {
      const mockFindUnique = prismaService.permission.findUnique as jest.Mock;
      mockFindUnique.mockResolvedValue(null);

      const result = await permissionService.findOne(1);

      expect(result).toBeNull();
    });
  });

  describe('remove', () => {
    it('should throw error when permission not found', async () => {
      const mockFindUnique = prismaService.permission.findUnique as jest.Mock;
      mockFindUnique.mockResolvedValue(null);

      await expect(permissionService.remove(1)).rejects.toThrow('权限不存在');
    });

    it('should throw error when permission is used by roles', async () => {
      const mockPermission = {
        id: 1,
        permissionInRole: [{}],
        children: [],
      };

      const mockFindUnique = prismaService.permission.findUnique as jest.Mock;
      mockFindUnique.mockResolvedValue(mockPermission);

      await expect(permissionService.remove(1)).rejects.toThrow(
        '该权限已被角色使用，不能删除',
      );
    });

    it('should throw error when permission has children', async () => {
      const mockPermission = {
        id: 1,
        permissionInRole: [],
        children: [{}],
      };

      const mockFindUnique = prismaService.permission.findUnique as jest.Mock;
      mockFindUnique.mockResolvedValue(mockPermission);

      await expect(permissionService.remove(1)).rejects.toThrow(
        '该权限下存在子权限，不能删除',
      );
    });

    it('should soft delete permission successfully', async () => {
      const mockPermission = {
        id: 1,
        permissionInRole: [],
        children: [],
      };

      const mockFindUnique = prismaService.permission.findUnique as jest.Mock;
      mockFindUnique.mockResolvedValue(mockPermission);

      const mockUpdate = prismaService.permission.update as jest.Mock;

      await permissionService.remove(1);

      expect(mockUpdate).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { deleted: true },
      });
    });
  });

  describe('update', () => {
    let mockRedisService;

    beforeEach(() => {
      mockRedisService = {
        userPermissions: jest.fn().mockReturnValue({
          remove: jest.fn(),
        }),
      };
      (permissionService as any).redisService = mockRedisService;
    });

    it('should throw error when permission not found', async () => {
      const mockFindUnique = prismaService.permission.findUnique as jest.Mock;
      mockFindUnique.mockResolvedValue(null);

      const updateDto: UpdatePermissionDto = {
        name: 'updated name',
      };

      await expect(permissionService.update(1, updateDto)).rejects.toThrow(
        '权限不存在',
      );
    });

    it('should throw error when trying to modify sensitive fields of used permission', async () => {
      const mockPermission = {
        id: 1,
        type: 'MENU',
        permission: 'test:permission',
        pid: 0,
        permissionInRole: [{ roles: { roleInUser: [] } }],
      };

      const mockFindUnique = prismaService.permission.findUnique as jest.Mock;
      mockFindUnique.mockResolvedValue(mockPermission);

      const updateDto: UpdatePermissionDto = {
        type: 'BUTTON',
      };

      await expect(permissionService.update(1, updateDto)).rejects.toThrow(
        '该权限已被角色使用，不能修改类型、权限标识、父权限',
      );
    });

    it('should update only safe fields', async () => {
      const mockPermission = {
        id: 1,
        type: 'MENU',
        permission: 'test:permission',
        pid: 0,
        name: 'old name',
        permissionInRole: [],
      };

      const mockFindUnique = prismaService.permission.findUnique as jest.Mock;
      mockFindUnique.mockResolvedValue(mockPermission);

      const mockUpdate = prismaService.permission.update as jest.Mock;
      mockUpdate.mockResolvedValue({});

      const updateDto: UpdatePermissionDto = {
        name: 'new name',
        icon: 'new-icon',
        sort: 5,
        type: 'BUTTON', // Should be ignored as it's sensitive
        permission: 'new:permission', // Should be ignored as it's sensitive
      };

      await permissionService.update(1, updateDto);

      expect(mockUpdate).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          name: 'new name',
          icon: 'new-icon',
          sort: 5,
        },
      });

      // Verify sensitive fields are not included
      const updateData = mockUpdate.mock.calls[0][0].data;
      expect(updateData).not.toHaveProperty('type');
      expect(updateData).not.toHaveProperty('permission');
    });

    it('should clear user permission cache when enabling a disabled permission', async () => {
      const userIds = ['user1', 'user2'];
      const mockPermission = {
        id: 1,
        disabled: true,
        permissionInRole: [
          {
            roles: {
              roleInUser: [{ userId: userIds[0] }, { userId: userIds[1] }],
            },
          },
        ],
      };

      const mockFindUnique = prismaService.permission.findUnique as jest.Mock;
      mockFindUnique.mockResolvedValue(mockPermission);

      const mockUpdate = prismaService.permission.update as jest.Mock;
      mockUpdate.mockResolvedValue({});

      const updateDto: UpdatePermissionDto = {
        disabled: false,
      };

      await permissionService.update(1, updateDto);

      expect(mockRedisService.userPermissions).toHaveBeenCalledTimes(2);
      userIds.forEach((userId) => {
        expect(mockRedisService.userPermissions).toHaveBeenCalledWith(userId);
        expect(
          mockRedisService.userPermissions(userId).remove,
        ).toHaveBeenCalled();
      });
    });

    it('should not clear user permission cache when not enabling a permission', async () => {
      const mockPermission = {
        id: 1,
        disabled: true,
        permissionInRole: [],
      };

      const mockFindUnique = prismaService.permission.findUnique as jest.Mock;
      mockFindUnique.mockResolvedValue(mockPermission);

      const mockUpdate = prismaService.permission.update as jest.Mock;
      mockUpdate.mockResolvedValue({});

      const updateDto: UpdatePermissionDto = {
        name: 'updated name',
      };

      await permissionService.update(1, updateDto);

      expect(mockRedisService.userPermissions).not.toHaveBeenCalled();
    });
  });

  describe('batchRemove', () => {
    it('should throw error when no permissions found', async () => {
      const mockFindMany = prismaService.permission.findMany as jest.Mock;
      mockFindMany.mockResolvedValue([]);

      await expect(permissionService.batchRemove([1, 2])).rejects.toThrow(
        '权限不存在',
      );
    });

    it('should throw error when permissions are used by roles', async () => {
      const mockPermissions = [
        {
          id: 1,
          permissionInRole: [{}],
          children: [],
        },
      ];

      const mockFindMany = prismaService.permission.findMany as jest.Mock;
      mockFindMany.mockResolvedValue(mockPermissions);

      await expect(permissionService.batchRemove([1])).rejects.toThrow(
        '部分权限已被角色使用或存在子权限，不能删除',
      );
    });

    it('should throw error when permissions have children', async () => {
      const mockPermissions = [
        {
          id: 1,
          permissionInRole: [],
          children: [{}],
        },
      ];

      const mockFindMany = prismaService.permission.findMany as jest.Mock;
      mockFindMany.mockResolvedValue(mockPermissions);

      await expect(permissionService.batchRemove([1])).rejects.toThrow(
        '部分权限已被角色使用或存在子权限，不能删除',
      );
    });

    it('should soft delete permissions successfully', async () => {
      const mockPermissions = [
        {
          id: 1,
          permissionInRole: [],
          children: [],
        },
        {
          id: 2,
          permissionInRole: [],
          children: [],
        },
      ];

      const mockFindMany = prismaService.permission.findMany as jest.Mock;
      mockFindMany.mockResolvedValue(mockPermissions);

      const mockUpdateMany = prismaService.permission.updateMany as jest.Mock;

      await permissionService.batchRemove([1, 2]);

      expect(mockUpdateMany).toHaveBeenCalledWith({
        where: { id: { in: [1, 2] } },
        data: { deleted: true },
      });
    });
  });
});
