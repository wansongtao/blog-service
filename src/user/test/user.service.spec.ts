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
});
