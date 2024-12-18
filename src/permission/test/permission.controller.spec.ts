import { TestBed } from '@automock/jest';
import { PermissionController } from '../permission.controller';

describe('PermissionController', () => {
  let controller: PermissionController;

  beforeAll(() => {
    const { unit } = TestBed.create(PermissionController).compile();

    controller = unit;
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
