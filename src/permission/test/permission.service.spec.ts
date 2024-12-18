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
});
