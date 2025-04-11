import { Body, Controller, Post } from '@nestjs/common';
import { UploadService } from './upload.service';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiBaseResponse } from 'src/common/decorator/api-base-response.decorator';
import { PresignedDto } from './dto/presigned.dto';
import { PresignedEntity } from './entities/presigned.entity';

@ApiTags('upload')
@ApiBearerAuth()
@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @ApiOperation({ summary: '获取预签名 URL' })
  @ApiBaseResponse(PresignedEntity)
  @Post('presigned')
  presigned(@Body() presignedDto: PresignedDto): Promise<PresignedEntity> {
    return this.uploadService.presigned(presignedDto.filename);
  }
}
