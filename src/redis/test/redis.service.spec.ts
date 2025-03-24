import { TestBed } from '@automock/jest';
import { RedisService } from '../redis.service';
import Redis from 'ioredis';
import { createHash } from 'crypto';
import { getBaseConfig } from 'src/common/config';

// 模拟外部依赖
jest.mock('src/common/config');

describe('RedisService Unit Test', () => {
  let redisService: RedisService;
  let redis: jest.Mocked<Redis>;

  const mockIp = '127.0.0.1';
  const mockUserAgent = 'test-agent';
  const mockValue = 'test-value';
  const mockBaseConfig = {
    captchaExpireIn: 300,
    jwt: {
      expiresIn: 3600,
      refreshTokenIn: '7d',
    },
    signInErrorExpireIn: 1800,
  };

  beforeAll(() => {
    const { unit, unitRef } = TestBed.create(RedisService).compile();

    redisService = unit;
    redis = unitRef.get('default_IORedisModuleConnectionToken');
  });

  beforeEach(() => {
    jest.clearAllMocks();
    (getBaseConfig as jest.Mock).mockReturnValue(mockBaseConfig);
  });

  describe('Captcha Operations', () => {
    let captchaKey: string;

    beforeEach(() => {
      const expectedHash = createHash('sha256')
        .update(`${mockIp}:${mockUserAgent}`)
        .digest('hex');
      captchaKey = `captcha: ${expectedHash}`;
    });

    it('should return an object with set, get, and remove methods', () => {
      const captcha = redisService.captcha(mockIp, mockUserAgent);

      expect(captcha).toHaveProperty('set');
      expect(captcha).toHaveProperty('get');
      expect(captcha).toHaveProperty('remove');
      expect(typeof captcha.set).toBe('function');
      expect(typeof captcha.get).toBe('function');
      expect(typeof captcha.remove).toBe('function');
    });

    describe('set', () => {
      it('should set captcha value with correct expiration', async () => {
        redis.set.mockResolvedValue('OK');

        const captcha = redisService.captcha(mockIp, mockUserAgent);
        await captcha.set(mockValue);

        expect(redis.set).toHaveBeenCalledWith(
          captchaKey,
          mockValue,
          'EX',
          mockBaseConfig.captchaExpireIn,
        );
      });
    });

    describe('get', () => {
      it('should get captcha value', async () => {
        redis.get.mockResolvedValue(mockValue);

        const captcha = redisService.captcha(mockIp, mockUserAgent);
        const result = await captcha.get();

        expect(result).toBe(mockValue);
        expect(redis.get).toHaveBeenCalledWith(captchaKey);
      });
    });

    describe('remove', () => {
      it('should remove captcha', async () => {
        redis.del.mockResolvedValue(1);

        const captcha = redisService.captcha(mockIp, mockUserAgent);
        await captcha.remove();

        expect(redis.del).toHaveBeenCalledWith(captchaKey);
      });
    });
  });

  describe('SSO Operations', () => {
    const mockUserId = 'user123';
    const ssoKey = `sso: ${mockUserId}`;

    it('should return an object with set, get, and remove methods', () => {
      const sso = redisService.sso(mockUserId);

      expect(sso).toHaveProperty('set');
      expect(sso).toHaveProperty('get');
      expect(sso).toHaveProperty('remove');
      expect(typeof sso.set).toBe('function');
      expect(typeof sso.get).toBe('function');
      expect(typeof sso.remove).toBe('function');
    });

    describe('set', () => {
      it('should set SSO token with correct expiration', async () => {
        redis.set.mockResolvedValue('OK');
        const sso = redisService.sso(mockUserId);
        await sso.set(mockValue);

        expect(redis.set).toHaveBeenCalledWith(ssoKey, mockValue, 'EX', 604800);
      });
    });

    describe('get', () => {
      it('should get SSO token', async () => {
        redis.get.mockResolvedValue(mockValue);

        const sso = redisService.sso(mockUserId);
        const result = await sso.get();

        expect(result).toBe(mockValue);
        expect(redis.get).toHaveBeenCalledWith(ssoKey);
      });
    });

    describe('remove', () => {
      it('should remove SSO token', async () => {
        redis.del.mockResolvedValue(1);

        const sso = redisService.sso(mockUserId);
        await sso.remove();

        expect(redis.del).toHaveBeenCalledWith(ssoKey);
      });
    });
  });

  describe('TrackLoginAttempts Operations', () => {
    let attemptsKey: string;

    beforeEach(() => {
      const expectedHash = createHash('sha256')
        .update(`${mockIp}:${mockUserAgent}`)
        .digest('hex');
      attemptsKey = `login-attempts: ${expectedHash}`;
    });

    it('should return an object with increment, get, reset, and set methods', () => {
      const loginAttempts = redisService.trackLoginAttempts(
        mockIp,
        mockUserAgent,
      );

      expect(loginAttempts).toHaveProperty('increment');
      expect(loginAttempts).toHaveProperty('get');
      expect(loginAttempts).toHaveProperty('reset');
      expect(loginAttempts).toHaveProperty('set');
      expect(typeof loginAttempts.increment).toBe('function');
      expect(typeof loginAttempts.get).toBe('function');
      expect(typeof loginAttempts.reset).toBe('function');
      expect(typeof loginAttempts.set).toBe('function');
    });

    describe('get', () => {
      it('should get login attempts count and return 0 if not exists', async () => {
        redis.get.mockResolvedValue(null);

        const loginAttempts = redisService.trackLoginAttempts(
          mockIp,
          mockUserAgent,
        );
        const result = await loginAttempts.get();

        expect(result).toBe(0);
        expect(redis.get).toHaveBeenCalledWith(attemptsKey);
      });

      it('should get login attempts count and convert string to number', async () => {
        redis.get.mockResolvedValue('3');

        const loginAttempts = redisService.trackLoginAttempts(
          mockIp,
          mockUserAgent,
        );
        const result = await loginAttempts.get();

        expect(result).toBe(3);
        expect(redis.get).toHaveBeenCalledWith(attemptsKey);
      });
    });

    describe('set', () => {
      it('should set login attempts count with correct expiration', async () => {
        redis.set.mockResolvedValue('OK');
        const attemptsCount = 5;

        const loginAttempts = redisService.trackLoginAttempts(
          mockIp,
          mockUserAgent,
        );
        await loginAttempts.set(attemptsCount);

        expect(redis.set).toHaveBeenCalledWith(
          attemptsKey,
          attemptsCount,
          'EX',
          mockBaseConfig.signInErrorExpireIn,
        );
      });
    });

    describe('increment', () => {
      it('should increment login attempts count', async () => {
        redis.get.mockResolvedValue('2');
        redis.set.mockResolvedValue('OK');

        const loginAttempts = redisService.trackLoginAttempts(
          mockIp,
          mockUserAgent,
        );
        await loginAttempts.increment();

        expect(redis.get).toHaveBeenCalledWith(attemptsKey);
        expect(redis.set).toHaveBeenCalledWith(
          attemptsKey,
          3,
          'EX',
          mockBaseConfig.signInErrorExpireIn,
        );
      });

      it('should start from 1 if no previous attempts', async () => {
        redis.get.mockResolvedValue(null);
        redis.set.mockResolvedValue('OK');

        const loginAttempts = redisService.trackLoginAttempts(
          mockIp,
          mockUserAgent,
        );
        await loginAttempts.increment();

        expect(redis.set).toHaveBeenCalledWith(
          attemptsKey,
          1,
          'EX',
          mockBaseConfig.signInErrorExpireIn,
        );
      });
    });

    describe('reset', () => {
      it('should reset login attempts counter', async () => {
        redis.del.mockResolvedValue(1);

        const loginAttempts = redisService.trackLoginAttempts(
          mockIp,
          mockUserAgent,
        );
        await loginAttempts.reset();

        expect(redis.del).toHaveBeenCalledWith(attemptsKey);
      });
    });
  });

  describe('BlackList Operations', () => {
    const mockToken = 'auth.token.123456';

    it('should return an object with set and isBlackListed methods', () => {
      const blackList = redisService.blackList();

      expect(blackList).toHaveProperty('set');
      expect(blackList).toHaveProperty('isBlackListed');
      expect(typeof blackList.set).toBe('function');
      expect(typeof blackList.isBlackListed).toBe('function');
    });

    describe('set', () => {
      it('should add token to blacklist with correct expiration', async () => {
        redis.set.mockResolvedValue('OK');

        const blackList = redisService.blackList();
        await blackList.set(mockToken);

        expect(redis.set).toHaveBeenCalledWith(
          mockToken,
          'logout',
          'EX',
          mockBaseConfig.jwt.expiresIn,
        );
      });
    });

    describe('isBlackListed', () => {
      it('should return true if token exists in blacklist', async () => {
        redis.exists.mockResolvedValue(1);

        const blackList = redisService.blackList();
        const result = await blackList.isBlackListed(mockToken);

        expect(result).toBe(true);
        expect(redis.exists).toHaveBeenCalledWith(mockToken);
      });

      it('should return false if token does not exist in blacklist', async () => {
        redis.exists.mockResolvedValue(0);

        const blackList = redisService.blackList();
        const result = await blackList.isBlackListed(mockToken);

        expect(result).toBe(false);
        expect(redis.exists).toHaveBeenCalledWith(mockToken);
      });
    });
  });

  describe('UserPermissions Operations', () => {
    const mockUserId = 'user123';
    const permissionsKey = `permissions: ${mockUserId}`;
    const mockPermissions = ['read', 'write', 'delete'];

    it('should return an object with set, get, and remove methods', () => {
      const userPermissions = redisService.userPermissions(mockUserId);

      expect(userPermissions).toHaveProperty('set');
      expect(userPermissions).toHaveProperty('get');
      expect(userPermissions).toHaveProperty('remove');
      expect(typeof userPermissions.set).toBe('function');
      expect(typeof userPermissions.get).toBe('function');
      expect(typeof userPermissions.remove).toBe('function');
    });

    describe('set', () => {
      it('should set user permissions with correct expiration', async () => {
        redis.sadd.mockResolvedValue(mockPermissions.length);
        redis.expire.mockResolvedValue(1);

        const userPermissions = redisService.userPermissions(mockUserId);
        await userPermissions.set(mockPermissions);

        expect(redis.sadd).toHaveBeenCalledWith(
          permissionsKey,
          mockPermissions,
        );
        expect(redis.expire).toHaveBeenCalledWith(
          permissionsKey,
          mockBaseConfig.jwt.expiresIn,
        );
      });
    });

    describe('get', () => {
      it('should get user permissions', async () => {
        redis.smembers.mockResolvedValue(mockPermissions);

        const userPermissions = redisService.userPermissions(mockUserId);
        const result = await userPermissions.get();

        expect(result).toEqual(mockPermissions);
        expect(redis.smembers).toHaveBeenCalledWith(permissionsKey);
      });
    });

    describe('remove', () => {
      it('should remove user permissions', async () => {
        redis.del.mockResolvedValue(1);

        const userPermissions = redisService.userPermissions(mockUserId);
        await userPermissions.remove();

        expect(redis.del).toHaveBeenCalledWith(permissionsKey);
      });
    });
  });
});
