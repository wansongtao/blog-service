import { TestBed } from '@automock/jest';
import { PrismaService } from 'nestjs-prisma';
import { UserService } from '../user.service';
import { User } from '@prisma/client';
import bcrypt from 'bcrypt';

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
        profile: {
          update: jest.fn(),
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

  describe('updateProfile', () => {
    it('should update user profile', async () => {
      // Arrange
      const mockUpdate = prismaService.profile.update as jest.Mock;

      const profile = {
        nickName: 'testNickName',
        avatar: 'https://localhost/test.png',
        phone: '18001187109',
        email: '2192415523@qq.com',
        gender: 'FE' as const,
        birthday: '2023-02-03',
        description: 'test',
      };

      // Act
      await userService.updateProfile('testId', profile);

      // Assert
      expect(mockUpdate).toHaveBeenCalledWith({
        where: { userId: 'testId' },
        data: profile,
      });
      expect(profile.birthday).toBe('2023-02-03T00:00:00Z');
    });
  });

  describe('updatePassword', () => {
    it('should throw BadRequestException when new password is same as old password', async () => {
      // Arrange
      const updatePasswordDto = {
        oldPassword: 'password123',
        newPassword: 'password123',
      };

      // Act & Assert
      await expect(
        userService.updatePassword('testId', updatePasswordDto),
      ).rejects.toThrow('新密码和原密码不能相同');
    });

    it('should throw NotFoundException when user not found', async () => {
      // Arrange
      const mockFindUnique = prismaService.user.findUnique as jest.Mock;
      mockFindUnique.mockResolvedValue(null);
      const updatePasswordDto = {
        oldPassword: 'password123',
        newPassword: 'newPassword123',
      };

      // Act & Assert
      await expect(
        userService.updatePassword('testId', updatePasswordDto),
      ).rejects.toThrow('用户不存在');
    });

    it('should throw BadRequestException when old password is incorrect', async () => {
      // Arrange
      const mockFindUnique = prismaService.user.findUnique as jest.Mock;
      mockFindUnique.mockResolvedValue({
        password: 'hashedOldPassword',
      });
      const updatePasswordDto = {
        oldPassword: 'wrongPassword',
        newPassword: 'newPassword123',
      };

      // Act & Assert
      await expect(
        userService.updatePassword('testId', updatePasswordDto),
      ).rejects.toThrow('原密码错误');
    });

    it('should update password when all inputs are valid', async () => {
      // Arrange
      const mockFindUnique = prismaService.user.findUnique as jest.Mock;
      const mockUpdate = prismaService.user.update as jest.Mock;
      mockFindUnique.mockResolvedValue({
        password: 'hashedOldPassword',
      });
      mockUpdate.mockResolvedValue({});
      const updatePasswordDto = {
        oldPassword: 'correctPassword',
        newPassword: 'newPassword123',
      };
      jest
        .spyOn(bcrypt, 'compare')
        .mockImplementation(() => Promise.resolve(true));
      jest
        .spyOn(bcrypt, 'hash')
        .mockImplementation(() => Promise.resolve('newHashedPassword'));

      // Act
      await userService.updatePassword('testId', updatePasswordDto);

      // Assert
      expect(mockUpdate).toHaveBeenCalledWith({
        where: { id: 'testId' },
        data: { password: 'newHashedPassword' },
      });
    });
  });

  describe('findAll', () => {
    it('should return empty list when no users found', async () => {
      // Arrange
      const mockTransaction = prismaService.$transaction as jest.Mock;
      mockTransaction.mockResolvedValue([[], 0]);
      const queryParams = { page: 1, pageSize: 10 };

      // Act
      const result = await userService.findAll(queryParams);

      // Assert
      expect(result).toEqual({ list: [], total: 0 });
      expect(mockTransaction).toHaveBeenCalled();
    });

    it('should return user list with correct format', async () => {
      // Arrange
      const mockTransaction = prismaService.$transaction as jest.Mock;
      const mockUsers = [
        {
          id: 'test1',
          userName: 'testUser1',
          disabled: false,
          createdAt: new Date('2023-01-01'),
          updatedAt: new Date('2023-01-01'),
          profile: {
            nickName: 'Test Nick',
            avatar: 'test.jpg',
          },
          roleInUser: [
            {
              roles: {
                name: 'admin',
              },
            },
          ],
        },
      ];
      mockTransaction.mockResolvedValue([mockUsers, 1]);

      const queryParams = {
        page: 1,
        pageSize: 10,
        keyword: 'test',
        disabled: false,
        beginTime: '2023-01-01',
        endTime: '2023-12-31',
        sort: 'desc' as const,
      };

      // Act
      const result = await userService.findAll(queryParams);

      // Assert
      expect(result).toEqual({
        list: [
          {
            id: 'test1',
            userName: 'testUser1',
            disabled: false,
            createdAt: '2023-01-01T00:00:00.000Z',
            updatedAt: '2023-01-01T00:00:00.000Z',
            nickName: 'Test Nick',
            avatar: 'test.jpg',
            roleNames: ['admin'],
          },
        ],
        total: 1,
      });
    });

    it('should handle empty profile and roles', async () => {
      // Arrange
      const mockTransaction = prismaService.$transaction as jest.Mock;
      const mockUsers = [
        {
          id: 'test1',
          userName: 'testUser1',
          disabled: false,
          createdAt: new Date('2023-01-01'),
          updatedAt: new Date('2023-01-01'),
          profile: null,
          roleInUser: [],
        },
      ];
      mockTransaction.mockResolvedValue([mockUsers, 1]);

      // Act
      const result = await userService.findAll({});

      // Assert
      expect(result).toEqual({
        list: [
          {
            id: 'test1',
            userName: 'testUser1',
            disabled: false,
            createdAt: '2023-01-01T00:00:00.000Z',
            updatedAt: '2023-01-01T00:00:00.000Z',
            nickName: undefined,
            avatar: undefined,
            roleNames: [],
          },
        ],
        total: 1,
      });
    });
  });
});
