-- CreateEnum
CREATE TYPE "public"."PageRole" AS ENUM ('EDITOR', 'VIEWER');

-- CreateTable
CREATE TABLE "public"."PageShare" (
    "id" TEXT NOT NULL,
    "pageId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "public"."PageRole" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PageShare_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PageInvite" (
    "id" TEXT NOT NULL,
    "pageId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "public"."PageRole" NOT NULL DEFAULT 'VIEWER',
    "token" TEXT NOT NULL,
    "inviterId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PageInvite_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PageShare_userId_idx" ON "public"."PageShare"("userId");

-- CreateIndex
CREATE INDEX "PageShare_pageId_idx" ON "public"."PageShare"("pageId");

-- CreateIndex
CREATE UNIQUE INDEX "PageShare_pageId_userId_key" ON "public"."PageShare"("pageId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "PageInvite_token_key" ON "public"."PageInvite"("token");

-- CreateIndex
CREATE INDEX "PageInvite_pageId_idx" ON "public"."PageInvite"("pageId");

-- CreateIndex
CREATE INDEX "PageInvite_email_idx" ON "public"."PageInvite"("email");

-- AddForeignKey
ALTER TABLE "public"."PageShare" ADD CONSTRAINT "PageShare_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "public"."Page"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PageShare" ADD CONSTRAINT "PageShare_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PageInvite" ADD CONSTRAINT "PageInvite_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "public"."Page"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PageInvite" ADD CONSTRAINT "PageInvite_inviterId_fkey" FOREIGN KEY ("inviterId") REFERENCES "public"."Profile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
