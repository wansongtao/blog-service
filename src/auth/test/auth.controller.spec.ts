import { TestBed } from '@automock/jest';
import { AuthController } from '../auth.controller';
import { AuthService } from '../auth.service';
import { AuthEntity, LoginEntity } from '../entities/auth.entity';
import { LoginDto } from '../dto/auth.dto';
import { BadRequestException } from '@nestjs/common';

describe('AuthController Unit Test', () => {
  let authController: AuthController;
  let authService: jest.Mocked<AuthService>;

  beforeAll(() => {
    const { unit, unitRef } = TestBed.create(AuthController).compile();

    authController = unit;
    authService = unitRef.get(AuthService);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(authController).toBeDefined();
  });

  describe('getCaptcha', () => {
    const mockIp = '127.0.0.1';
    const mockUserAgent = 'Mozilla/5.0';

    it('should return a captcha', () => {
      const mockCaptcha = new AuthEntity();
      mockCaptcha.captcha = 'base64-encoded-captcha';

      authService.generateCaptcha.mockReturnValue(mockCaptcha);

      const result = authController.getCaptcha(mockIp, mockUserAgent);

      expect(result).toBe(mockCaptcha);
      expect(authService.generateCaptcha).toHaveBeenCalledWith(
        mockIp,
        mockUserAgent,
      );
      expect(authService.generateCaptcha).toHaveBeenCalledTimes(1);
    });
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
        accessToken: 'mockToken',
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
      expect(authService.login).toHaveBeenCalledTimes(1);
    });

    it('should throw BadRequestException for invalid credentials', async () => {
      const errorMessage = '用户名或密码错误，或账号已被禁用';
      authService.login.mockRejectedValue(
        new BadRequestException(errorMessage),
      );

      await expect(
        authController.login(mockLoginDto, mockIp, mockUserAgent),
      ).rejects.toThrow(BadRequestException);

      await expect(
        authController.login(mockLoginDto, mockIp, mockUserAgent),
      ).rejects.toThrow(errorMessage);

      expect(authService.login).toHaveBeenCalledWith(
        mockLoginDto,
        mockIp,
        mockUserAgent,
      );
    });

    it('should throw BadRequestException for invalid captcha', async () => {
      const errorMessage = '验证码错误';
      authService.login.mockRejectedValue(
        new BadRequestException(errorMessage),
      );

      await expect(
        authController.login(mockLoginDto, mockIp, mockUserAgent),
      ).rejects.toThrow(BadRequestException);

      await expect(
        authController.login(mockLoginDto, mockIp, mockUserAgent),
      ).rejects.toThrow(errorMessage);
    });

    it('should throw BadRequestException for too many attempts', async () => {
      const errorMessage = '验证码/用户名/密码错误次数过多，请30分钟后再试';
      authService.login.mockRejectedValue(
        new BadRequestException(errorMessage),
      );

      await expect(
        authController.login(mockLoginDto, mockIp, mockUserAgent),
      ).rejects.toThrow(BadRequestException);

      await expect(
        authController.login(mockLoginDto, mockIp, mockUserAgent),
      ).rejects.toThrow(errorMessage);
    });
  });

  describe('logout', () => {
    const mockUser = {
      userName: 'testUser',
      userId: 'testId',
    };

    beforeEach(() => {
      authService.logout.mockResolvedValue(undefined);
    });

    it('should successfully logout with Bearer token', async () => {
      const mockToken = 'Bearer jwt-token';
      const req = { user: mockUser };

      await authController.logout(mockToken, req);

      expect(authService.logout).toHaveBeenCalledWith(
        'jwt-token', // token without 'Bearer ' prefix
        mockUser.userId,
      );
      expect(authService.logout).toHaveBeenCalledTimes(1);
    });
  });

  describe('refreshToken', () => {
    const mockToken = 'Bearer jwt-token';
    const mockRefreshTokenDto = {
      refreshToken: 'mock-refresh-token',
    };

    it('should successfully refresh token', async () => {
      const mockLoginResponse: LoginEntity = {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      };

      authService.refreshToken.mockResolvedValue(mockLoginResponse);

      const result = await authController.refreshToken(
        mockToken,
        mockRefreshTokenDto,
      );

      expect(result).toBe(mockLoginResponse);
      expect(authService.refreshToken).toHaveBeenCalledWith(
        'jwt-token', // token without 'Bearer ' prefix
        mockRefreshTokenDto.refreshToken,
      );
      expect(authService.refreshToken).toHaveBeenCalledTimes(1);
    });
  });
});
