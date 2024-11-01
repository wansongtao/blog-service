import { TestBed } from '@automock/jest';
import { AuthService } from '../auth.service';
import Redis from 'ioredis';
import svgCaptcha from 'svg-captcha';
import { getCaptchaKey } from 'src/common/config/redis-key';
import { getBaseConfig } from 'src/common/config';

// 模拟外部依赖
jest.mock('svg-captcha');
jest.mock('src/common/config/redis-key');
jest.mock('src/common/config');

describe('AuthService Unit Test', () => {
  let authService: AuthService;
  let redis: jest.Mocked<Redis>;

  const mockIp = '127.0.0.1';
  const mockUserAgent = 'test-agent';
  const mockCaptchaText = 'abcd';
  const mockCaptchaSvg = '<svg>test</svg>';
  const mockKey = 'test-key';
  const mockExpireIn = 300;

  beforeAll(() => {
    // .compile() 会自动分析 AuthService 的依赖关系，并为所有依赖创建模拟对象
    const { unit, unitRef } = TestBed.create(AuthService).compile();

    authService = unit;
    // 获取被注入的 Redis 模拟实例，使用 InjectRedis 注入的 redis 的 key 固定为 default_IORedisModuleConnectionToken
    redis = unitRef.get('default_IORedisModuleConnectionToken');
  });

  // 每个测试前重置模拟
  beforeEach(() => {
    jest.clearAllMocks();

    // 设置模拟返回值
    (svgCaptcha.create as jest.Mock).mockReturnValue({
      text: mockCaptchaText,
      data: mockCaptchaSvg,
    });
    (getCaptchaKey as jest.Mock).mockReturnValue(mockKey);
    (getBaseConfig as jest.Mock).mockReturnValue({
      captchaExpireIn: mockExpireIn,
    });
  });

  describe('generateCaptcha', () => {
    it('should generate captcha and store in redis', () => {
      // 设置 redis 模拟返回值
      redis.set.mockResolvedValue('OK');

      // 调用被测试方法
      const result = authService.generateCaptcha(mockIp, mockUserAgent);

      // 验证 svg-captcha 的 create 方法调用参数
      expect(svgCaptcha.create).toHaveBeenCalledWith({
        size: 4,
        noise: 2,
        color: true,
        ignoreChars: '0o1i',
        background: '#f0f0f0',
      });

      // 验证 getCaptchaKey 方法调用参数
      expect(getCaptchaKey).toHaveBeenCalledWith(mockIp, mockUserAgent);

      // 验证 redis 存储方法调用参数
      expect(redis.set).toHaveBeenCalledWith(
        mockKey,
        mockCaptchaText,
        'EX',
        mockExpireIn,
      );

      // 验证返回值
      expect(result).toEqual({
        captcha: `data:image/svg+xml;base64,${Buffer.from(mockCaptchaSvg).toString('base64')}`,
      });
    });

    it('should handle captcha generation errors', () => {
      // 模拟错误
      (svgCaptcha.create as jest.Mock).mockImplementation(() => {
        throw new Error('Captcha generation failed');
      });

      // 验证错误抛出
      expect(() => authService.generateCaptcha(mockIp, mockUserAgent)).toThrow(
        'Captcha generation failed',
      );

      // 验证失败时不调用 redis
      expect(redis.set).not.toHaveBeenCalled();
    });
  });
});
