import { TestBed } from '@automock/jest';
import { AuthController } from '../auth.controller';
import { AuthService } from '../auth.service';
import { AuthEntity } from '../entities/auth.entity';
import { LoginDto } from '../dto/auth.dto';
import { HttpStatus } from '@nestjs/common';
import { LoginEntity } from '../entities/auth.entity';
import { BaseResponseEntity } from 'src/common/entities/base-response.entity';

describe('AuthController Unit Test', () => {
  let authController: AuthController;
  let authService: jest.Mocked<AuthService>;

  beforeAll(() => {
    const { unit, unitRef } = TestBed.create(AuthController).compile();

    authController = unit;
    authService = unitRef.get(AuthService);
  });

  beforeEach(() => {
    // 在每个测试用例前重置所有 mock
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(authController).toBeDefined();
  });

  it('should return a captcha', () => {
    const ip = '127.0.0.1';
    const userAgent = 'Mozilla/5.0';
    const mockCaptcha = new AuthEntity();

    authService.generateCaptcha.mockReturnValue(mockCaptcha);

    const result = authController.getCaptcha(ip, userAgent);

    expect(result).toBe(mockCaptcha);
    expect(authService.generateCaptcha).toHaveBeenCalledWith(ip, userAgent);
  });

  describe('login', () => {
    const mockIp = '127.0.0.1';
    const mockUserAgent = 'Mozilla/5.0';
    const mockLoginDto: LoginDto = {
      userName: 'testUser',
      password: 'testPass',
      captcha: 'testCaptcha',
    };

    it('should return tokens on successful login', async () => {
      const mockLoginResponse: LoginEntity = {
        token: 'mockToken',
        refreshToken: 'mockRefreshToken',
      };

      authService.login.mockResolvedValue(mockLoginResponse);

      const result = await authController.login(
        mockLoginDto,
        mockIp,
        mockUserAgent,
      );

      expect(result).toBe(mockLoginResponse);
      expect(authService.login).toHaveBeenCalledWith(
        mockLoginDto,
        mockIp,
        mockUserAgent,
      );
    });

    it('should return error response for invalid captcha', async () => {
      const mockErrorResponse: BaseResponseEntity = {
        statusCode: HttpStatus.BAD_REQUEST,
        message: '验证码错误',
      };

      authService.login.mockResolvedValue(mockErrorResponse);

      const result = (await authController.login(
        mockLoginDto,
        mockIp,
        mockUserAgent,
      )) as BaseResponseEntity;

      expect(result).toBe(mockErrorResponse);
      expect(result.statusCode).toBe(HttpStatus.BAD_REQUEST);
      expect(result.message).toBe('验证码错误');
    });

    it('should return error response for invalid credentials', async () => {
      const mockErrorResponse: BaseResponseEntity = {
        statusCode: HttpStatus.BAD_REQUEST,
        message: '用户名或密码错误',
      };

      authService.login.mockResolvedValue(mockErrorResponse);

      const result = (await authController.login(
        mockLoginDto,
        mockIp,
        mockUserAgent,
      )) as BaseResponseEntity;

      expect(result).toBe(mockErrorResponse);
      expect(result.statusCode).toBe(HttpStatus.BAD_REQUEST);
      expect(result.message).toBe('用户名或密码错误');
    });

    it('should return error response for too many login attempts', async () => {
      const mockErrorResponse: BaseResponseEntity = {
        statusCode: HttpStatus.BAD_REQUEST,
        message: '验证码/用户名/密码错误次数过多，请30分钟后再试',
      };

      authService.login.mockResolvedValue(mockErrorResponse);

      const result = (await authController.login(
        mockLoginDto,
        mockIp,
        mockUserAgent,
      )) as BaseResponseEntity;

      expect(result).toBe(mockErrorResponse);
      expect(result.statusCode).toBe(HttpStatus.BAD_REQUEST);
      expect(result.message).toContain('错误次数过多');
    });

    it('should pass correct parameters to service', async () => {
      const mockLoginResponse: LoginEntity = {
        token: 'mockToken',
        refreshToken: 'mockRefreshToken',
      };

      authService.login.mockResolvedValue(mockLoginResponse);

      await authController.login(mockLoginDto, mockIp, mockUserAgent);

      expect(authService.login).toHaveBeenCalledWith(
        mockLoginDto,
        mockIp,
        mockUserAgent,
      );
      expect(authService.login).toHaveBeenCalledTimes(1);
    });
  });
});
