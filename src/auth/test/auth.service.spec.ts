import { TestBed } from '@automock/jest';
import { AuthService } from '../auth.service';
import { RedisService } from 'src/redis/redis.service';
import { UserService } from 'src/user/user.service';
import { JwtService } from '@nestjs/jwt';
import { create as createCaptcha } from 'svg-captcha';
import { getBaseConfig } from 'src/common/config';
import bcrypt from 'bcrypt';
import { UserPermissionInfoEntity } from 'src/user/entities/user-permission-info.entity';

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

  const mockBaseConfig = {
    signInErrorLimit: 5,
    signInErrorExpireIn: 1800,
    jwt: {
      algorithm: 'HS256',
      expiresIn: 3600,
      refreshTokenIn: 86400,
    },
    defaultAdmin: {
      username: 'admin',
      permission: '*:*:*',
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
      const captchaHandler = {
        set: jest.fn().mockResolvedValue('OK'),
        get: jest.fn().mockResolvedValue(mockCaptchaText),
        remove: jest.fn().mockResolvedValue(1),
      };
      redisService.captcha.mockReturnValue(captchaHandler);
    });

    it('should generate a captcha and store it in redis', () => {
      const result = authService.generateCaptcha(mockIp, mockUserAgent);

      expect(createCaptcha).toHaveBeenCalledWith({
        size: 4,
        noise: 2,
        color: true,
        ignoreChars: '0o1i',
        background: '#f0f0f0',
      });

      expect(redisService.captcha).toHaveBeenCalledWith(mockIp, mockUserAgent);
      expect(
        redisService.captcha(mockIp, mockUserAgent).set,
      ).toHaveBeenCalledWith(mockCaptchaText);

      const expectedBase64 = `data:image/svg+xml;base64,${Buffer.from(mockCaptchaSvg).toString('base64')}`;
      expect(result).toEqual({ captcha: expectedBase64 });
    });

    it('should include correct data in the SVG captcha', () => {
      authService.generateCaptcha(mockIp, mockUserAgent);

      expect(createCaptcha).toHaveBeenCalledWith(
        expect.objectContaining({
          size: 4,
          noise: 2,
          color: true,
          ignoreChars: '0o1i',
          background: '#f0f0f0',
        }),
      );
    });

    it('should return the captcha in base64 format', () => {
      const result = authService.generateCaptcha(mockIp, mockUserAgent);

      const base64Data = Buffer.from(mockCaptchaSvg).toString('base64');
      expect(result.captcha).toBe(`data:image/svg+xml;base64,${base64Data}`);
    });
  });

  describe('validateCaptcha', () => {
    beforeEach(() => {
      const captchaHandler = {
        set: jest.fn().mockResolvedValue('OK'),
        get: jest.fn().mockResolvedValue(mockCaptchaText),
        remove: jest.fn().mockResolvedValue(1),
      };
      redisService.captcha.mockReturnValue(captchaHandler);
    });

    it('should return true for valid captcha', async () => {
      const result = await authService.validateCaptcha(
        mockIp,
        mockUserAgent,
        mockCaptchaText,
      );

      expect(redisService.captcha).toHaveBeenCalledWith(mockIp, mockUserAgent);
      expect(
        redisService.captcha(mockIp, mockUserAgent).get,
      ).toHaveBeenCalled();
      expect(
        redisService.captcha(mockIp, mockUserAgent).remove,
      ).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should return true for valid captcha case insensitive', async () => {
      const result = await authService.validateCaptcha(
        mockIp,
        mockUserAgent,
        mockCaptchaText.toUpperCase(),
      );

      expect(result).toBe(true);
    });

    it('should return false for invalid captcha', async () => {
      const result = await authService.validateCaptcha(
        mockIp,
        mockUserAgent,
        'wrongCaptcha',
      );

      expect(result).toBe(false);
      expect(
        redisService.captcha(mockIp, mockUserAgent).remove,
      ).not.toHaveBeenCalled();
    });

    it('should return false when captcha not found in redis', async () => {
      redisService.captcha.mockReturnValue({
        get: jest.fn().mockResolvedValue(null),
        set: jest.fn(),
        remove: jest.fn(),
      });

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

    const mockLoginAttempts = {
      get: jest.fn(),
      increment: jest.fn(),
      reset: jest.fn(),
      set: jest.fn(),
    };

    const mockSsoHandler = {
      set: jest.fn(),
      get: jest.fn(),
      remove: jest.fn(),
    };

    beforeEach(() => {
      redisService.trackLoginAttempts.mockReturnValue(mockLoginAttempts);
      redisService.sso.mockReturnValue(mockSsoHandler);
      mockLoginAttempts.get.mockResolvedValue(0);
      mockLoginAttempts.increment.mockResolvedValue(1);

      // Mock validateCaptcha
      jest.spyOn(authService, 'validateCaptcha').mockResolvedValue(true);

      // Mock validateUser
      jest.spyOn(authService, 'validateUser').mockResolvedValue({
        userName: mockUserName,
        userId: 'user-id',
      });

      // Mock generateTokens
      jest.spyOn(authService, 'generateTokens').mockReturnValue({
        accessToken: mockToken,
        refreshToken: mockRefreshToken,
      });
    });

    it('should login successfully with valid credentials', async () => {
      const result = await authService.login(
        mockLoginDto,
        mockIp,
        mockUserAgent,
      );

      expect(redisService.trackLoginAttempts).toHaveBeenCalledWith(
        mockIp,
        mockUserAgent,
      );
      expect(authService.validateCaptcha).toHaveBeenCalledWith(
        mockIp,
        mockUserAgent,
        mockCaptchaText,
      );
      expect(authService.validateUser).toHaveBeenCalledWith(
        mockUserName,
        mockPassword,
      );
      expect(authService.generateTokens).toHaveBeenCalledWith({
        userName: mockUserName,
        userId: 'user-id',
      });
      expect(redisService.sso).toHaveBeenCalledWith('user-id');
      expect(mockSsoHandler.set).toHaveBeenCalledWith(mockToken);

      expect(result).toEqual({
        accessToken: mockToken,
        refreshToken: mockRefreshToken,
      });
    });

    it('should throw BadRequestException if too many login attempts', async () => {
      mockLoginAttempts.get.mockResolvedValue(mockBaseConfig.signInErrorLimit);

      await expect(
        authService.login(mockLoginDto, mockIp, mockUserAgent),
      ).rejects.toThrow('验证码/用户名/密码错误次数过多，请30分钟后再试');

      expect(authService.validateCaptcha).not.toHaveBeenCalled();
      expect(authService.validateUser).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if captcha is invalid', async () => {
      jest.spyOn(authService, 'validateCaptcha').mockResolvedValue(false);

      await expect(
        authService.login(mockLoginDto, mockIp, mockUserAgent),
      ).rejects.toThrow('验证码错误');

      expect(mockLoginAttempts.increment).toHaveBeenCalled();
      expect(authService.validateUser).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if user credentials are invalid', async () => {
      jest.spyOn(authService, 'validateUser').mockResolvedValue(false);

      await expect(
        authService.login(mockLoginDto, mockIp, mockUserAgent),
      ).rejects.toThrow('用户名或密码错误，或账号已被禁用');

      expect(mockLoginAttempts.increment).toHaveBeenCalled();
      expect(authService.generateTokens).not.toHaveBeenCalled();
    });
  });

  describe('logout', () => {
    const mockUserId = 'user-id';
    const mockAccessToken = 'jwt-token';

    const mockBlackListHandler = {
      set: jest.fn().mockResolvedValue('OK'),
      isBlackListed: jest.fn(),
    };

    const mockSsoHandler = {
      set: jest.fn(),
      get: jest.fn(),
      remove: jest.fn().mockResolvedValue(1),
    };

    beforeEach(() => {
      redisService.blackList.mockReturnValue(mockBlackListHandler);
      redisService.sso.mockReturnValue(mockSsoHandler);
    });

    it('should add token to blacklist and remove SSO token', async () => {
      await authService.logout(mockAccessToken, mockUserId);

      expect(redisService.blackList).toHaveBeenCalled();
      expect(mockBlackListHandler.set).toHaveBeenCalledWith(mockAccessToken);

      expect(redisService.sso).toHaveBeenCalledWith(mockUserId);
      expect(mockSsoHandler.remove).toHaveBeenCalled();
    });

    it('should handle the logout process in the correct order', async () => {
      await authService.logout(mockAccessToken, mockUserId);

      // Check the calling order
      expect(redisService.blackList.mock.invocationCallOrder[0]).toBeLessThan(
        redisService.sso.mock.invocationCallOrder[0],
      );
      expect(mockBlackListHandler.set.mock.invocationCallOrder[0]).toBeLessThan(
        mockSsoHandler.remove.mock.invocationCallOrder[0],
      );
    });
  });

  describe('refreshToken', () => {
    const mockUserId = 'user-id';
    const mockUserName = 'testUser';
    const mockAccessToken = 'access-token';
    const mockRefreshToken = 'refresh-token';
    const mockPayload = { userId: mockUserId, userName: mockUserName };

    const mockBlackListHandler = {
      set: jest.fn(),
      isBlackListed: jest.fn(),
    };

    const mockSsoHandler = {
      get: jest.fn(),
      set: jest.fn(),
      remove: jest.fn(),
    };

    beforeEach(() => {
      redisService.blackList.mockReturnValue(mockBlackListHandler);
      redisService.sso.mockReturnValue(mockSsoHandler);
      mockBlackListHandler.isBlackListed.mockResolvedValue(false);
      mockSsoHandler.get.mockResolvedValue(mockAccessToken);

      jwtService.verify.mockReturnValue(mockPayload);

      jest.spyOn(authService, 'validateUser').mockResolvedValue(mockPayload);
      jest.spyOn(authService, 'generateTokens').mockReturnValue({
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      });
    });

    it('should refresh tokens successfully', async () => {
      const result = await authService.refreshToken(
        mockAccessToken,
        mockRefreshToken,
      );

      expect(redisService.blackList).toHaveBeenCalled();
      expect(mockBlackListHandler.isBlackListed).toHaveBeenCalledWith(
        mockAccessToken,
      );
      expect(jwtService.verify).toHaveBeenCalledWith(mockRefreshToken);
      expect(redisService.sso).toHaveBeenCalledWith(mockUserId);
      expect(mockSsoHandler.get).toHaveBeenCalled();
      expect(authService.validateUser).toHaveBeenCalledWith(
        mockUserName,
        undefined,
        false,
      );
      expect(authService.generateTokens).toHaveBeenCalledWith(mockPayload);
      expect(mockSsoHandler.set).toHaveBeenCalledWith('new-access-token');

      expect(result).toEqual({
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      });
    });

    it('should throw UnauthorizedException if token is blacklisted', async () => {
      mockBlackListHandler.isBlackListed.mockResolvedValue(true);

      await expect(
        authService.refreshToken(mockAccessToken, mockRefreshToken),
      ).rejects.toThrow('请重新登录');

      expect(jwtService.verify).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException if refresh token is invalid', async () => {
      jwtService.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(
        authService.refreshToken(mockAccessToken, mockRefreshToken),
      ).rejects.toThrow('请重新登录');

      expect(redisService.sso).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException if access token does not match stored token', async () => {
      mockSsoHandler.get.mockResolvedValue('different-token');

      await expect(
        authService.refreshToken(mockAccessToken, mockRefreshToken),
      ).rejects.toThrow('该账号已在其他地方登录，请重新登录');

      expect(authService.validateUser).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException if user does not exist or is disabled', async () => {
      jest.spyOn(authService, 'validateUser').mockResolvedValue(false);

      await expect(
        authService.refreshToken(mockAccessToken, mockRefreshToken),
      ).rejects.toThrow('用户不存在或账号已被禁用');

      expect(authService.generateTokens).not.toHaveBeenCalled();
    });
  });

  describe('getUserInfo', () => {
    const mockUserId = 'user-id';
    const mockUserPermissions = {
      set: jest.fn().mockResolvedValue('OK'),
      get: jest.fn(),
      remove: jest.fn(),
    };

    const mockUserPermissionInfo: UserPermissionInfoEntity[] = [
      {
        id: 1,
        pid: 0,
        user_name: 'testUser',
        nick_name: 'Test User',
        avatar: 'avatar.png',
        role_names: 'admin,editor',
        permission: 'system:user:list',
        type: 'MENU',
        name: 'User Management',
        path: '/user',
        component: 'UserList',
        cache: true,
        hidden: false,
        icon: 'user',
        redirect: null,
        props: null,
        sort: 1,
      },
      {
        id: 2,
        pid: 1,
        user_name: 'testUser',
        nick_name: 'Test User',
        avatar: 'avatar.png',
        role_names: 'admin,editor',
        permission: 'system:user:add',
        type: 'BUTTON',
        name: 'Add User',
        path: null,
        component: null,
        cache: false,
        hidden: false,
        icon: null,
        redirect: null,
        props: null,
        sort: 1,
      },
    ];

    beforeEach(() => {
      userService.findUserPermissionInfo.mockResolvedValue(
        mockUserPermissionInfo,
      );
      redisService.userPermissions.mockReturnValue(mockUserPermissions);
    });

    it('should return user info with permissions and menus', async () => {
      const result = await authService.getUserInfo(mockUserId);

      expect(userService.findUserPermissionInfo).toHaveBeenCalledWith(
        mockUserId,
      );
      expect(redisService.userPermissions).toHaveBeenCalledWith(mockUserId);
      expect(mockUserPermissions.set).toHaveBeenCalledWith([
        'system:user:list',
        'system:user:add',
      ]);

      expect(result).toEqual({
        name: 'Test User',
        avatar: 'avatar.png',
        roles: ['admin', 'editor'],
        permissions: ['system:user:list', 'system:user:add'],
        menus: expect.any(Array),
      });

      // Check if menus are properly generated
      expect(result.menus.length).toBe(1);
      expect(result.menus[0]).toMatchObject({
        id: 1,
        name: 'User Management',
        path: '/user',
      });
    });

    it('should return user info for admin with full permissions', async () => {
      const adminInfo = [
        {
          ...mockUserPermissionInfo[0],
          user_name: mockBaseConfig.defaultAdmin.username,
        },
      ];

      userService.findUserPermissionInfo.mockResolvedValue(adminInfo);

      const result = await authService.getUserInfo(mockUserId);

      expect(result.permissions).toEqual([
        mockBaseConfig.defaultAdmin.permission,
      ]);
      expect(mockUserPermissions.set).toHaveBeenCalledWith([
        mockBaseConfig.defaultAdmin.permission,
      ]);
    });

    it('should return user info without permissions if user has no roles', async () => {
      const noRoleInfo = [
        {
          ...mockUserPermissionInfo[0],
          role_names: '',
        },
      ];

      userService.findUserPermissionInfo.mockResolvedValue(noRoleInfo);

      const result = await authService.getUserInfo(mockUserId);

      expect(result.roles).toEqual([]);
      expect(result.permissions).toEqual([]);
      expect(result.menus).toEqual([]);
      expect(mockUserPermissions.set).not.toHaveBeenCalled();
    });

    it('should use username if nickname is not provided', async () => {
      const noNicknameInfo = [
        {
          ...mockUserPermissionInfo[0],
          nick_name: null,
        },
      ];

      userService.findUserPermissionInfo.mockResolvedValue(noNicknameInfo);

      const result = await authService.getUserInfo(mockUserId);

      expect(result.name).toBe(noNicknameInfo[0].user_name);
    });

    it('should throw NotFoundException if user does not exist', async () => {
      userService.findUserPermissionInfo.mockResolvedValue([]);

      await expect(authService.getUserInfo(mockUserId)).rejects.toThrow(
        '用户不存在或账号已被禁用',
      );
    });

    it('should filter out button type items from menus', async () => {
      const result = await authService.getUserInfo(mockUserId);

      // Ensure only MENU type items are included in menus
      const menuItemIds = result.menus.flatMap((menu) => {
        return [menu.id, ...(menu.children?.map((child) => child.id) || [])];
      });

      expect(menuItemIds).toContain(1);
      expect(menuItemIds).not.toContain(2); // Button type should be excluded
    });

    it('should correctly map menu properties', async () => {
      const result = await authService.getUserInfo(mockUserId);

      expect(result.menus[0]).toMatchObject({
        id: 1,
        pid: 0,
        name: 'User Management',
        path: '/user',
        component: 'UserList',
        cache: true,
        hidden: false,
        icon: 'user',
        redirect: null,
        props: null,
      });
    });
  });
});
