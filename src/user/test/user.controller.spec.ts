import { TestBed } from '@automock/jest';
import { UserController } from '../user.controller';
// import { UserService } from '../user.service';

describe('UserController', () => {
  let userController: UserController;
  // let userService: jest.Mocked<UserService>;

  beforeAll(() => {
    const { unit } = TestBed.create(UserController).compile();

    userController = unit;
    // userService = unitRef.get(UserService);
  });

  it('should be defined', () => {
    expect(userController).toBeDefined();
  });
});
