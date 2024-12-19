import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { getBaseConfig } from 'src/common/config';
import { Client } from 'minio';

@Injectable()
export class UploadService {
  private minioClient: Client;

  constructor(private readonly configService: ConfigService) {
    const config = getBaseConfig(configService);

    this.minioClient = new Client({
      endPoint: config.minio.endPoint,
      port: config.minio.port,
      useSSL: config.minio.useSSL,
      accessKey: config.minio.accessKey,
      secretKey: config.minio.secretKey,
    });
  }
}
