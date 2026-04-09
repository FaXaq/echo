## 1. Create @echo/errors package

- [x] 1.1 Create `packages/errors/` directory with `package.json` (`name: "@echo/errors"`, `type: "module"`, exports `.` → `src/index.ts`, dep: `zod`)
- [x] 1.2 Create `packages/errors/tsconfig.json` extending `@echo/config`
- [x] 1.3 Copy `packages/app/src/errors.ts` to `packages/errors/src/index.ts`
- [x] 1.4 Add `@echo/errors` to `pnpm-workspace.yaml` packages list
- [x] 1.5 Run `pnpm --filter @echo/errors typecheck` to verify the package compiles

## 2. Scaffold @echo/modules package

- [x] 2.1 Create `packages/modules/package.json` with `name: "@echo/modules"`, `type: "module"`, and all subpath exports for all ten modules (song, track, audio-clip, midi-clip, file, invitation, organization, user, notification, health — each with `/domain`, `/infrastructure`, `/use-cases`)
- [x] 2.2 Create `packages/modules/tsconfig.json` extending `@echo/config`
- [x] 2.3 Add dependencies to `packages/modules/package.json`: `@echo/db`, `@echo/auth`, `@echo/errors`, `@echo/i18n`, `@echo/logger`, `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`, `nodemailer`, `zod`
- [x] 2.4 Add `@echo/modules` to `pnpm-workspace.yaml` packages list and run `pnpm install`

## 3. Implement song module

- [x] 3.1 Create `packages/modules/src/song/domain/index.ts` — copy `Song`, `SongId` types from `packages/domain/src/song/index.ts`
- [x] 3.2 Create `packages/modules/src/song/infrastructure/index.ts` — copy `SongRepoPort` from `packages/app/src/ports/song.ts` and `makeSongRepo` from `apps/api/src/adapters/song.ts`; update imports to use `./domain` and `@echo/db`
- [x] 3.3 Create `packages/modules/src/song/use-cases/index.ts` — copy all use-cases from `packages/app/src/use-cases/song/`; update imports to use `../infrastructure` and `@echo/errors`

## 4. Implement track module

- [x] 4.1 Create `packages/modules/src/track/domain/index.ts` — copy `Track`, `TrackId` types from `packages/domain/src/track/index.ts`
- [x] 4.2 Create `packages/modules/src/track/infrastructure/index.ts` — copy `TrackRepoPort` from `packages/app/src/ports/track.ts` and `makeTrackRepo` from `apps/api/src/adapters/track.ts`
- [x] 4.3 Create `packages/modules/src/track/use-cases/index.ts` — copy all use-cases from `packages/app/src/use-cases/track/`; update imports

## 5. Implement audio-clip module

- [x] 5.1 Create `packages/modules/src/audio-clip/domain/index.ts` — copy `AudioClip` type from `packages/domain/src/audio-clip/index.ts`
- [x] 5.2 Create `packages/modules/src/audio-clip/infrastructure/index.ts` — copy `AudioClipRepoPort` from `packages/app/src/ports/audio-clip.ts` and `makeAudioClipRepo` from `apps/api/src/adapters/audio-clip.ts`
- [x] 5.3 Create `packages/modules/src/audio-clip/use-cases/index.ts` — copy all use-cases from `packages/app/src/use-cases/audio-clip/`; update imports

## 6. Implement midi-clip module

- [x] 6.1 Create `packages/modules/src/midi-clip/domain/index.ts` — copy `MidiClip` type from `packages/domain/src/midi-clip/index.ts`
- [x] 6.2 Create `packages/modules/src/midi-clip/infrastructure/index.ts` — copy `MidiClipRepoPort` from `packages/app/src/ports/midi-clip.ts` and `makeMidiClipRepo` from `apps/api/src/adapters/midi-clip.ts`
- [x] 6.3 Create `packages/modules/src/midi-clip/use-cases/index.ts` — copy all use-cases from `packages/app/src/use-cases/midi-clip/`; update imports

## 7. Implement file module

- [x] 7.1 Create `packages/modules/src/file/domain/index.ts` — copy `AudioFile`, `FileType` types from `packages/domain/src/audio-clip/index.ts` or `packages/app/src/ports/file.ts`
- [x] 7.2 Create `packages/modules/src/file/infrastructure/index.ts` — copy `FileRepoPort` + `makeFileRepo` from `apps/api/src/adapters/file.ts` AND `FileStoragePort` + `makeFileStorageAdapter` + `S3Config` from `apps/api/src/adapters/file-storage.ts`
- [x] 7.3 Create `packages/modules/src/file/use-cases/index.ts` — empty (re-export nothing; use-cases are in audio-clip/midi-clip)

## 8. Implement invitation module

- [x] 8.1 Create `packages/modules/src/invitation/domain/index.ts` — define `Invitation` type (id, email, role, status, expiresAt, organizationName, organizationSlug)
- [x] 8.2 Create `packages/modules/src/invitation/infrastructure/index.ts` — copy `InvitationRepoPort` from `packages/app/src/ports/invitation.ts` and `makeInvitationRepo` from `apps/api/src/adapters/invitation.ts`
- [x] 8.3 Create `packages/modules/src/invitation/use-cases/index.ts` — copy `makeGetInvitation` from `packages/app/src/use-cases/invitation/get-invitation.ts`; update imports

## 9. Implement organization module

- [x] 9.1 Create `packages/modules/src/organization/domain/index.ts` — define `Organization` type `{ id: string; name: string; slug?: string | null }`
- [x] 9.2 Create `packages/modules/src/organization/infrastructure/index.ts` — copy `OrganizationRepoPort` from `packages/app/src/ports/organization.ts` and `makeOrganizationRepo` from `apps/api/src/adapters/organization.ts`; keep the better-auth dependency
- [x] 9.3 Create `packages/modules/src/organization/use-cases/index.ts` — empty

## 10. Implement user module

- [x] 10.1 Create `packages/modules/src/user/domain/index.ts` — copy permission predicates (`isSystemAdmin`, `canUpdateOrgMemberRole`, `canRevokeMembership`, `canCancelInvitation`) from `packages/domain/src/user/permissions/index.ts`
- [x] 10.2 Create `packages/modules/src/user/infrastructure/index.ts` — copy `UserPermissionRepoPort` from `packages/app/src/ports/user-permission.ts` and `makeUserPermissionRepo` from `apps/api/src/adapters/auth/user-permission.ts`
- [x] 10.3 Create `packages/modules/src/user/use-cases/index.ts` — empty

## 11. Implement notification module

- [x] 11.1 Create `packages/modules/src/notification/domain/index.ts` — empty or minimal email payload types
- [x] 11.2 Create `packages/modules/src/notification/infrastructure/index.ts` — copy `EmailNotifierPort` + `makeEmailNotifierRepo` from `apps/api/src/adapters/email-notifier.ts`; copy `MailerPort` + `makeMailer` from `apps/api/src/adapters/mailer/mailer.ts`; copy email templates from `apps/api/src/adapters/mailer/templates/index.ts` into `packages/modules/src/notification/infrastructure/templates/index.ts`
- [x] 11.3 Create `packages/modules/src/notification/use-cases/index.ts` — empty

## 12. Implement health module

- [x] 12.1 Create `packages/modules/src/health/domain/index.ts` — empty
- [x] 12.2 Create `packages/modules/src/health/infrastructure/index.ts` — copy `HealthCheckPort` from `packages/app/src/ports/health.ts` and `makeHealthRepo` from `apps/api/src/adapters/health.ts`
- [x] 12.3 Create `packages/modules/src/health/use-cases/index.ts` — copy `makeHealthCheck` from `packages/app/src/use-cases/health-check.ts`; update imports

## 13. Verify @echo/modules compiles

- [x] 13.1 Run `pnpm --filter @echo/modules typecheck` — fix any import resolution errors across all modules

## 14. Update apps/api

- [x] 14.1 Add `@echo/modules` and `@echo/errors` to `apps/api/package.json` dependencies; remove `@echo/domain` and `@echo/app`
- [x] 14.2 Update `apps/api/src/lib/errors.ts` — replace `@echo/app` import with `@echo/errors`
- [x] 14.3 Update `apps/api/src/context.ts` — replace all `./adapters/*` imports with corresponding `@echo/modules/*/infrastructure` imports (adapter factories)
- [x] 14.4 Update `apps/api/src/trpc.ts` — replace `@echo/app` port type imports with `@echo/modules/*/infrastructure` imports
- [x] 14.5 Update all files in `apps/api/src/router/` — replace `@echo/app` use-case imports with `@echo/modules/*/use-cases` imports
- [x] 14.6 Delete `apps/api/src/adapters/audio-clip.ts`, `email-notifier.ts`, `file-storage.ts`, `file.ts`, `health.ts`, `invitation.ts`, `midi-clip.ts`, `organization.ts`, `song.ts`, `track.ts`, `mailer/mailer.ts`, `mailer/templates/`, `auth/user-permission.ts` (keep `auth/auth.ts` and `auth/route.ts`)
- [x] 14.7 Run `pnpm --filter @echo/api typecheck` — fix any remaining import errors

## 15. Update apps/web

- [x] 15.1 Add `@echo/modules` to `apps/web/package.json` dependencies; remove `@echo/domain`
- [x] 15.2 Update the one file importing `@echo/domain/user` — change to `@echo/modules/user/domain`
- [x] 15.3 Run `pnpm --filter @echo/web typecheck`

## 16. Update apps/cli

- [x] 16.1 Update `apps/cli/package.json` — replace `@echo/app`/`@echo/domain` deps with `@echo/modules` and `@echo/errors` if needed
- [x] 16.2 Update any imports in `apps/cli/src/` from `@echo/app` or `@echo/domain` to `@echo/modules/*`
- [x] 16.3 Run `pnpm --filter @echo/cli typecheck`

## 17. Remove old packages

- [x] 17.1 Delete `packages/domain/` directory entirely
- [x] 17.2 Delete `packages/app/` directory entirely
- [x] 17.3 Remove `@echo/domain` and `@echo/app` entries from `pnpm-workspace.yaml`
- [x] 17.4 Run `pnpm install` to clean up lockfile

## 18. Final verification

- [x] 18.1 Run `pnpm typecheck` at repo root across all packages and apps — zero errors
- [x] 18.2 Run `pnpm build` at repo root — all packages build successfully
- [x] 18.3 Run `pnpm test` at repo root — all tests pass
- [x] 18.4 Verify no remaining imports of `@echo/domain` or `@echo/app` anywhere in the codebase (`grep -r "@echo/domain\|@echo/app" packages/ apps/ --include="*.ts"`)
