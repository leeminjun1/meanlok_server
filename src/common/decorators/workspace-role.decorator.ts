import { SetMetadata } from '@nestjs/common';
import { Role } from '@prisma/client';

export const WORKSPACE_ROLE_KEY = 'workspaceRole';

export const WorkspaceRole = (role: Role) => SetMetadata(WORKSPACE_ROLE_KEY, role);
