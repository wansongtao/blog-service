import { TestBed } from '@automock/jest';
import { PrismaService } from 'nestjs-prisma';
import { UserService } from '../user.service';
import { User } from '@prisma/client';
import bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';

describe('UserService', () => {
  let userService: UserService;
  let prismaService: jest.Mocked<PrismaService>;
  let configService: jest.Mocked<ConfigService>;

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
        $transaction: jest.fn(),
      })
      .mock(ConfigService)
      .using({
        get: jest.fn(),
      })
      .compile();

    userService = unit;
    prismaService = unitRef.get(PrismaService);
    configService = unitRef.get(ConfigService);
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

  describe('create', () => {
    beforeEach(() => {
      jest
        .spyOn(userService as any, 'generateHashPassword')
        .mockResolvedValue('hashedPassword');
      jest
        .spyOn(userService as any, 'getDefaultPassword')
        .mockReturnValue('defaultPassword');
    });

    it('should throw BadRequestException when user already exists', async () => {
      // Arrange
      const mockFindUnique = prismaService.user.findUnique as jest.Mock;
      mockFindUnique.mockResolvedValue({ id: 'existingId' });
      const createUserDto = {
        userName: 'existingUser',
        disabled: false,
        nickName: 'Test User',
        roles: [1, 2],
      };

      // Act & Assert
      await expect(userService.create(createUserDto)).rejects.toThrow(
        '用户已存在',
      );
      expect(mockFindUnique).toHaveBeenCalledWith({
        where: { userName: 'existingUser' },
        select: { id: true },
      });
    });

    it('should create user with roles when all inputs are valid', async () => {
      // Arrange
      const mockFindUnique = prismaService.user.findUnique as jest.Mock;
      mockFindUnique.mockResolvedValue(null);

      const mockCreate = prismaService.user.create as jest.Mock;
      mockCreate.mockResolvedValue({});

      const createUserDto = {
        userName: 'newUser',
        disabled: false,
        nickName: 'New User',
        roles: [1, 2],
      };

      // Act
      await userService.create(createUserDto);

      // Assert
      expect(mockCreate).toHaveBeenCalledWith({
        data: {
          userName: 'newUser',
          password: 'hashedPassword',
          disabled: false,
          profile: {
            create: {
              nickName: 'New User',
            },
          },
          roleInUser: {
            createMany: {
              data: [{ roleId: 1 }, { roleId: 2 }],
            },
          },
        },
      });
    });

    it('should create user without roles when roles not provided', async () => {
      // Arrange
      const mockFindUnique = prismaService.user.findUnique as jest.Mock;
      mockFindUnique.mockResolvedValue(null);

      const mockCreate = prismaService.user.create as jest.Mock;
      mockCreate.mockResolvedValue({});

      const createUserDto = {
        userName: 'newUser',
        disabled: false,
        nickName: 'New User',
      };

      // Act
      await userService.create(createUserDto);

      // Assert
      expect(mockCreate).toHaveBeenCalledWith({
        data: {
          userName: 'newUser',
          password: 'hashedPassword',
          disabled: false,
          profile: {
            create: {
              nickName: 'New User',
            },
          },
          roleInUser: undefined,
        },
      });
    });
  });

  describe('updatePassword', () => {
    beforeEach(() => {
      jest.spyOn(bcrypt, 'compare').mockImplementation();
      jest.spyOn(bcrypt, 'hash').mockImplementation();
    });

    it('should throw BadRequestException when new password is same as old password', async () => {
      // Arrange
      const updatePasswordDto = {
        oldPassword: 'password123',
        newPassword: 'password123',
      };

      // Act & Assert
      await expect(
        userService.updatePassword('userId', updatePasswordDto),
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
        userService.updatePassword('userId', updatePasswordDto),
      ).rejects.toThrow('用户不存在');
      expect(mockFindUnique).toHaveBeenCalledWith({
        where: { id: 'userId' },
        select: { password: true },
      });
    });

    it('should throw BadRequestException when old password is incorrect', async () => {
      // Arrange
      const mockFindUnique = prismaService.user.findUnique as jest.Mock;
      mockFindUnique.mockResolvedValue({ password: 'hashedPassword' });

      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const updatePasswordDto = {
        oldPassword: 'wrongPassword',
        newPassword: 'newPassword123',
      };

      // Act & Assert
      await expect(
        userService.updatePassword('userId', updatePasswordDto),
      ).rejects.toThrow('原密码错误');
      expect(bcrypt.compare).toHaveBeenCalledWith(
        'wrongPassword',
        'hashedPassword',
      );
    });

    it('should update password when all inputs are valid', async () => {
      // Arrange
      const mockFindUnique = prismaService.user.findUnique as jest.Mock;
      mockFindUnique.mockResolvedValue({ password: 'hashedPassword' });

      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (bcrypt.hash as jest.Mock).mockResolvedValue('newHashedPassword');

      const mockUpdate = prismaService.user.update as jest.Mock;
      mockUpdate.mockResolvedValue({});

      const updatePasswordDto = {
        oldPassword: 'correctOldPassword',
        newPassword: 'newPassword123',
      };

      configService.get.mockReturnValue(10);

      // Act
      await userService.updatePassword('userId', updatePasswordDto);

      // Assert
      expect(bcrypt.compare).toHaveBeenCalledWith(
        'correctOldPassword',
        'hashedPassword',
      );
      expect(bcrypt.hash).toHaveBeenCalled();
      expect(mockUpdate).toHaveBeenCalledWith({
        where: { id: 'userId' },
        data: { password: 'newHashedPassword' },
      });
    });
  });

  describe('findAll', () => {
    it('should return paginated users with default parameters when no query parameters provided', async () => {
      // Arrange
      const mockTransaction = prismaService.$transaction as jest.Mock;
      const mockUsers = [
        {
          id: 'user1',
          userName: 'user1',
          disabled: false,
          createdAt: new Date('2023-01-01'),
          updatedAt: new Date('2023-01-02'),
          profile: {
            nickName: 'User One',
            avatar: 'avatar1.jpg',
          },
          roleInUser: [
            { roles: { name: 'admin' } },
            { roles: { name: 'user' } },
          ],
        },
      ];
      mockTransaction.mockResolvedValue([mockUsers, 1]);

      // Act
      const result = await userService.findAll({});

      // Assert
      expect(result).toEqual({
        list: [
          {
            id: 'user1',
            userName: 'user1',
            disabled: false,
            createdAt: '2023-01-01T00:00:00.000Z',
            updatedAt: '2023-01-02T00:00:00.000Z',
            nickName: 'User One',
            avatar: 'avatar1.jpg',
            roleNames: ['admin', 'user'],
          },
        ],
        total: 1,
      });
      expect(prismaService.$transaction).toHaveBeenCalled();
    });

    it('should apply filters when query parameters are provided', async () => {
      // Arrange
      const mockFindMany = jest.fn().mockResolvedValue([]);
      const mockCount = jest.fn().mockResolvedValue(0);

      prismaService.user.findMany = mockFindMany;
      prismaService.user.count = mockCount;

      const mockTransaction = prismaService.$transaction as jest.Mock;
      mockTransaction.mockResolvedValue([[], 0]);

      const queryParams = {
        disabled: true,
        keyword: 'test',
        page: 2,
        pageSize: 5,
        beginTime: '2023-01-01T00:00:00.000Z',
        endTime: '2023-12-31T23:59:59.999Z',
        sort: 'asc' as const,
      };

      // Act
      await userService.findAll(queryParams);

      // Assert
      expect(prismaService.$transaction).toHaveBeenCalled();

      // Verify that the correct parameters are being passed to Prisma
      expect(mockFindMany).toHaveBeenCalled();
      const findManyArgs = mockFindMany.mock.calls[0][0];
      expect(findManyArgs.skip).toBe(5);
      expect(findManyArgs.take).toBe(5);
      expect(findManyArgs.orderBy).toEqual({ createdAt: 'asc' });
    });

    it('should handle empty result', async () => {
      // Arrange
      const mockTransaction = prismaService.$transaction as jest.Mock;
      mockTransaction.mockResolvedValue([[], 0]);

      // Act
      const result = await userService.findAll({
        keyword: 'nonexistentuser',
      });

      // Assert
      expect(result).toEqual({
        list: [],
        total: 0,
      });
    });

    it('should handle users with no profile or roles', async () => {
      // Arrange
      const mockTransaction = prismaService.$transaction as jest.Mock;
      const mockUsers = [
        {
          id: 'user1',
          userName: 'user1',
          disabled: false,
          createdAt: new Date('2023-01-01'),
          updatedAt: new Date('2023-01-02'),
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
            id: 'user1',
            userName: 'user1',
            disabled: false,
            createdAt: '2023-01-01T00:00:00.000Z',
            updatedAt: '2023-01-02T00:00:00.000Z',
            nickName: undefined,
            avatar: undefined,
            roleNames: [],
          },
        ],
        total: 1,
      });
    });
  });

  describe('generateHashPassword', () => {
    it('should hash password using bcrypt with configured salt rounds', async () => {
      // Arrange
      const password = 'testPassword';
      const saltRounds = 10;
      const hashedPassword = 'hashedTestPassword';

      // Reset mock and create a new mock for this test
      jest.clearAllMocks();

      // Mock bcrypt.hash
      jest
        .spyOn(bcrypt, 'hash')
        .mockImplementation(() => Promise.resolve(hashedPassword));

      // Mock configService to return salt rounds
      configService.get.mockReturnValue(saltRounds);

      // Act
      const result = await (userService as any).generateHashPassword(password);

      // Assert
      expect(result).toBe(hashedPassword);
      expect(bcrypt.hash).toHaveBeenCalledWith(password, saltRounds);
      expect(configService.get).toHaveBeenCalledWith('NODE_ENV');
    });

    it('should use the correct salt rounds from config', async () => {
      // Arrange
      const password = 'testPassword';
      const saltRounds = 12; // Different salt rounds

      // Clear previous mock calls
      (bcrypt.hash as jest.Mock).mockClear();

      configService.get.mockReturnValue(saltRounds);

      // Act
      await (userService as any).generateHashPassword(password);

      // Assert
      expect(bcrypt.hash).toHaveBeenCalledWith(password, saltRounds);
    });
  });

  describe('getDefaultPassword', () => {
    it('should return the default admin password from config', () => {
      // Arrange
      const defaultPassword = 'admin123';

      // Mock configService to return the default password
      configService.get.mockReturnValue(defaultPassword);

      // Act
      const result = (userService as any).getDefaultPassword();

      // Assert
      expect(result).toBe(defaultPassword);
    });
  });
});
