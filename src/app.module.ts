import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import configuration from './config/configuration';
import { AccessModule } from './common/access.module';
import { PrismaModule } from './prisma/prisma.module';
import { SanitizeModule } from './shared/sanitize/sanitize.module';
import { AuthModule } from './modules/auth/auth.module';
import { WorkspacesModule } from './modules/workspaces/workspaces.module';
import { MembersModule } from './modules/members/members.module';
import { InvitesModule } from './modules/invites/invites.module';
import { PagesModule } from './modules/pages/pages.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { AiModule } from './modules/ai/ai.module';
import { PageSharesModule } from './modules/page-shares/page-shares.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    PrismaModule,
    AccessModule,
    SanitizeModule,
    AuthModule,
    WorkspacesModule,
    MembersModule,
    InvitesModule,
    PagesModule,
    DocumentsModule,
    AiModule,
    PageSharesModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
