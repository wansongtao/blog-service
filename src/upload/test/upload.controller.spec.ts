import { TestBed } from '@automock/jest';
import { UploadController } from '../upload.controller';
import { UploadService } from '../upload.service';

describe('UploadController', () => {
  let controller: UploadController;
  let uploadService: jest.Mocked<UploadService>;

  beforeEach(async () => {
    const { unit, unitRef } = TestBed.create(UploadController).compile();

    controller = unit;
    uploadService = unitRef.get(UploadService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should inject UploadService', () => {
    expect(uploadService).toBeDefined();
  });

  describe('presigned', () => {
    it('should return presigned URL', async () => {
      const presignedUrl = 'http://localhost:9000/avatar/test.jpg';

      uploadService.presigned.mockResolvedValue({ presignedUrl });

      const result = await controller.presigned({ filename: 'test.jpg' });

      expect(result).toEqual({ presignedUrl });
    });
  });
});
