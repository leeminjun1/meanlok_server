import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PageAccessGuard } from '../../common/guards/page-access.guard';
import { WorkspaceRoleGuard } from '../../common/guards/workspace-role.guard';

@Module({
  imports: [PassportModule.register({ defaultStrategy: 'jwt' })],
  controllers: [AuthController],
  providers: [JwtStrategy, JwtAuthGuard, WorkspaceRoleGuard, PageAccessGuard],
  exports: [JwtStrategy, JwtAuthGuard, WorkspaceRoleGuard, PageAccessGuard],
})
export class AuthModule {}
