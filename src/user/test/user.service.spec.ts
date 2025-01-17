import { TestBed } from '@automock/jest';
import { PrismaService } from 'nestjs-prisma';
import { UserService } from '../user.service';
import { User } from '@prisma/client';

describe('UserService', () => {
  let userService: UserService;
  let prismaService: jest.Mocked<PrismaService>;

  // 在每个测试用例执行前都会运行，确保每个测试用例都有一个全新的、干净的测试环境
  beforeEach(() => {
    const { unit, unitRef } = TestBed.create(UserService)
      .mock(PrismaService)
      .using({
        user: {
          findUnique: jest.fn(),
        },
      })
      .compile();

    userService = unit;
    prismaService = unitRef.get(PrismaService);
  });

  describe('findUser', () => {
    it('should return null when user not found', async () => {
      // Arrange
      const mockFindUnique = prismaService.user.findUnique as jest.Mock;
      mockFindUnique.mockResolvedValue(null);

      // Act
      const result = await userService.findUser('testUser');

      // Assert
      expect(result).toBeNull();
      expect(mockFindUnique).toHaveBeenCalledWith({
        where: { userName: 'testUser', deleted: false },
        select: { id: true, password: true, userName: true, disabled: true },
      });
    });

    it('should return user info when userName are valid', async () => {
      // Arrange
      const mockFindUnique = prismaService.user.findUnique as jest.Mock;
      const user: Partial<User> = {
        id: 'testUser',
        password: 'hashedPassword',
        userName: 'testUser',
        disabled: false,
      };
      mockFindUnique.mockResolvedValue(user);

      // Act
      const result = await userService.findUser('testUser');

      // Assert
      expect(result).toEqual(user);
      expect(mockFindUnique).toHaveBeenCalledWith({
        where: { userName: 'testUser', deleted: false },
        select: { id: true, password: true, userName: true, disabled: true },
      });
    });
  });

  describe('findUserPermissionInfo', () => {
    it('should return user permission info', async () => {
      // Arrange
      const mockQueryRaw = prismaService.$queryRaw as jest.Mock;
      const userPermissionInfo = [
        {
          user_name: 'testUser',
          nick_name: 'testNickName',
          avatar: 'testAvatar',
          role_names: 'admin',
          pid: 'testPid',
          id: 'testId',
          name: 'testName',
          path: 'testPath',
          permission: 'testPermission',
          type: 'testType',
          icon: 'testIcon',
          component: 'testComponent',
          redirect: 'testRedirect',
          hidden: 'testHidden',
          sort: 'testSort',
          cache: 'testCache',
          props: 'testProps',
        },
      ];
      mockQueryRaw.mockResolvedValue(userPermissionInfo);

      // Act
      const result = await userService.findUserPermissionInfo('testId');

      // Assert
      expect(result).toEqual(userPermissionInfo);
    });

    it('should return empty array when user not found', async () => {
      // Arrange
      const mockQueryRaw = prismaService.$queryRaw as jest.Mock;
      mockQueryRaw.mockResolvedValue([]);

      // Act
      const result = await userService.findUserPermissionInfo('testId');

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('findProfile', () => {
    it('should return user profile', async () => {
      // Arrange
      const mockQueryRaw = prismaService.$queryRaw as jest.Mock;
      const userProfile = [
        {
          user_name: 'testUser',
          nick_name: 'testNickName',
          avatar: 'testAvatar',
          role_names: 'admin,user',
          id: 'testId',
          gender: 'OT',
          phone: 'testPhone',
          email: 'testEmail',
          birthday: '2022-02-02',
          description: 'testDescription',
        },
      ];

      mockQueryRaw.mockResolvedValue(userProfile);

      // Act
      const result = await userService.findProfile('testId');
      // Assert
      expect(result).toEqual({
        ...userProfile[0],
        userName: 'testUser',
        roles: ['admin', 'user'],
        nickName: 'testNickName',
      });
    });

    it('should return user profile with empty roles', async () => {
      // Arrange
      const mockQueryRaw = prismaService.$queryRaw as jest.Mock;
      const userProfile = [
        {
          user_name: 'testUser',
          nick_name: 'testNickName',
          avatar: 'testAvatar',
          role_names: '',
          id: 'testId',
          gender: 'OT',
          phone: 'testPhone',
          email: 'testEmail',
          birthday: '2022-02-02',
          description: 'testDescription',
        },
      ];
      mockQueryRaw.mockResolvedValue(userProfile);

      // Act
      const result = await userService.findProfile('testId');
      // Assert
      expect(result).toEqual({
        ...userProfile[0],
        userName: 'testUser',
        roles: [],
        nickName: 'testNickName',
      });
    });

    it('should throw NotFoundException when user not found', async () => {
      // Arrange
      const mockQueryRaw = prismaService.$queryRaw as jest.Mock;
      mockQueryRaw.mockResolvedValue([]);

      // Act
      try {
        await userService.findProfile('testId');
      } catch (e) {
        // Assert
        expect(e.message).toBe('用户不存在');
      }
    });
  });
});
