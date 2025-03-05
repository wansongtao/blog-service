import { TestBed } from '@automock/jest';
import { RoleService } from '../role.service';
import { QueryRoleDto } from '../dto/query-role.dto';
import { PrismaService } from 'nestjs-prisma';

describe('RoleService', () => {
  let roleService: RoleService;
  let prismaService: jest.Mocked<PrismaService>;

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
      .compile();

    roleService = unit;
    prismaService = unitRef.get(PrismaService);
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
    it('should throw BadRequestException if role name already exists', async () => {
      const updateRoleDto = {
        name: 'admin',
      };

      const mockFindUnique = prismaService.role.findUnique as jest.Mock;
      mockFindUnique.mockResolvedValueOnce({
        id: 2,
        name: 'admin',
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
      };

      const mockFindUnique = prismaService.role.findUnique as jest.Mock;
      mockFindUnique
        .mockResolvedValueOnce(null) // First call for name check
        .mockResolvedValueOnce(null); // Second call for role existence check

      await expect(roleService.update(1, updateRoleDto)).rejects.toThrow(
        '角色不存在',
      );
    });

    it('should throw BadRequestException when trying to disable role in use', async () => {
      const updateRoleDto = {
        disabled: true,
      };

      const mockFindUnique = prismaService.role.findUnique as jest.Mock;
      mockFindUnique.mockResolvedValueOnce({
        roleInUser: [{ userId: 1 }],
        id: 1,
      });

      await expect(roleService.update(1, updateRoleDto)).rejects.toThrow(
        '该角色已被用户使用，不能禁用',
      );
    });

    it('should update role successfully', async () => {
      const updateRoleDto = {
        name: 'editor',
        description: 'Updated description',
        disabled: false,
        permissions: [1, 2],
      };

      const mockFindUnique = prismaService.role.findUnique as jest.Mock;
      mockFindUnique.mockResolvedValueOnce(null).mockResolvedValueOnce({
        roleInUser: [],
      });

      const mockUpdate = jest.fn().mockResolvedValue(undefined);
      prismaService.role.update = mockUpdate;

      await roleService.update(1, updateRoleDto);

      expect(mockUpdate).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          name: updateRoleDto.name,
          description: updateRoleDto.description,
          disabled: updateRoleDto.disabled,
          permissionInRole: {
            deleteMany: {},
            create: updateRoleDto.permissions.map((permissionId) => ({
              permissionId,
            })),
          },
        },
      });
    });

    it('should update role without permissions', async () => {
      const updateRoleDto = {
        name: 'editor',
        description: 'Updated description',
      };

      const mockFindUnique = prismaService.role.findUnique as jest.Mock;
      mockFindUnique.mockResolvedValueOnce(null).mockResolvedValueOnce({
        roleInUser: [],
      });

      const mockUpdate = jest.fn().mockResolvedValue(undefined);
      prismaService.role.update = mockUpdate;

      await roleService.update(1, updateRoleDto);

      expect(mockUpdate).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          name: updateRoleDto.name,
          description: updateRoleDto.description,
        },
      });
    });

    it('should update role and clear redis cache when updating permissions of role in use', async () => {
      const updateRoleDto = {
        name: 'editor',
        permissions: [1, 2, 3],
      };

      const mockRoleInUser = {
        id: 1,
        roleInUser: [{ userId: 1 }, { userId: 2 }],
      };

      const mockFindUnique = prismaService.role.findUnique as jest.Mock;
      mockFindUnique
        .mockResolvedValueOnce(null) // First call for name check
        .mockResolvedValueOnce(mockRoleInUser); // Second call for role existence

      const mockDelUserPermission = jest.fn();
      roleService['redisService'].delUserPermission = mockDelUserPermission;

      const mockUpdate = jest.fn().mockResolvedValue(undefined);
      prismaService.role.update = mockUpdate;

      await roleService.update(1, updateRoleDto);

      expect(mockDelUserPermission).toHaveBeenCalledWith(1);
      expect(mockDelUserPermission).toHaveBeenCalledWith(2);

      expect(mockUpdate).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          name: updateRoleDto.name,
          permissionInRole: {
            deleteMany: {},
            create: updateRoleDto.permissions.map((permissionId) => ({
              permissionId,
            })),
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
    it('should return all active roles', async () => {
      const mockRoles = [
        { id: 1, name: 'admin' },
        { id: 2, name: 'editor' },
        { id: 3, name: 'viewer' },
      ];

      const mockFindMany = jest.fn().mockResolvedValue(mockRoles);
      prismaService.role.findMany = mockFindMany;

      const result = await roleService.findRoleTree();

      expect(result).toEqual(mockRoles);
      expect(mockFindMany).toHaveBeenCalledWith({
        where: {
          deleted: false,
          disabled: false,
        },
        select: {
          id: true,
          name: true,
        },
      });
    });

    it('should return empty array when no active roles exist', async () => {
      const mockFindMany = jest.fn().mockResolvedValue([]);
      prismaService.role.findMany = mockFindMany;

      const result = await roleService.findRoleTree();

      expect(result).toEqual([]);
      expect(mockFindMany).toHaveBeenCalledWith({
        where: {
          deleted: false,
          disabled: false,
        },
        select: {
          id: true,
          name: true,
        },
      });
    });
  });
});
