# UniClubs Security and Production Audit

Audit date: 2026-11-14

## Scope and evidence

Reviewed the React/Vite authentication flow, API client, Express middleware and routes, controllers, Prisma schema and checked-in migration SQL, environment examples, and upload handling. No production database URL was used. No migration was run. A valid readable backup could not be verified, so database modification and live role/data tests were not attempted.

## Findings

### Critical

- No verified critical finding in the source reviewed. Production readiness is not certified because deployed secrets, database state, and live authorization behavior are outside this workspace audit.

### High

- Legacy plaintext-password fallback accepted a candidate password by direct comparison with the database value and logged the user's email during migration. Removed the fallback and email logging. Existing bcrypt hashes remain supported; possible plaintext accounts will need a controlled credential reset after separate verification.
- Uploaded event documents were exposed from a public static directory, and Render's ephemeral local storage would not preserve them. Removed public static serving, added signed-in event authorization to file retrieval, added a 2 MB cap and sanitized display filenames, and moved default temporary uploads out of the project tree. Active coordinators, assigned faculty, department HODs and DSW can access relevant event documents. A persistent Render disk or object storage must be configured with `UPLOAD_DIR`; existing files and database references were not moved.
- Student responses exposed all club member names, student attendance emails, and internal approval data. Responses now limit club member identity to the current caller, omit emails from attendance rows, and omit approval records from student event views.
- Error responses exposed Prisma error details in multiple controllers. Several high-impact controllers now return generic server errors and the global handler no longer returns internal 5xx messages. Remaining controller instances are listed under remaining work.

### Medium

- Registration had no dedicated throttle. Added a five-attempt/hour IP limiter; shared auth throttling is reduced to 20 requests per 15 minutes.
- Express bound to loopback, preventing typical Render ingress. It now listens on `0.0.0.0`.
- Session restoration could leave loading state pending when a request became stale. Failure now clears only the matching pending restoration and expired/invalid server sessions remain unauthenticated.
- Login trimmed passwords, which could change valid password values. It now preserves the exact submitted password.
- Demo quick-fill included a hardcoded default password. Removed the password default; demo email buttons remain and require manual password entry.
- Auth cookies now support environment-controlled SameSite and optional domain, with Secure forced in production and whenever SameSite=None is selected.
- Request JSON body size is capped at 1 MB. Upload errors report clear 400/413 responses.

### Low

- `.gitignore` explicitly ignores backend environment files while preserving the safe example file.
- Existing startup JWT length check, HttpOnly cookie, bcrypt cost 10, token expiration, database-backed tokenVersion invalidation, role middleware, Helmet, CORS allowlist, and health endpoint were present and retained.

## Authentication, password and role status

- Login, registration, `/auth/me`, logout, expiry verification, status checks, and tokenVersion invalidation are implemented in the existing cookie/JWT architecture. The backend remains authoritative.
- Removed the committed demo password from the DSW quick-fill control; account email shortcuts remain.
- Registration and staff provisioning hash new passwords with bcrypt; APIs remove password fields before returning users. No password change API exists in this project.
- Existing bcrypt hashes are compatible with `bcrypt.compare`; no hashes or user records were changed by this audit.
- Role route protection exists for DSW, HOD, FACULTY_INCHARGE, STUDENT; coordinator remains a STUDENT with active club assignment data. Source inspection found assignment-aware event and certificate behavior. The full four-role live test matrix was not run.
- Cookie configuration defaults to `SameSite=Lax`, appropriate for same-site hosting. Vercel and Render default domains are cross-site: configure `COOKIE_SAME_SITE=none` and HTTPS, and confirm browser third-party-cookie behavior. A custom shared registrable domain is preferable. Set `COOKIE_DOMAIN` only when both services share the intended parent domain.
- Cookie-authenticated unsafe methods do not have explicit CSRF tokens or Origin validation. SameSite offers some protection, but cross-site cookie deployment requires a deliberate CSRF design and browser verification before production.

## Database and data preservation

- Prisma schema relationships and three migration SQL files were inspected. The baseline is explicitly a no-DDL marker for an existing schema; later migrations add coordinator details, certificates, and `tokenVersion`.
- No database URL was read or contacted, no backup was verified, and no migrations were executed. Existing database data, hashes, relationships, and uploaded files remain untouched by this work.
- Configure production `DATABASE_URL` to the existing Neon database. Review `prisma migrate status` against that database after verifying a readable backup; use `prisma migrate deploy` only after confirming migration history and backup. The project does not currently define a production migration script.
- The Prisma client is a process-wide singleton and startup connects/retries; health reports DB readiness. No explicit provider-specific pool settings are configured. Use Neon pooled connection string if appropriate for the selected deployment mode.

## Integrations and deployment configuration

- Existing API route mounts and frontend API client were preserved. Vite uses `/api` and its development proxy; set `VITE_API_URL` to the Render HTTPS API URL for production builds.
- Required Render variables: `NODE_ENV=production`, `PORT` (platform supplied), `DATABASE_URL`, strong unique `JWT_SECRET` (at least 32 characters), `FRONTEND_ORIGIN` (exact Vercel origin), `COOKIE_SAME_SITE`, optionally `COOKIE_DOMAIN`, and persistent `UPLOAD_DIR`.
- Required Vercel variable: `VITE_API_URL=https://<render-service-domain>/api`. `VITE_API_PROXY_TARGET` is development-only. Never put secrets in Vite variables.
- Backend start command: `npm start` from `backend` (or `npm --prefix backend start` at repository root). Add and review a `prisma migrate deploy` release step after database backup/status confirmation.
- Existing upload paths are references to local files. Production persistence is not ready until a Render persistent disk is mounted at `UPLOAD_DIR` and old files are safely copied, or object storage and migration are implemented. This report did not copy or delete any file.

## Verification and remaining risks

- Automated tests were not added or run, per workspace instructions. No live auth, database persistence, role matrix, upload, browser, or deployment test is claimed as passed.
- Vercel build, Render startup, Neon connectivity, actual CORS/cookie behavior, CSRF, persistent file storage, and production migrations remain deployment checks.
- Some controllers log database error messages for operational diagnosis. Review log access/retention in the host environment; request data and credentials are not included by these log statements.
- Some student-owned event workflows intentionally reveal event-specific student details through certificate records to the assigned workflow; confirm business policy and restrict further if needed.

## Files changed

- `.gitignore`
- `SECURITY_AUDIT.md`
- `backend/.env.example`
- `backend/src/controllers/auth.controller.js`
- `backend/src/controllers/club.controller.js`
- `backend/src/controllers/event.controller.js`
- `backend/src/controllers/user.controller.js`
- `backend/src/index.js`
- `backend/src/routes/auth.routes.js`
- `backend/src/routes/event.routes.js`
- `frontend/src/components/common/SupportingDocumentActions.jsx`
- `frontend/src/context/AuthContext.jsx`
- `frontend/src/pages/auth/Login.jsx`
- `frontend/src/services/authService.js`

