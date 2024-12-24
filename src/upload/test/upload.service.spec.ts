import { TestBed } from '@automock/jest';
import { UploadService } from '../upload.service';
import { ConfigService } from '@nestjs/config';
import { Client } from 'minio';

jest.mock('minio');

describe('UploadService', () => {
  let uploadService: UploadService;

  const config = {
    MINIO_END_POINT: 'localhost',
    MINIO_PORT: 9000,
    MINIO_USE_SSL: 'false',
    MINIO_ACCESS_KEY: 'minioadmin',
    MINIO_SECRET_KEY: 'minioadmin',
    MINIO_BUCKET_NAME: 'avatar',
    MINIO_EXPIRES_IN: 120,
  };

  beforeEach(async () => {
    const { unit } = TestBed.create(UploadService)
      .mock(ConfigService)
      .using({
        get: (key: string) => config[key],
      })
      .compile();

    uploadService = unit;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(uploadService).toBeDefined();
  });

  it('should initialize minio client with correct config', () => {
    expect(Client).toHaveBeenCalledWith({
      endPoint: 'localhost',
      port: 9000,
      useSSL: false,
      accessKey: 'minioadmin',
      secretKey: 'minioadmin',
    });
  });

  describe('presigned', () => {
    it('should return presigned URL', async () => {
      const presignedUrl = 'http://localhost:9000/avatar/test.jpg';

      jest
        .spyOn(uploadService['minioClient'], 'presignedPutObject')
        .mockResolvedValue(presignedUrl);

      const result = await uploadService.presigned('test.jpg');

      expect(result).toEqual({ presignedUrl });
    });
  });
});
