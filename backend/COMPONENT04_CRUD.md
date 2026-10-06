# Component 04: personal reminders and household announcements

Implemented on `feature/progress-notification-settings`. Existing uncommitted Component 04 work was retained. No commit, push, seed or shared database migration was performed.

## What existed before

Member and admin progress dashboards, completed history, notification lists/read actions, account preferences and notification settings already existed. Notifications had no independent create/edit/delete management resource. No personal reminder table, announcement table or scheduled reminder delivery worker existed. The existing family model uses `family_members.role`; admin screens also require `users.role = 'admin'`.

## CRUD actions and routes

| Resource | Create | Read | Update | Delete |
| --- | --- | --- | --- | --- |
| My Reminders, from member/admin Notifications | Add, choose assigned pending chore, title, optional note and future local time; `POST /api/reminders` | List/search/Upcoming/Past/All and View details; `GET /api/reminders`, `GET /api/reminders/:id` | Edit prefilled title/note/time for a pending reminder; `PATCH /api/reminders/:id` | Delete, confirm the named reminder; `DELETE /api/reminders/:id` |
| Manage Announcements, from admin Notifications | Add title/message, Draft or Published; `POST /api/announcements?family_id=<authorized-selection>` | Admin list/search/All/Draft/Published and View; members read published announcements from Notifications → Household Announcements; `GET /api/announcements?family_id=<authorized-selection>`, `GET /api/announcements/:id` | Edit prefilled content or publish a draft; `PATCH /api/announcements/:id` | Delete, confirm the named announcement; `DELETE /api/announcements/:id` |

`GET /api/reminders/chores` supplies only pending chores assigned to the signed-in user, with household access checked. User IDs and household IDs in request bodies cannot override server authorization. Announcement household selection is validated against database membership; mutations require both account admin and household admin roles. The member household selector reuses the existing first-household convention; the admin screen supports its existing household switcher.

## Database setup

The application's existing `users`, `families`, `family_members`, `chores`, `notifications` and `notification_settings` tables must exist. Apply the existing prerequisite scripts in `backend/sql` if setting up a new database; `users` is part of the existing auth setup, not created by this feature.

Review and explicitly apply `backend/sql/member4_reminders_announcements.sql` to the intended database, using its SQL console or:

```powershell
psql "$env:DATABASE_URL" -v ON_ERROR_STOP=1 -f backend/sql/member4_reminders_announcements.sql
```

The additive, transactional migration creates two resource tables, their indexes, a nullable announcement link on notifications, and a unique announcement/recipient index. It is repeatable and does not overwrite existing rows. It is deliberately not added to startup schema mutation. Back up and obtain authorization before applying it to a shared database. Configure backend `DATABASE_URL` and `JWT_SECRET` through the existing environment setup, and frontend `EXPO_PUBLIC_API_URL` for the API address reachable by the device. Restart the API and Expo after setup; no new dependencies are required.

All resource timestamps use `TIMESTAMPTZ`. The UI takes local `YYYY-MM-DD HH:mm`, rejects invalid calendar times, converts to ISO UTC and displays records in the device's local timezone and selected language. Chore deletion retains the reminder with a null chore reference; completed, reassigned or inaccessible chores show unavailable and cannot have reminders edited. Owners can still delete them.

## Delivery behavior

Personal reminders persist as saved schedules. **Automatic reminder delivery is not implemented**, because the project has no delivery worker. Past means the saved time has passed, not that a notification was delivered. The UI explicitly states this limitation. Hard deletion removes the entire saved schedule; there are no pending external/local delivery jobs to cancel.

Announcements generate existing in-app notifications when first published, only for current household members whose `notification_settings.announcements` is true. Missing settings default to no announcement alerts, matching existing defaults. Readers can always see published announcements regardless of alert preference. Publication and alert inserts share one transaction; edits lock the record and never notify again. A published announcement cannot be reverted to draft. Alert text is a publication snapshot; readers use the announcement screen for current edited content. Deleting the announcement cascades linked notification deletion and existing unread-count polling reflects that removal. No push, email or SMS service was added.

## Checks performed

- Before edits: frontend `npx.cmd tsc --noEmit` passed; backend `npm.cmd test` passed all 8 existing tests.
- After implementation: frontend TypeScript passed. Initial new route-type errors disappeared after Expo regenerated its cached typed routes with `npx.cmd expo start --offline --port 8083`.
- Backend `npm.cmd test`: 15 passed, 0 failed, 1 PostgreSQL integration test skipped. The 7 new HTTP tests use a query stub and cover authentication, UUID/input validation, timezone validation, token ownership, chore assignment conditions, past/unavailable reminders, household/admin restrictions, published-only member lists, opt-in alerts and first-publication behavior. These are not evidence of real database persistence.
- `git diff --check`: passed (existing Windows line-ending notices only).

The opt-in real PostgreSQL test uses **only** `TEST_DATABASE_URL`, never `.env` or `DATABASE_URL`. It creates a randomly named isolated schema, fixture users/households/chores, applies the migration inside that schema, exercises both full API CRUD cycles with independent re-reads and database assertions, checks isolation/alerts/chore lifecycle, then drops that schema. Use a disposable test database with schema creation permission:

```powershell
$env:TEST_DATABASE_URL = '<disposable PostgreSQL connection string>'
Set-Location backend
node --test test/component04Crud.postgres.test.js
Remove-Item Env:TEST_DATABASE_URL
```

## Viva demonstration

1. Apply the migration to your authorized development database and start the backend and Expo app. Use an existing member with a pending assigned chore, and an existing account that is both account admin and admin of the same household.
2. Member → Notifications → My Reminders → Add. Select that chore, enter a title, optional note and future local time, and Save. Reload the app and confirm the record remains.
3. View the reminder details. Edit its title, note and time; Save, reload and confirm all changes. Try an empty title and past time to show validation. Use search and Upcoming/Past/All.
4. Delete that reminder. Show its title in the confirmation, confirm, reload and confirm absence. A second user should receive 404 trying to view/edit/delete its ID. Show the saved-schedule delivery limitation.
5. Admin → Notifications → Manage Announcements → Add. Enter title/message, choose Draft and Save. Reload and View details. A member in that household should see no draft.
6. Edit the draft, choose Published and Save. Reload; the member → Notifications → Household Announcements can View it. If their announcement alert preference is enabled, one in-app alert appears. If disabled, they still see the announcement with no alert.
7. Edit the published title/message, Save and reload as both users. Show updated content and confirm the edit generated no second alert. Search and status filters remain available.
8. Delete as admin after showing the title in the confirmation. Reload both users and confirm absence and linked-alert removal. A member cannot mutate it; an unrelated household admin cannot list or mutate it.
9. Visit existing progress, completed history, notifications/read actions, settings and preferences. Manually check English/Sinhala/Tamil, light/dark themes and native keyboard/layout behavior.

## Verification still needed

No disposable PostgreSQL test URL was supplied, so the real PostgreSQL suite was skipped. Shared database migration, real database CRUD reload cycles and UI/device interaction were not performed. Type checking and stub-based HTTP tests passed; persistence is implemented through PostgreSQL queries but remains unverified against a running database. Native/web visual layout, translations, multi-household selection and existing navigation need the manual checks above after authorized database setup.

## Files changed for this task

- `backend/sql/member4_reminders_announcements.sql`
- `backend/src/utils/component04Validation.js`
- `backend/src/routes/reminderRoutes.js`
- `backend/src/routes/announcementRoutes.js`
- `backend/src/server.js` (resource route registration)
- `backend/test/component04Crud.test.js`
- `backend/test/component04Crud.postgres.test.js`
- `frontend/src/services/component04CrudService.ts`
- `frontend/src/i18n/crudTranslations.ts`
- `frontend/src/i18n/translations.ts` (merge new keys)
- `frontend/src/screens/home/Component04CrudScreen.tsx`
- `frontend/src/screens/home/Component04Screens.tsx` (member notification links)
- `frontend/src/screens/admin/AdminNotificationsScreen.tsx` (admin notification links)
- `frontend/src/app/home/{reminders,announcements}.tsx`
- `frontend/src/app/admin/{reminders,announcements}.tsx`
- `frontend/src/app/home/_layout.tsx`
- `frontend/src/app/admin/_layout.tsx`
- `backend/COMPONENT04_CRUD.md`

Expo also regenerated ignored `.expo` route-type/cache files during validation. Existing unrelated modified/untracked files were preserved.