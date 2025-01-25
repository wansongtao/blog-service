import { TestBed } from '@automock/jest';
import { RoleService } from '../role.service';

describe('RoleService', () => {
  let roleService: RoleService;

  beforeEach(async () => {
    const { unit } = TestBed.create(RoleService).compile();

    roleService = unit;
  });

  it('should be defined', () => {
    expect(roleService).toBeDefined();
  });
});
