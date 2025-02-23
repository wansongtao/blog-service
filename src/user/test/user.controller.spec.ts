import { TestBed } from '@automock/jest';
import { UserController } from '../user.controller';
import { UserService } from '../user.service';
import { NotFoundException } from '@nestjs/common';

describe('UserController', () => {
  let userController: UserController;
  let userService: jest.Mocked<UserService>;

  beforeAll(() => {
    const { unit, unitRef } = TestBed.create(UserController).compile();

    userController = unit;
    userService = unitRef.get(UserService);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(userController).toBeDefined();
  });

  describe('findProfile', () => {
    const mockUserId = 'testUser';
    const mockProfile = {
      userName: 'testUser',
      nickName: 'testNickName',
      avatar: 'testAvatar',
      roles: ['admin'],
      gender: 'OT' as const,
      phone: 'testPhone',
      email: 'testEmail',
      birthday: '2022-02-02',
      description: 'testDescription',
    };

    it('should return user profile', async () => {
      userService.findProfile.mockResolvedValue(mockProfile);

      const result = await userController.findProfile({
        user: { userId: mockUserId, userName: mockUserId },
      });

      expect(result).toEqual(mockProfile);
      expect(userService.findProfile).toHaveBeenCalledWith(mockUserId);
      expect(userService.findProfile).toHaveBeenCalledTimes(1);
    });

    it('should throw NotFoundException if user does not exist', async () => {
      const errorMessage = '用户不存在';
      userService.findProfile.mockRejectedValue(
        new NotFoundException(errorMessage),
      );

      await expect(
        userController.findProfile({
          user: { userId: mockUserId, userName: mockUserId },
        }),
      ).rejects.toThrow(errorMessage);
    });
  });

  describe('updateProfile', () => {
    const mockUserId = 'testUser';
    const mockProfileDto = {
      nickName: 'newNickName',
      avatar: 'newAvatar',
      gender: 'FE' as const,
      phone: 'newPhone',
      email: 'newEmail',
      birthday: '2023-01-01',
      description: 'newDescription',
    };

    it('should update user profile successfully', async () => {
      userService.updateProfile.mockResolvedValue(undefined);

      await userController.updateProfile(
        { user: { userId: mockUserId, userName: mockUserId } },
        mockProfileDto,
      );

      expect(userService.updateProfile).toHaveBeenCalledWith(
        mockUserId,
        mockProfileDto,
      );
      expect(userService.updateProfile).toHaveBeenCalledTimes(1);
    });

    it('should throw NotFoundException if user does not exist', async () => {
      const errorMessage = '用户不存在';
      userService.updateProfile.mockRejectedValue(
        new NotFoundException(errorMessage),
      );

      await expect(
        userController.updateProfile(
          { user: { userId: mockUserId, userName: mockUserId } },
          mockProfileDto,
        ),
      ).rejects.toThrow(errorMessage);
    });
  });

  describe('updatePassword', () => {
    const mockUserId = 'testUser';
    const mockPasswordDto = {
      oldPassword: 'oldPassword123',
      newPassword: 'newPassword123',
    };

    it('should update password successfully', async () => {
      userService.updatePassword.mockResolvedValue(undefined);

      await userController.updatePassword(
        { user: { userId: mockUserId, userName: mockUserId } },
        mockPasswordDto,
      );

      expect(userService.updatePassword).toHaveBeenCalledWith(
        mockUserId,
        mockPasswordDto,
      );
      expect(userService.updatePassword).toHaveBeenCalledTimes(1);
    });

    it('should throw NotFoundException if user does not exist', async () => {
      const errorMessage = '用户不存在';
      userService.updatePassword.mockRejectedValue(
        new NotFoundException(errorMessage),
      );

      await expect(
        userController.updatePassword(
          { user: { userId: mockUserId, userName: mockUserId } },
          mockPasswordDto,
        ),
      ).rejects.toThrow(errorMessage);
    });

    it('should throw error if old password is incorrect', async () => {
      const errorMessage = '原密码错误';
      userService.updatePassword.mockRejectedValue(new Error(errorMessage));

      await expect(
        userController.updatePassword(
          { user: { userId: mockUserId, userName: mockUserId } },
          mockPasswordDto,
        ),
      ).rejects.toThrow(errorMessage);
    });
  });

  describe('findAll', () => {
    const mockQuery = {
      page: 1,
      pageSize: 10,
      keyword: 'test',
    };

    const mockUserList = {
      total: 1,
      list: [
        {
          id: 'testUser',
          userName: 'testUser',
          nickName: 'testNickName',
          disabled: false,
          avatar: 'testAvatar',
          roleNames: ['admin'],
          createdAt: '2023-01-01',
          updatedAt: '2023-01-01',
        },
      ],
    };

    it('should return user list', async () => {
      userService.findAll.mockResolvedValue(mockUserList);

      const result = await userController.findAll(mockQuery);

      expect(result).toEqual(mockUserList);
      expect(userService.findAll).toHaveBeenCalledWith(mockQuery);
      expect(userService.findAll).toHaveBeenCalledTimes(1);
    });

    it('should return empty list when no users found', async () => {
      const emptyList = {
        total: 0,
        list: [],
      };
      userService.findAll.mockResolvedValue(emptyList);

      const result = await userController.findAll(mockQuery);

      expect(result).toEqual(emptyList);
      expect(userService.findAll).toHaveBeenCalledWith(mockQuery);
    });

    it('should handle pagination correctly', async () => {
      const paginationQuery = {
        page: 2,
        pageSize: 5,
      };
      userService.findAll.mockResolvedValue(mockUserList);

      await userController.findAll(paginationQuery);

      expect(userService.findAll).toHaveBeenCalledWith(paginationQuery);
    });
  });
});
