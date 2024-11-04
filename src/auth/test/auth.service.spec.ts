import { TestBed } from '@automock/jest';
import { AuthService } from '../auth.service';
import { RedisService } from 'src/redis/redis.service';
import { UserService } from 'src/user/user.service';
import { JwtService } from '@nestjs/jwt';
import { create as createCaptcha } from 'svg-captcha';
import { HttpStatus } from '@nestjs/common';
import { getBaseConfig } from 'src/common/config';

jest.mock('svg-captcha');
jest.mock('src/common/config');

describe('AuthService Unit Test', () => {
  let authService: AuthService;
  let redisService: jest.Mocked<RedisService>;
  let userService: jest.Mocked<UserService>;
  let jwtService: jest.Mocked<JwtService>;

  const mockIp = '127.0.0.1';
  const mockUserAgent = 'test-agent';
  const mockCaptchaText = 'abcd';
  const mockCaptchaSvg = '<svg>test</svg>';
  const mockUserName = 'testUser';
  const mockPassword = 'testPass';
  const mockToken = 'jwt-token';
  const mockRefreshToken = 'refresh-token';
  const mockCaptchaKey = 'captcha-key';
  const mockSsoKey = 'sso-key';
  const mockSignInErrorsKey = 'errors-key';

  const mockBaseConfig = {
    signInErrorLimit: 5,
    signInErrorExpireIn: 1800,
    jwt: {
      algorithm: 'HS256',
      expiresIn: 3600,
      refreshTokenIn: 86400,
    },
  };

  beforeAll(() => {
    const { unit, unitRef } = TestBed.create(AuthService).compile();

    authService = unit;
    redisService = unitRef.get(RedisService);
    userService = unitRef.get(UserService);
    jwtService = unitRef.get(JwtService);
  });

  beforeEach(() => {
    jest.clearAllMocks();
    (getBaseConfig as jest.Mock).mockReturnValue(mockBaseConfig);
    (createCaptcha as jest.Mock).mockReturnValue({
      text: mockCaptchaText,
      data: mockCaptchaSvg,
    });
  });

  describe('generateCaptcha', () => {
    beforeEach(() => {
      redisService.generateCaptchaKey.mockReturnValue(mockCaptchaKey);
      redisService.setCaptcha.mockResolvedValue('OK');
    });

    it('should generate captcha and store in redis', () => {
      const result = authService.generateCaptcha(mockIp, mockUserAgent);

      expect(createCaptcha).toHaveBeenCalledWith({
        size: 4,
        noise: 2,
        color: true,
        ignoreChars: '0o1i',
        background: '#f0f0f0',
      });

      expect(redisService.generateCaptchaKey).toHaveBeenCalledWith(
        mockIp,
        mockUserAgent,
      );

      expect(redisService.setCaptcha).toHaveBeenCalledWith(
        mockCaptchaKey,
        mockCaptchaText,
      );

      expect(result).toEqual({
        captcha: `data:image/svg+xml;base64,${Buffer.from(mockCaptchaSvg).toString('base64')}`,
      });
    });
  });

  describe('validateCaptcha', () => {
    beforeEach(() => {
      redisService.generateCaptchaKey.mockReturnValue(mockCaptchaKey);
    });

    it('should return true for valid captcha and delete it', async () => {
      redisService.getCaptcha.mockResolvedValue(mockCaptchaText);

      const result = await authService.validateCaptcha(
        mockIp,
        mockUserAgent,
        mockCaptchaText,
      );

      expect(result).toBe(true);
      expect(redisService.delCaptcha).toHaveBeenCalledWith(mockCaptchaKey);
    });

    it('should return false for invalid captcha', async () => {
      redisService.getCaptcha.mockResolvedValue(mockCaptchaText);

      const result = await authService.validateCaptcha(
        mockIp,
        mockUserAgent,
        'wrong',
      );

      expect(result).toBe(false);
      expect(redisService.delCaptcha).not.toHaveBeenCalled();
    });

    it('should return false when captcha not found', async () => {
      redisService.getCaptcha.mockResolvedValue(null);

      const result = await authService.validateCaptcha(
        mockIp,
        mockUserAgent,
        mockCaptchaText,
      );

      expect(result).toBe(false);
    });
  });

  describe('login', () => {
    const loginDto = {
      userName: mockUserName,
      password: mockPassword,
      captcha: mockCaptchaText,
    };

    beforeEach(() => {
      redisService.generateSignInErrorsKey.mockReturnValue(mockSignInErrorsKey);
      redisService.generateSSOKey.mockReturnValue(mockSsoKey);
      jwtService.sign
        .mockReturnValueOnce(mockToken)
        .mockReturnValueOnce(mockRefreshToken);
    });

    it('should return error when sign-in errors exceed limit', async () => {
      redisService.getSignInErrors.mockResolvedValue(
        mockBaseConfig.signInErrorLimit,
      );

      const result = await authService.login(loginDto, mockIp, mockUserAgent);

      expect(result).toEqual({
        statusCode: HttpStatus.BAD_REQUEST,
        message: `验证码/用户名/密码错误次数过多，请${
          mockBaseConfig.signInErrorExpireIn / 60
        }分钟后再试`,
      });
    });

    it('should return error for invalid captcha', async () => {
      redisService.getSignInErrors.mockResolvedValue(0);
      redisService.generateCaptchaKey.mockReturnValue(mockCaptchaKey);
      redisService.getCaptcha.mockResolvedValue('different');

      const result = await authService.login(loginDto, mockIp, mockUserAgent);

      expect(result).toEqual({
        statusCode: HttpStatus.BAD_REQUEST,
        message: '验证码错误',
      });
      expect(redisService.setSignInErrors).toHaveBeenCalledWith(
        mockSignInErrorsKey,
        1,
      );
    });

    it('should return error for invalid user credentials', async () => {
      redisService.getSignInErrors.mockResolvedValue(0);
      redisService.generateCaptchaKey.mockReturnValue(mockCaptchaKey);
      redisService.getCaptcha.mockResolvedValue(mockCaptchaText);
      userService.validateUser.mockResolvedValue(false);

      const result = await authService.login(loginDto, mockIp, mockUserAgent);

      expect(result).toEqual({
        statusCode: HttpStatus.BAD_REQUEST,
        message: '用户名或密码错误',
      });
      expect(redisService.setSignInErrors).toHaveBeenCalledWith(
        mockSignInErrorsKey,
        1,
      );
    });

    it('should return tokens for successful login', async () => {
      redisService.getSignInErrors.mockResolvedValue(0);
      redisService.generateCaptchaKey.mockReturnValue(mockCaptchaKey);
      redisService.getCaptcha.mockResolvedValue(mockCaptchaText);
      userService.validateUser.mockResolvedValue(true);

      const result = await authService.login(loginDto, mockIp, mockUserAgent);

      expect(result).toEqual({
        token: mockToken,
        refreshToken: mockRefreshToken,
      });

      expect(jwtService.sign).toHaveBeenCalledWith(
        { userName: mockUserName },
        {
          algorithm: mockBaseConfig.jwt.algorithm,
          expiresIn: mockBaseConfig.jwt.expiresIn,
        },
      );

      expect(redisService.setSSO).toHaveBeenCalledWith(mockSsoKey, mockToken);
    });
  });
});
