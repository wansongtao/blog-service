import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  StreamableFile,
  Inject,
} from '@nestjs/common';
import { BaseResponseEntity } from 'src/common/entities/base-response.entity';
import { throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

import type { Response, Request } from 'express';

@Injectable()
export class BaseResponseInterceptor<T> implements NestInterceptor<T, any> {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler) {
    const ctx = context.switchToHttp();
    const response = ctx.getResponse<Response>();
    const message = response.statusMessage ?? 'Success';
    const request = ctx.getRequest<Request>();

    return next.handle().pipe(
      map((data) => {
        if (data instanceof Error) {
          throw data;
        }

        if (data instanceof StreamableFile || Buffer.isBuffer(data)) {
          return data;
        }

        const result: BaseResponseEntity<T> = {
          statusCode: 200,
          data: data ?? null,
          message,
        };

        if (data?.statusCode || data?.message) {
          result.statusCode = data?.statusCode ?? 200;
          result.message = data?.message ?? message;
          result.data = data?.data ?? null;
        }

        this.addLogger(request, result);

        return result;
      }),
      catchError((err) => {
        return throwError(() => err);
      }),
    );
  }

  addLogger(req: Request, res: BaseResponseEntity<any>) {
    const { method, originalUrl, body, query, params, ip } = req;
    this.logger.info('response', {
      req: {
        method,
        url: originalUrl,
        body,
        query,
        params,
        ip,
      },
      res: res.data?.captcha
        ? { ...res, data: { captcha: 'data:image/png;base64,' } }
        : res,
    });
  }
}
