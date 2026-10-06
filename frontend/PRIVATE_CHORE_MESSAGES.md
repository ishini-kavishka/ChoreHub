# Private Client → Admin Chore Messages

The existing client Notifications screen now has a small **Message Admin** chip. The modal selects a Chore from the existing authenticated **My Chores** API and accepts a required message of up to 500 characters. A linked assignment notification can preselect its Chore. Send calls the real API; only a successful response closes the form and displays “Message sent to Admin”. Failed sends retain the text, and repeated taps are guarded.

The existing Admin Notifications screen displays **Client Message**, the real sender name, related Chore title, its current assigned date/time when scheduled, the original message, and the database sent date/time in the current locale. Opening the card marks it read using the existing API. The trash action asks **Delete message?**, supports Cancel, and removes the notification only after successful persistent deletion. Counts update from the remaining data. Failed deletion retains the card and confirmation for retry.

## Files changed for this request

Existing frontend implementation files:

- `src/screens/home/Component04Screens.tsx`: message action, preselected assignment action, modal, success notice; existing time filters and notification functionality retained.
- `src/screens/admin/AdminNotificationsScreen.tsx`: private-message metadata, read behavior and confirmed deletion; existing header, filters, navigation and cards retained.
- `src/screens/home/MemberChoreDetailsScreen.tsx`: removed the previous time-change-request UI entry point only.
- `src/services/notificationService.ts`: sender metadata/type and authenticated, live-only send API method.
- `src/i18n/clientTranslations.ts`: localized message title while preserving user-entered message text.
- `src/i18n/translations.ts`: included the new English, Sinhala and Tamil strings.
- `scripts/test-admin-notifications.cjs`: private-message read/delete rendering coverage.
- `scripts/test-client-notification-delete.cjs`: assignment action now tests the simple message form.

Existing backend files:

- `src/config/db.js`: additive notification sender column in the existing startup schema workflow.
- `src/controllers/notificationController.js`: private-message creation and sender metadata in recipient-only notification reads.
- `src/routes/notificationRoutes.js`: authenticated creation route.

New frontend files:

- `src/components/notifications/PrivateChoreMessageForm.tsx`: a modal form, not another screen or navigation system.
- `src/i18n/privateMessageTranslations.ts`: English/Sinhala/Tamil strings.
- `scripts/test-private-chore-messages.cjs`: form validation, selection, retry, failure retention, duplicate-send guard, theme and localization checks.
- `PRIVATE_CHORE_MESSAGES.md`: this report.

New backend file:

- `test/privateChoreMessages.postgres.test.js`: isolated real HTTP/JWT/PostgreSQL integration test.

## Database and APIs

Uses the existing **notifications** table, not a chat or request table. Its existing `user_id` is the responsible recipient, existing `chore_id` links the actual Chore, and existing `message`, `type`, `is_read` and `created_at` persist the inbox record. The only new schema field is nullable `sender_id UUID REFERENCES users(id) ON DELETE SET NULL`. The type is `client_chore_message`; the server-generated `created_at` timestamp is displayed with both date and clock time.

New endpoint: `POST /api/notifications/chore-messages` with `{ chore_id, message }`.

Reused endpoints:

- `GET /api/chores/my-chores` for the client's own assigned Chores.
- `GET /api/notifications` for the existing recipient inbox and polling/refresh.
- `PATCH /api/notifications/:id/read` and `PATCH /api/notifications/read-all`.
- `GET /api/notifications/unread-count`.
- `DELETE /api/notifications/:id` for permanent removal of the recipient's inbox row.

## Privacy and unchanged Chores

The JWT middleware supplies the sender identity. Inside a transaction, the server locks and checks the real Chore assignment and, when applicable, current household membership. It derives the responsible Admin/household owner using the existing ownership helper. It rejects a missing or self recipient; supplied sender/recipient IDs are never trusted. The notification list, read and delete queries constrain records to the authenticated `user_id`. Another client, including the sender, and unrelated Admins cannot access the private Admin inbox row. A global Admin role alone does not grant access.

Sending inserts one notification; it does not update a Chore or create an approval request. Deleting removes only that notification. Assignment, due time, status, completion, progress and other notices remain intact. Admins may separately use the existing Chore edit feature.

The former time-change inbox/form is no longer mounted in the client/Admin Notifications screens, and its Chore-details entry point was removed. Historical request code and records were preserved; this feature has no Approve/Reject controls or chat workflow.

## Validation actually run

- TypeScript: `npx tsc --noEmit` passed.
- Frontend rendering/service tests: 17 tests passed across private messages, Admin Notifications, client notification deletion/time filters, reminders and localization. Targeted notification tests were rerun after the final read-state/success-notice adjustments.
- Real private-message HTTP/JWT/PostgreSQL test passed: Chamara → responsible Admin, Clean Kitchen scheduled for 6 PM, sender spoofing ignored, Kasun and unrelated Admin denied, empty/oversized/invalid/foreign Chore inputs rejected, read state and deletion survive a fresh login, and full Chore snapshots stay identical before/after send/delete. Test fixtures were removed.
- Four existing real database regression tests passed: Admin announcements/reminders/notifications, Chore-generated inbox events, client notification deletion/privacy and client reminder CRUD. Each cleaned up its own temporary fixtures.
- Expo web export succeeded for all 59 routes, including both existing Notifications routes.
- JavaScript syntax checks and `git diff --check` passed.
- Running preview: Client Settings, Client Notifications and Admin Notifications each returned HTTP 200 with their title/content present after the Metro cache restart.

Frontend verification uses automated rendering/interactions and real HTTP checks, not claimed manual browser clicks. The running Expo preview was restarted with a clean Metro cache after finding a stale missing-language-catalog resolution error.

All new implementation/report/test files are within the existing frontend/backend. No new dashboard, Chore CRUD, navigation system or unrelated interface redesign was made. No feature files were deleted by this change. The workspace's many prior uncommitted changes were retained. Nothing was pushed.
