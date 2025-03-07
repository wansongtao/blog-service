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

  describe('create', () => {
    const mockCreateUserDto = {
      userName: 'newUser',
      password: 'password123',
      roleIds: [1, 2],
      nickName: 'New User',
      gender: 'MA' as const,
      phone: '1234567890',
      email: 'test@example.com',
      birthday: '1990-01-01',
      description: 'New test user',
    };

    it('should create user successfully', async () => {
      userService.create.mockResolvedValue(undefined);

      await userController.create(mockCreateUserDto);

      expect(userService.create).toHaveBeenCalledWith(mockCreateUserDto);
      expect(userService.create).toHaveBeenCalledTimes(1);
    });

    it('should throw error when username already exists', async () => {
      const errorMessage = '用户名已存在';
      userService.create.mockRejectedValue(new Error(errorMessage));

      await expect(userController.create(mockCreateUserDto)).rejects.toThrow(
        errorMessage,
      );
    });

    it('should throw error when role does not exist', async () => {
      const errorMessage = '角色不存在';
      userService.create.mockRejectedValue(new Error(errorMessage));

      await expect(userController.create(mockCreateUserDto)).rejects.toThrow(
        errorMessage,
      );
    });

    it('should handle empty roleIds', async () => {
      const userDtoWithoutRoles = { ...mockCreateUserDto, roleIds: [] };
      userService.create.mockResolvedValue(undefined);

      await userController.create(userDtoWithoutRoles);

      expect(userService.create).toHaveBeenCalledWith(userDtoWithoutRoles);
    });
  });

  describe('findOne', () => {
    const mockUserId = 'testUser';
    const mockUserDetail = {
      userName: 'testUser',
      nickName: 'testNickName',
      disabled: false,
      roles: [1, 2],
    };

    it('should return user detail by id', async () => {
      userService.findOne.mockResolvedValue(mockUserDetail);

      const result = await userController.findOne(mockUserId);

      expect(result).toEqual(mockUserDetail);
      expect(userService.findOne).toHaveBeenCalledWith(mockUserId);
      expect(userService.findOne).toHaveBeenCalledTimes(1);
    });

    it('should throw NotFoundException if user does not exist', async () => {
      const errorMessage = '用户不存在';
      userService.findOne.mockRejectedValue(
        new NotFoundException(errorMessage),
      );

      await expect(userController.findOne(mockUserId)).rejects.toThrow(
        errorMessage,
      );
    });

    it('should throw error with invalid user id format', async () => {
      const invalidId = 'invalid-id';
      const errorMessage = '无效的用户ID';
      userService.findOne.mockRejectedValue(new Error(errorMessage));

      await expect(userController.findOne(invalidId)).rejects.toThrow();
    });
  });

  describe('update', () => {
    const mockUserId = 'testUser';
    const mockUpdateUserDto = {
      roleIds: [1, 3],
      nickName: 'Updated User',
      disabled: true,
    };

    it('should update user successfully', async () => {
      userService.update.mockResolvedValue(undefined);

      await userController.update(mockUserId, mockUpdateUserDto);

      expect(userService.update).toHaveBeenCalledWith(
        mockUserId,
        mockUpdateUserDto,
      );
      expect(userService.update).toHaveBeenCalledTimes(1);
    });

    it('should throw NotFoundException if user does not exist', async () => {
      const errorMessage = '用户不存在';
      userService.update.mockRejectedValue(new NotFoundException(errorMessage));

      await expect(
        userController.update(mockUserId, mockUpdateUserDto),
      ).rejects.toThrow(errorMessage);
    });

    it('should throw error when role does not exist', async () => {
      const errorMessage = '角色不存在';
      userService.update.mockRejectedValue(new Error(errorMessage));

      await expect(
        userController.update(mockUserId, mockUpdateUserDto),
      ).rejects.toThrow(errorMessage);
    });

    it('should handle partial updates', async () => {
      const partialUpdate = { nickName: 'Just Name Update' };
      userService.update.mockResolvedValue(undefined);

      await userController.update(mockUserId, partialUpdate);

      expect(userService.update).toHaveBeenCalledWith(
        mockUserId,
        partialUpdate,
      );
    });

    it('should handle empty roleIds', async () => {
      const updateWithEmptyRoles = { ...mockUpdateUserDto, roleIds: [] };
      userService.update.mockResolvedValue(undefined);

      await userController.update(mockUserId, updateWithEmptyRoles);

      expect(userService.update).toHaveBeenCalledWith(
        mockUserId,
        updateWithEmptyRoles,
      );
    });
  });
});
