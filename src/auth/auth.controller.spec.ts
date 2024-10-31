import { TestBed } from '@automock/jest';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthEntity } from './entities/auth.entity';

describe('AuthController Unit Test', () => {
  let authController: AuthController;
  let authService: jest.Mocked<AuthService>;

  beforeAll(() => {
    const { unit, unitRef } = TestBed.create(AuthController).compile();

    authController = unit;
    authService = unitRef.get(AuthService);
  });

  it('should be defined', () => {
    // 验证 authController 是否已定义
    expect(authController).toBeDefined();
  });

  it('should return a captcha', () => {
    const ip = '127.0.0.1';
    const userAgent = 'Mozilla/5.0';
    const mockCaptcha = new AuthEntity();

    // 设置模拟返回值
    authService.generateCaptcha.mockReturnValue(mockCaptcha);

    const result = authController.getCaptcha(ip, userAgent);

    // 验证返回值
    expect(result).toBe(mockCaptcha);
    // 验证 generateCaptcha 调用参数
    expect(authService.generateCaptcha).toHaveBeenCalledWith(ip, userAgent);
  });
});
