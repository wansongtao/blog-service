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
});
