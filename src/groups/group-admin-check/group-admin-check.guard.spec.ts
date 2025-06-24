import { GroupAdminCheckGuard } from './group-admin-check.guard';

describe('GroupAdminCheckGuard', () => {
  it('should be defined', () => {
    expect(new GroupAdminCheckGuard()).toBeDefined();
  });
});
