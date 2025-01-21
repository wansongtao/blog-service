import { TestBed } from '@automock/jest';
import { RedisService } from '../redis.service';
import Redis from 'ioredis';
import { createHash } from 'crypto';
import { getBaseConfig } from 'src/common/config';
import { getSeconds } from 'src/common/utils';

// 模拟外部依赖
jest.mock('src/common/config');

describe('RedisService Unit Test', () => {
  let redisService: RedisService;
  let redis: jest.Mocked<Redis>;

  const mockUserName = 'testUser';
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
    describe('generateCaptchaKey', () => {
      it('should generate correct captcha key', () => {
        const expectedHash = createHash('sha256')
          .update(`${mockIp}:${mockUserAgent}`)
          .digest('hex');

        const result = redisService.generateCaptchaKey(mockIp, mockUserAgent);

        expect(result).toBe(`captcha: ${expectedHash}`);
      });
    });

    describe('setCaptcha', () => {
      it('should set captcha with default expiration', async () => {
        const mockKey = 'test-key';
        redis.set.mockResolvedValue('OK');

        await redisService.setCaptcha(mockKey, mockValue);

        expect(redis.set).toHaveBeenCalledWith(
          mockKey,
          mockValue,
          'EX',
          mockBaseConfig.captchaExpireIn,
        );
      });

      it('should set captcha with custom expiration', async () => {
        const mockKey = 'test-key';
        const customExpiration = 600;
        redis.set.mockResolvedValue('OK');

        await redisService.setCaptcha(mockKey, mockValue, customExpiration);

        expect(redis.set).toHaveBeenCalledWith(
          mockKey,
          mockValue,
          'EX',
          customExpiration,
        );
      });
    });

    describe('getCaptcha', () => {
      it('should get captcha value', async () => {
        const mockKey = 'test-key';
        redis.get.mockResolvedValue(mockValue);

        const result = await redisService.getCaptcha(mockKey);

        expect(result).toBe(mockValue);
        expect(redis.get).toHaveBeenCalledWith(mockKey);
      });
    });

    describe('delCaptcha', () => {
      it('should delete captcha', async () => {
        const mockKey = 'test-key';
        redis.del.mockResolvedValue(1);

        await redisService.delCaptcha(mockKey);

        expect(redis.del).toHaveBeenCalledWith(mockKey);
      });
    });
  });

  describe('SSO Operations', () => {
    describe('generateSSOKey', () => {
      it('should generate correct SSO key', () => {
        const result = redisService.generateSSOKey(mockUserName);
        expect(result).toBe(`sso: ${mockUserName}`);
      });
    });

    describe('setSSO', () => {
      it('should set SSO with default expiration', async () => {
        const mockKey = 'test-key';
        redis.set.mockResolvedValue('OK');

        await redisService.setSSO(mockKey, mockValue);

        expect(redis.set).toHaveBeenCalledWith(
          mockKey,
          mockValue,
          'EX',
          getSeconds(parseInt(mockBaseConfig.jwt.refreshTokenIn), 'd'),
        );
      });

      it('should set SSO with custom expiration', async () => {
        const mockKey = 'test-key';
        const customExpiration = 7200;
        redis.set.mockResolvedValue('OK');

        await redisService.setSSO(mockKey, mockValue, customExpiration);

        expect(redis.set).toHaveBeenCalledWith(
          mockKey,
          mockValue,
          'EX',
          customExpiration,
        );
      });
    });

    describe('getSSO', () => {
      it('should get SSO value', async () => {
        const mockKey = 'test-key';
        redis.get.mockResolvedValue(mockValue);

        const result = await redisService.getSSO(mockKey);

        expect(result).toBe(mockValue);
        expect(redis.get).toHaveBeenCalledWith(mockKey);
      });
    });

    describe('delSSO', () => {
      it('should delete SSO', async () => {
        const mockKey = 'test-key';
        redis.del.mockResolvedValue(1);

        await redisService.delSSO(mockKey);

        expect(redis.del).toHaveBeenCalledWith(mockKey);
      });
    });
  });

  describe('SignIn Errors Operations', () => {
    describe('generateSignInErrorsKey', () => {
      it('should generate correct sign-in errors key', () => {
        const expectedHash = createHash('sha256')
          .update(`${mockIp}:${mockUserAgent}`)
          .digest('hex');

        const result = redisService.generateSignInErrorsKey(
          mockIp,
          mockUserAgent,
        );
        expect(result).toBe(`sign-in:errors: ${expectedHash}`);
      });
    });

    describe('setSignInErrors', () => {
      it('should set sign-in errors count', async () => {
        const mockKey = 'test-key';
        const mockErrorCount = 3;
        redis.set.mockResolvedValue('OK');

        await redisService.setSignInErrors(mockKey, mockErrorCount);

        expect(redis.set).toHaveBeenCalledWith(
          mockKey,
          mockErrorCount,
          'EX',
          mockBaseConfig.signInErrorExpireIn,
        );
      });
    });

    describe('getSignInErrors', () => {
      it('should get sign-in errors count', async () => {
        const mockKey = 'test-key';
        const mockErrorCount = '3';
        redis.get.mockResolvedValue(mockErrorCount);

        const result = await redisService.getSignInErrors(mockKey);

        expect(result).toBe(3);
        expect(redis.get).toHaveBeenCalledWith(mockKey);
      });

      it('should return 0 when no errors found', async () => {
        const mockKey = 'test-key';
        redis.get.mockResolvedValue(null);

        const result = await redisService.getSignInErrors(mockKey);

        expect(result).toBe(0);
        expect(redis.get).toHaveBeenCalledWith(mockKey);
      });
    });

    describe('delSignInErrors', () => {
      it('should delete sign-in errors', async () => {
        const mockKey = 'test-key';
        redis.del.mockResolvedValue(1);

        await redisService.delSignInErrors(mockKey);

        expect(redis.del).toHaveBeenCalledWith(mockKey);
      });
    });
  });

  describe('Blacklist Operations', () => {
    describe('generateBlackListKey', () => {
      it('should generate correct blacklist key', () => {
        const result = redisService.generateBlackListKey(mockValue);
        expect(result).toBe(`blacklist: ${mockValue}`);
      });
    });

    describe('setBlackList', () => {
      it('should set token to blacklist', async () => {
        const mockKey = 'test-key';
        redis.set.mockResolvedValue('OK');

        redisService.setBlackList(mockKey);

        expect(redis.set).toHaveBeenCalledWith(
          `blacklist: ${mockKey}`,
          'logout',
          'EX',
          mockBaseConfig.jwt.expiresIn,
        );
      });
    });

    describe('isBlackListed', () => {
      it('should return true if token is blacklisted', async () => {
        const mockKey = 'test-key';
        redis.exists.mockResolvedValue(1);

        const result = await redisService.isBlackListed(mockKey);

        expect(result).toBe(true);
        expect(redis.exists).toHaveBeenCalledWith(`blacklist: ${mockKey}`);
      });

      it('should return false if token is not blacklisted', async () => {
        const mockKey = 'test-key';
        redis.exists.mockResolvedValue(0);

        const result = await redisService.isBlackListed(mockKey);

        expect(result).toBe(false);
        expect(redis.exists).toHaveBeenCalledWith(`blacklist: ${mockKey}`);
      });
    });
  });

  describe('UserPermission Operations', () => {
    describe('generateUserPermissionKey', () => {
      it('should generate user-permission key', () => {
        const result = redisService.generateUserPermissionKey(mockValue);
        expect(result).toBe(`permission: ${mockValue}`);
      });
    });

    describe('getUserPermission', () => {
      it('should get user-permission list', async () => {
        const mockKey = 'test-key';
        const mockList = ['3'];
        redis.smembers.mockResolvedValue(mockList);

        const result = await redisService.getUserPermission(mockKey);
        expect(result).toBe(mockList);
        expect(redis.smembers).toHaveBeenCalledWith(`permission: ${mockKey}`);
      });
    });

    describe('setUserPermission', () => {
      it('should set user-permission list', async () => {
        const mockKey = 'test-key';
        const mockPermissions = ['1'];
        redis.sadd.mockResolvedValue(1);

        redisService.setUserPermission(mockKey, mockPermissions);

        expect(redis.sadd).toHaveBeenCalledWith(
          `permission: ${mockKey}`,
          mockPermissions,
        );
        expect(redis.expire).toHaveBeenCalledWith(
          `permission: ${mockKey}`,
          mockBaseConfig.jwt.expiresIn,
        );
      });
    });

    describe('delUserPermission', () => {
      it('should delete user-permission', async () => {
        const mockKey = 'test-key';
        redis.del.mockResolvedValue(1);

        redisService.delUserPermission(mockKey);
        expect(redis.del).toHaveBeenCalledWith('permission: test-key');
      });
    });
  });
});
