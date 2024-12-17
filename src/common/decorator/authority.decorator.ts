import { SetMetadata } from '@nestjs/common';

export const AUTHORITY_KEY = 'permissions';
export const Authority = (...permissions: string[]) =>
  SetMetadata(AUTHORITY_KEY, permissions);
