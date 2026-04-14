-- Normalize legacy rows before dropping the enum variant.
UPDATE "public"."Document"
SET "format" = 'MARKDOWN'
WHERE "format" = 'MIXED';

ALTER TYPE "public"."DocFormat" RENAME TO "DocFormat_old";
CREATE TYPE "public"."DocFormat" AS ENUM ('MARKDOWN', 'HTML');

ALTER TABLE "public"."Document" ALTER COLUMN "format" DROP DEFAULT;
ALTER TABLE "public"."Document"
  ALTER COLUMN "format" TYPE "public"."DocFormat"
  USING ("format"::text::"public"."DocFormat");
ALTER TABLE "public"."Document" ALTER COLUMN "format" SET DEFAULT 'MARKDOWN';

DROP TYPE "public"."DocFormat_old";
