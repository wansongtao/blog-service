import { TestBed } from '@automock/jest';
import { PrismaService } from 'nestjs-prisma';
import { UserService } from '../user.service';
import bcrypt from 'bcrypt';
import { User } from '@prisma/client';

jest.mock('bcrypt');

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

  describe('validateUser', () => {
    it('should return false when user not found', async () => {
      // Arrange
      const mockFindUnique = prismaService.user.findUnique as jest.Mock;
      mockFindUnique.mockResolvedValue(null);

      // Act
      const result = await userService.validateUser('testUser', 'password');

      // Assert
      expect(result).toBeFalsy();
      expect(mockFindUnique).toHaveBeenCalledWith({
        where: { userName: 'testUser', deleted: false, disabled: false },
        select: { id: true, password: true },
      });
    });

    it('should return false when password is invalid', async () => {
      // Arrange
      const mockFindUnique = prismaService.user.findUnique as jest.Mock;
      const user: Partial<User> = {
        id: 'testUser',
        password: 'hashedPassword',
      };
      mockFindUnique.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      // Act
      const result = await userService.validateUser(
        'testUser',
        'wrongPassword',
      );

      // Assert
      expect(result).toBeFalsy();
      expect(bcrypt.compare).toHaveBeenCalledWith(
        'wrongPassword',
        'hashedPassword',
      );
    });

    it('should return true when credentials are valid', async () => {
      // Arrange
      const mockFindUnique = prismaService.user.findUnique as jest.Mock;
      const user: Partial<User> = {
        id: 'testUser',
        password: 'hashedPassword',
      };
      mockFindUnique.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      // Act
      const result = await userService.validateUser(
        'testUser',
        'correctPassword',
      );

      // Assert
      expect(result).toBeTruthy();
      expect(mockFindUnique).toHaveBeenCalledWith({
        where: { userName: 'testUser', deleted: false, disabled: false },
        select: { id: true, password: true },
      });
      expect(bcrypt.compare).toHaveBeenCalledWith(
        'correctPassword',
        'hashedPassword',
      );
    });
  });
});
