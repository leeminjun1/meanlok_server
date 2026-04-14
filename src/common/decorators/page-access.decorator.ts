import { SetMetadata } from '@nestjs/common';

export const PAGE_ACCESS_KEY = 'pageAccess';

export type PageAccessRole = 'VIEWER' | 'EDITOR';

export const PageAccess = (role: PageAccessRole) => SetMetadata(PAGE_ACCESS_KEY, role);
