import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { getBaseConfig } from './common/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = getBaseConfig(app.get(ConfigService));
  const PORT = config.port;
  await app.listen(PORT);
}
bootstrap();
