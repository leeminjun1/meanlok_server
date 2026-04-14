# Mean록 Server

Mean록 백엔드 API 서버입니다.

- Framework: NestJS
- ORM: Prisma
- DB: Supabase Postgres
- Auth: Supabase JWT 검증

## 주요 기능

- 워크스페이스 생성/조회/수정/삭제
- 멤버 관리/워크스페이스 초대
- 페이지 트리 관리
  - 생성/조회/수정/삭제
  - 이동/복제
- 문서 저장 (`MARKDOWN`/`HTML`/`MIXED`)
- 페이지 단위 공유
  - 직접 공유(`PageShare`)
  - 페이지 초대(`PageInvite`)
  - 링크 수락
- 게스트 접근 제어
  - 공유된 페이지 및 하위 페이지만 접근
- AI 보조 API

## 권한 모델 요약

- Workspace Role: `OWNER` / `EDITOR` / `VIEWER`
- Page Role: `EDITOR` / `VIEWER`
- 실제 페이지 접근 권한은 Workspace 멤버 권한 + 페이지 공유 권한을 합산해 계산합니다.

## 인증

프론트는 Supabase Auth로 토큰을 발급받고, API 호출 시 `Authorization: Bearer <token>`을 전달합니다.

서버는 토큰 헤더를 보고 다음을 지원합니다.

- `ES256` 토큰: Supabase JWKS로 검증
- `HS256` 토큰: `SUPABASE_JWT_SECRET`으로 검증

## 사전 요구사항

- Node.js 22+
- npm 10+
- Supabase 프로젝트

## 환경 변수

`.env` 파일 생성:

```bash
cp .env.example .env
```

주요 값:

- `DATABASE_URL`
- `DIRECT_URL`
- `PORT` (기본 `3001`)
- `CORS_ORIGIN` (기본 `http://localhost:3000`)
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_JWT_SECRET`
- `OPENAI_API_KEY` (AI 기능 사용 시)

## 로컬 실행

```bash
npm install
npm run prisma:migrate
npm run start:dev
```

- API Base URL: `http://localhost:3001/api`

## 빌드 / 테스트

```bash
npm run build
npm run test
```

## Prisma

```bash
npm run prisma:generate
npm run prisma:migrate
npm run prisma:studio
```

## 주요 모듈

- `src/modules/auth`
- `src/modules/workspaces`
- `src/modules/members`
- `src/modules/invites`
- `src/modules/pages`
- `src/modules/documents`
- `src/modules/page-shares`
- `src/modules/ai`

## 참고

- 현재 페이지 초대는 실제 메일 발송 대신 링크 공유 방식으로 동작합니다.
