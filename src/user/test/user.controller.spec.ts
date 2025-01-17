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
});
