import { TestBed } from '@automock/jest';
import { RoleService } from '../role.service';
import { QueryRoleDto } from '../dto/query-role.dto';
import { PrismaService } from 'nestjs-prisma';
import { ConfigService } from '@nestjs/config';

describe('RoleService', () => {
  let roleService: RoleService;
  let prismaService: jest.Mocked<PrismaService>;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    const { unit, unitRef } = TestBed.create(RoleService)
      .mock(PrismaService)
      .using({
        role: {
          findUnique: jest.fn(),
          findMany: jest.fn(),
          create: jest.fn(),
        },
      })
      .mock(ConfigService)
      .using({
        get: jest.fn(),
      })
      .compile();

    roleService = unit;
    prismaService = unitRef.get(PrismaService);
    configService = unitRef.get(ConfigService);
  });

  it('should be defined', () => {
    expect(roleService).toBeDefined();
  });

  describe('findAll', () => {
    it('should return paginated roles list', async () => {
      const mockRoles = [
        {
          id: 1,
          name: 'admin',
          description: 'Admin role',
          disabled: false,
          createdAt: new Date('2023-01-01'),
          updatedAt: new Date('2023-01-01'),
        },
      ];

      const mockPrismaService = {
        $transaction: jest.fn().mockResolvedValue([mockRoles, 1]),
      };

      jest
        .spyOn(roleService['prismaService'], '$transaction')
        .mockImplementation(mockPrismaService.$transaction);

      const result = await roleService.findAll({
        page: 1,
        pageSize: 10,
      });

      expect(result).toEqual({
        list: mockRoles.map((item) => ({
          ...item,
          createdAt: item.createdAt.toISOString(),
          updatedAt: item.updatedAt.toISOString(),
        })),
        total: 1,
      });

      expect(mockPrismaService.$transaction).toHaveBeenCalledTimes(1);
    });

    it('should apply filters correctly', async () => {
      const queryParams: QueryRoleDto = {
        keyword: 'test',
        disabled: false,
        sort: 'desc' as const,
        beginTime: '2023-01-01T00:00:00Z',
        endTime: '2023-01-02T00:00:00Z',
      };

      const mockPrismaService = {
        $transaction: jest.fn().mockImplementation((callback) => {
          if (Array.isArray(callback)) {
            return Promise.resolve([[], 0]);
          }
          return callback(roleService['prismaService']);
        }),
      };

      jest
        .spyOn(roleService['prismaService'], '$transaction')
        .mockImplementation(mockPrismaService.$transaction);

      await roleService.findAll(queryParams);

      expect(mockPrismaService.$transaction).toHaveBeenCalledWith(
        expect.arrayContaining([undefined, undefined]),
      );
    });
  });

  describe('create', () => {
    it('should throw BadRequestException if role already exists', async () => {
      const createRoleDto = {
        name: 'admin',
        description: 'Admin role',
        disabled: false,
      };

      const mockFindUnique = prismaService.role.findUnique as jest.Mock;
      mockFindUnique.mockResolvedValue({
        id: 1,
        name: 'admin',
        disabled: false,
        deleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        description: 'Admin role',
      });

      await expect(roleService.create(createRoleDto)).rejects.toThrow(
        '该角色已存在',
      );
      expect(mockFindUnique).toHaveBeenCalledWith({
        where: { name: createRoleDto.name },
        select: { id: true },
      });
    });

    it('should create role without permissions successfully', async () => {
      const createRoleDto = {
        name: 'editor',
        description: 'Editor role',
        disabled: false,
      };

      const mockFindUnique = prismaService.role.findUnique as jest.Mock;
      mockFindUnique.mockResolvedValue(null);

      const mockCreate = prismaService.role.create as jest.Mock;
      mockCreate.mockResolvedValue(undefined);

      await roleService.create(createRoleDto);

      expect(mockCreate).toHaveBeenCalledWith({
        data: createRoleDto,
      });
    });

    it('should create role with permissions successfully', async () => {
      const createRoleDto = {
        name: 'editor',
        description: 'Editor role',
        disabled: false,
        permissions: [1, 2],
      };

      const mockFindUnique = prismaService.role.findUnique as jest.Mock;
      mockFindUnique.mockResolvedValue(null);

      const mockCreate = prismaService.role.create as jest.Mock;
      mockCreate.mockResolvedValue(undefined);

      await roleService.create(createRoleDto);

      expect(mockCreate).toHaveBeenCalledWith({
        data: {
          name: createRoleDto.name,
          description: createRoleDto.description,
          disabled: createRoleDto.disabled,
          permissionInRole: {
            create: createRoleDto.permissions.map((permissionId) => ({
              permissionId,
            })),
          },
        },
      });
    });
  });

  describe('findOne', () => {
    it('should throw BadRequestException if role does not exist', async () => {
      const mockFindUnique = prismaService.role.findUnique as jest.Mock;
      mockFindUnique.mockResolvedValue(null);

      await expect(roleService.findOne(1)).rejects.toThrow('该角色不存在');
      expect(mockFindUnique).toHaveBeenCalledWith({
        where: {
          id: 1,
          deleted: false,
        },
        include: {
          permissionInRole: {
            where: {
              permissions: {
                deleted: false,
              },
            },
            select: {
              permissionId: true,
            },
          },
        },
      });
    });

    it('should return role with permissions', async () => {
      const mockRole = {
        id: 1,
        name: 'admin',
        description: 'Admin role',
        disabled: false,
        deleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        permissionInRole: [{ permissionId: 1 }, { permissionId: 2 }],
      };

      const mockFindUnique = prismaService.role.findUnique as jest.Mock;
      mockFindUnique.mockResolvedValue(mockRole);

      const result = await roleService.findOne(1);

      expect(result).toEqual({
        id: mockRole.id,
        name: mockRole.name,
        description: mockRole.description,
        disabled: mockRole.disabled,
        permissions: [1, 2],
      });
    });

    it('should return role without permissions', async () => {
      const mockRole = {
        id: 1,
        name: 'admin',
        description: 'Admin role',
        disabled: false,
        deleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        permissionInRole: [],
      };

      const mockFindUnique = prismaService.role.findUnique as jest.Mock;
      mockFindUnique.mockResolvedValue(mockRole);

      const result = await roleService.findOne(1);

      expect(result).toEqual({
        id: mockRole.id,
        name: mockRole.name,
        description: mockRole.description,
        disabled: mockRole.disabled,
        permissions: [],
      });
    });
  });

  describe('update', () => {
    let mockRedisService: any;

    beforeEach(() => {
      mockRedisService = {
        userPermissions: jest.fn().mockReturnValue({
          remove: jest.fn(),
        }),
      };

      (roleService as any).redisService = mockRedisService;
    });

    it('should throw BadRequestException if role name already exists', async () => {
      const updateRoleDto = {
        name: 'editor',
        description: 'Editor role',
      };

      const mockFindUnique = prismaService.role.findUnique as jest.Mock;
      mockFindUnique.mockResolvedValueOnce({
        id: 2, // Different ID indicates name belongs to another role
        name: 'editor',
      });

      await expect(roleService.update(1, updateRoleDto)).rejects.toThrow(
        '该角色名称已存在',
      );

      expect(mockFindUnique).toHaveBeenCalledWith({
        where: { name: updateRoleDto.name },
      });
    });

    it('should throw BadRequestException if role does not exist', async () => {
      const updateRoleDto = {
        name: 'editor',
        description: 'Editor role',
      };

      const mockFindUnique = prismaService.role.findUnique as jest.Mock;
      mockFindUnique.mockResolvedValueOnce(null); // No role with this name
      mockFindUnique.mockResolvedValueOnce(null); // Role with ID doesn't exist

      await expect(roleService.update(1, updateRoleDto)).rejects.toThrow(
        '角色不存在',
      );
    });

    it('should throw BadRequestException if trying to disable a role in use', async () => {
      const updateRoleDto = {
        disabled: true,
      };

      const mockFindUnique = prismaService.role.findUnique as jest.Mock;
      mockFindUnique.mockResolvedValueOnce({
        id: 1,
        roleInUser: [{ userId: 1 }],
      });

      await expect(roleService.update(1, updateRoleDto)).rejects.toThrow(
        '默认管理员角色不允许修改',
      );
    });

    it('should clear user permissions cache when updating permissions for a role in use', async () => {
      const updateRoleDto = {
        permissions: [1, 2, 3],
      };

      const mockFindUnique = prismaService.role.findUnique as jest.Mock;
      mockFindUnique.mockResolvedValueOnce({
        id: 1,
        roleInUser: [{ userId: 1 }, { userId: 2 }],
      });

      const mockUpdate = jest.fn().mockResolvedValue(undefined);
      prismaService.role.update = mockUpdate;
      configService.get.mockImplementation((key) => {
        if (key === 'DEFAULT_ADMIN_USERNAME') return 'admin';
        if (key === 'DEFAULT_ADMIN_ROLE') return 'admin';
        return null;
      });
      await roleService.update(1, updateRoleDto);

      expect(mockRedisService.userPermissions).toHaveBeenCalledTimes(2);
      expect(mockRedisService.userPermissions).toHaveBeenCalledWith(1);
      expect(mockRedisService.userPermissions).toHaveBeenCalledWith(2);
      expect(mockRedisService.userPermissions().remove).toHaveBeenCalledTimes(
        2,
      );
    });

    it('should update role basic information without touching permissions', async () => {
      const updateRoleDto = {
        name: 'new-admin',
        description: 'Updated admin role',
      };

      const mockFindUnique = prismaService.role.findUnique as jest.Mock;
      mockFindUnique.mockResolvedValueOnce(null); // No role with new name
      mockFindUnique.mockResolvedValueOnce({
        id: 1,
        roleInUser: [],
      });

      const mockUpdate = jest.fn().mockResolvedValue(undefined);
      prismaService.role.update = mockUpdate;
      configService.get.mockImplementation((key) => {
        if (key === 'DEFAULT_ADMIN_USERNAME') return 'admin';
        if (key === 'DEFAULT_ADMIN_ROLE') return 'admin';
        return null;
      });
      await roleService.update(1, updateRoleDto);

      expect(mockUpdate).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          name: updateRoleDto.name,
          description: updateRoleDto.description,
          disabled: undefined,
        },
      });
    });

    it('should update role permissions', async () => {
      const updateRoleDto = {
        permissions: [1, 2, 3],
      };

      const mockFindUnique = prismaService.role.findUnique as jest.Mock;
      mockFindUnique.mockResolvedValue({
        id: 1,
        roleInUser: [],
      });

      const mockUpdate = jest.fn().mockResolvedValue(undefined);
      prismaService.role.update = mockUpdate;
      configService.get.mockImplementation((key) => {
        if (key === 'DEFAULT_ADMIN_ROLE') return 'admin';
        return null;
      });
      await roleService.update(1, updateRoleDto);

      expect(mockUpdate).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          name: undefined,
          description: undefined,
          disabled: undefined,
          permissionInRole: {
            deleteMany: {},
            create: [
              { permissionId: 1 },
              { permissionId: 2 },
              { permissionId: 3 },
            ],
          },
        },
      });
    });

    it('should clear all permissions when empty array is provided', async () => {
      const updateRoleDto = {
        permissions: [],
      };

      const mockFindUnique = prismaService.role.findUnique as jest.Mock;
      mockFindUnique.mockResolvedValue({
        id: 1,
        roleInUser: [],
      });

      const mockUpdate = jest.fn().mockResolvedValue(undefined);
      prismaService.role.update = mockUpdate;
      configService.get.mockImplementation((key) => {
        if (key === 'DEFAULT_ADMIN_ROLE') return 'admin';
        return null;
      });
      await roleService.update(1, updateRoleDto);

      expect(mockUpdate).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          name: undefined,
          description: undefined,
          disabled: undefined,
          permissionInRole: {
            deleteMany: {},
          },
        },
      });
    });
  });

  describe('remove', () => {
    it('should throw BadRequestException if role does not exist', async () => {
      const mockFindUnique = prismaService.role.findUnique as jest.Mock;
      mockFindUnique.mockResolvedValue(null);

      await expect(roleService.remove(1)).rejects.toThrow('角色不存在');
      expect(mockFindUnique).toHaveBeenCalledWith({
        where: {
          id: 1,
          deleted: false,
        },
        include: {
          roleInUser: {
            select: {
              userId: true,
            },
            where: {
              users: {
                deleted: false,
              },
            },
          },
        },
      });
    });

    it('should throw BadRequestException if role is in use', async () => {
      const mockFindUnique = prismaService.role.findUnique as jest.Mock;
      mockFindUnique.mockResolvedValue({
        id: 1,
        roleInUser: [{ userId: 1 }],
      });

      await expect(roleService.remove(1)).rejects.toThrow(
        '该角色已被用户使用，不允许删除',
      );
    });

    it('should soft delete role successfully', async () => {
      const mockFindUnique = prismaService.role.findUnique as jest.Mock;
      mockFindUnique.mockResolvedValue({
        id: 1,
        roleInUser: [],
      });

      const mockUpdate = jest.fn().mockResolvedValue(undefined);
      prismaService.role.update = mockUpdate;

      await roleService.remove(1);

      expect(mockUpdate).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { deleted: true },
      });
    });
  });

  describe('findRoleTree', () => {
    it('should return role tree for user', async () => {
      const mockUser = { userId: '1', userName: 'testuser' };
      const mockRoles = [
        {
          id: 1,
          name: 'admin',
        },
      ];

      const mockFindMany = prismaService.role.findMany as jest.Mock;
      mockFindMany.mockResolvedValue(mockRoles);

      const result = await roleService.findRoleTree(mockUser);

      expect(result).toEqual(
        mockRoles.map((role) => ({
          ...role,
        })),
      );
    });
  });
});
