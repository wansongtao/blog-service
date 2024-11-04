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

  const mockUserName = 'testUser';
  const mockIp = '127.0.0.1';
  const mockUserAgent = 'test-agent';
  const mockValue = 'test-value';
  const mockBaseConfig = {
    captchaExpireIn: 300,
    jwt: {
      expiresIn: 3600,
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

        expect(result).toBe(`captcha:${expectedHash}`);
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
        expect(result).toBe(`sso:${mockUserName}`);
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
          mockBaseConfig.jwt.expiresIn,
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
        const result = redisService.generateSignInErrorsKey(mockUserName);
        expect(result).toBe(`sign-in:errors:${mockUserName}`);
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
});
