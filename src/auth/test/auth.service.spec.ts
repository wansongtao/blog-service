import { TestBed } from '@automock/jest';
import { AuthService } from '../auth.service';
import { RedisService } from 'src/redis/redis.service';
import { UserService } from 'src/user/user.service';
import { JwtService } from '@nestjs/jwt';
import { create as createCaptcha } from 'svg-captcha';
import { BadRequestException } from '@nestjs/common';
import { getBaseConfig } from 'src/common/config';
import bcrypt from 'bcrypt';

jest.mock('svg-captcha');
jest.mock('src/common/config');
jest.mock('bcrypt');

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

  describe('validateUser', () => {
    const mock = {
      id: 'testUser',
      password: mockPassword,
      userName: mockUserName,
      disabled: false,
    };

    beforeEach(() => {
      // 添加 bcrypt.compare 的模拟
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    });

    it('should return false for invalid user', async () => {
      userService.findUser.mockResolvedValue(null);

      const result = await authService.validateUser(
        'testUser sssss',
        mockPassword,
      );

      expect(result).toBe(false);
    });

    it('should return user info for valid user', async () => {
      userService.findUser.mockResolvedValue({ ...mock, disabled: false });

      const result = await authService.validateUser(
        'testUser',
        'hashedPassword',
      );

      expect(result).toEqual({
        userName: mock.userName,
        userId: mock.id,
      });
    });

    it('should return false for disabled user', async () => {
      userService.findUser.mockResolvedValue({ ...mock, disabled: true });

      const result = await authService.validateUser(
        'testUser',
        'hashedPassword',
      );

      expect(result).toBe(false);
    });

    it('should return false for invalid password', async () => {
      userService.findUser.mockResolvedValue(mock);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await authService.validateUser('testUser', 'wrongPass');

      expect(result).toBe(false);
    });

    it('should return user info for valid user without password validation', async () => {
      userService.findUser.mockResolvedValue(mock);

      const result = await authService.validateUser(
        'testUser',
        undefined,
        false,
      );

      expect(result).toEqual({ userName: mock.userName, userId: mock.id });
    });

    it('should return false for disabled user without password validation', async () => {
      userService.findUser.mockResolvedValue({ ...mock, disabled: true });

      const result = await authService.validateUser(
        'testUser',
        undefined,
        false,
      );

      expect(result).toBe(false);
    });
  });

  describe('generateTokens', () => {
    const mockPayload = { userName: 'testUser', userId: 'testId' };

    beforeEach(() => {
      jwtService.sign
        .mockReturnValueOnce(mockToken)
        .mockReturnValueOnce(mockRefreshToken);
    });

    it('should generate jwt tokens', () => {
      const result = authService.generateTokens(mockPayload);

      expect(result).toEqual({
        accessToken: mockToken,
        refreshToken: mockRefreshToken,
      });

      expect(jwtService.sign).toHaveBeenCalledWith(mockPayload, {
        algorithm: mockBaseConfig.jwt.algorithm,
        expiresIn: mockBaseConfig.jwt.expiresIn,
      });

      expect(jwtService.sign).toHaveBeenCalledWith(mockPayload, {
        algorithm: mockBaseConfig.jwt.algorithm,
        expiresIn: mockBaseConfig.jwt.refreshTokenIn,
      });
    });
  });

  describe('login', () => {
    const mockLoginDto = {
      userName: mockUserName,
      password: mockPassword,
      captcha: mockCaptchaText,
    };

    beforeEach(() => {
      redisService.generateSignInErrorsKey.mockReturnValue(mockSignInErrorsKey);
      redisService.generateSSOKey.mockReturnValue(mockSsoKey);
      redisService.getSignInErrors.mockResolvedValue(0);
      redisService.setSSO.mockResolvedValue('OK');
    });

    it('should throw error when sign in errors exceed limit', async () => {
      redisService.getSignInErrors.mockResolvedValue(
        mockBaseConfig.signInErrorLimit,
      );

      await expect(
        authService.login(mockLoginDto, mockIp, mockUserAgent),
      ).rejects.toThrow(
        new BadRequestException(
          `验证码/用户名/密码错误次数过多，请${
            mockBaseConfig.signInErrorExpireIn / 60
          }分钟后再试`,
        ),
      );
    });

    it('should throw error for invalid captcha', async () => {
      redisService.getCaptcha.mockResolvedValue('differentCaptcha');

      await expect(
        authService.login(mockLoginDto, mockIp, mockUserAgent),
      ).rejects.toThrow(new BadRequestException('验证码错误'));

      expect(redisService.setSignInErrors).toHaveBeenCalledWith(
        mockSignInErrorsKey,
        1,
      );
    });

    it('should throw error for invalid credentials', async () => {
      redisService.getCaptcha.mockResolvedValue(mockCaptchaText);
      redisService.generateCaptchaKey.mockReturnValue(mockCaptchaKey);
      userService.findUser.mockResolvedValue(null);

      await expect(
        authService.login(mockLoginDto, mockIp, mockUserAgent),
      ).rejects.toThrow(
        new BadRequestException('用户名或密码错误，或账号已被禁用'),
      );

      expect(redisService.setSignInErrors).toHaveBeenCalledWith(
        mockSignInErrorsKey,
        1,
      );
    });

    it('should login successfully and return tokens', async () => {
      const mockUser = {
        id: 'testId',
        userName: mockUserName,
        password: mockPassword,
        disabled: false,
      };
      const mockTokens = {
        accessToken: mockToken,
        refreshToken: mockRefreshToken,
      };

      redisService.getCaptcha.mockResolvedValue(mockCaptchaText);
      redisService.generateCaptchaKey.mockReturnValue(mockCaptchaKey);
      userService.findUser.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      jest.spyOn(authService, 'generateTokens').mockReturnValue(mockTokens);

      const result = await authService.login(
        mockLoginDto,
        mockIp,
        mockUserAgent,
      );

      expect(result).toEqual(mockTokens);
      expect(redisService.setSSO).toHaveBeenCalledWith(
        mockSsoKey,
        mockTokens.accessToken,
      );
    });
  });

  describe('logout', () => {
    it('should logout successfully', async () => {
      redisService.generateSSOKey.mockReturnValue(mockSsoKey);
      redisService.delSSO.mockResolvedValue(1);

      await authService.logout(mockToken, mockUserName);

      expect(redisService.setBlackList).toHaveBeenCalledWith(mockToken);
      expect(redisService.delSSO).toHaveBeenCalledWith(mockSsoKey);
      expect(redisService.generateSSOKey).toHaveBeenCalledWith(mockUserName);
    });
  });

  describe('refreshToken', () => {
    const mockRefreshToken = 'refresh-token';
    const mockPayload = { userId: 'testId', userName: 'testUser' };

    beforeEach(() => {
      redisService.isBlackListed.mockResolvedValue(false);
      jwtService.verify.mockReturnValue(mockPayload);
      redisService.getSSO.mockResolvedValue(mockToken);
    });

    it('should throw error for blacklisted token', async () => {
      redisService.isBlackListed.mockResolvedValue(true);

      await expect(
        authService.refreshToken(mockToken, mockRefreshToken),
      ).rejects.toThrow(new BadRequestException('请重新登录'));
    });

    it('should throw error for invalid refresh token', async () => {
      jwtService.verify.mockImplementation(() => {
        throw new Error();
      });

      await expect(
        authService.refreshToken(mockToken, mockRefreshToken),
      ).rejects.toThrow(new BadRequestException('请重新登录'));
    });

    it('should throw error for different token', async () => {
      redisService.getSSO.mockResolvedValue('differentToken');

      await expect(
        authService.refreshToken(mockToken, mockRefreshToken),
      ).rejects.toThrow(
        new BadRequestException('该账号已在其他地方登录，请重新登录'),
      );
    });

    it('should throw error for invalid user', async () => {
      jwtService.verify.mockReturnValue(mockPayload);
      userService.findUser.mockResolvedValue(null);

      await expect(
        authService.refreshToken(mockToken, mockRefreshToken),
      ).rejects.toThrow(new BadRequestException('用户不存在或账号已被禁用'));
    });

    it('should refresh token successfully', async () => {
      const mockTokens = {
        accessToken: mockToken,
        refreshToken: mockRefreshToken,
      };

      jwtService.verify.mockReturnValue(mockPayload);
      userService.findUser.mockResolvedValue({
        userName: 'testUser',
        id: 'testId',
        password: 'hashedPassword',
        disabled: false,
      });
      const result = await authService.refreshToken(
        mockToken,
        mockRefreshToken,
      );

      expect(result).toEqual(mockTokens);
      expect(redisService.setSSO).toHaveBeenCalledWith(mockSsoKey, mockToken);
    });
  });
});
