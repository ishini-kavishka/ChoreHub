# Personal reminder device notifications

The existing My Reminders / Add Reminder / Edit Reminder implementation is extended; no new screen, notification inbox, authentication system or Chore CRUD was created.

## Files

Existing files modified in this change:

- `backend/sql/member4_reminders_announcements.sql`
- `backend/src/config/db.js`
- `backend/src/routes/reminderRoutes.js`
- `backend/test/clientReminders.postgres.test.js`
- `frontend/app.json`
- `frontend/package.json`
- `frontend/package-lock.json`
- `frontend/scripts/test-client-reminders.cjs`
- `frontend/src/app/_layout.tsx`
- `frontend/src/i18n/crudTranslations.ts`
- `frontend/src/screens/home/Component04CrudScreen.tsx`
- `frontend/src/services/component04CrudService.ts`
- `frontend/src/services/settingsService.ts`

New files:

- `frontend/src/services/reminderDeviceService.ts`: native notification scheduling, reconciliation and serialized edit/delete cancellation.
- `frontend/scripts/test-reminder-device.cjs`: notification scheduling/cancellation/permission tests with a simulated Expo native bridge.
- `frontend/LOCAL_REMINDER_NOTIFICATIONS.md`: this report.

Packages installed through Expo's SDK 57 compatibility resolver: `expo-notifications ~57.0.21` and `@react-native-community/datetimepicker 9.1.0`. Their config plugins are enabled. Android package ID is `com.chorehub.chorehub`; exact-alarm and vibration permissions are configured. Native manifest introspection passed. This is configuration, not a claim that an Android APK was built here.

## API and database

The existing authenticated `/api/reminders` GET/POST, `/api/reminders/:id` GET/PATCH/DELETE and `/api/reminders/chores` GET routes are reused. Eligible chores include their actual `due_date`; saved reminder reads include `chore_due_date`. The only schema addition is `personal_reminders.vibrate BOOLEAN NOT NULL DEFAULT TRUE`, applied idempotently by the existing backend startup schema workflow and included in the existing SQL setup file. No new table or endpoint is required.

The backend rejects a non-boolean vibration value, invalid/past schedules, foreign assignments and foreign reminder owners. JWT authentication determines the owner; supplied user IDs do not override it. All reminder changes leave the Admin's Chore untouched.

## Save, scheduling and cancellation

The original title, optional note, assigned Chore, date, time, Save and Cancel controls remain. Native Android/iOS date/time fields open the SDK-compatible picker; web retains validated date/time inputs. Quick options subtract 5/10/15/30/60 minutes from the selected Chore's real due date, using the device timezone. Custom time remains available; calculated past times fail Save validation. English/Sinhala/Tamil labels and existing global theme are preserved.

After backend Save succeeds, the device scheduler reads the persisted reminders and current `chore_reminders` preference, checks permission, and uses Expo's one-off DATE trigger. The notification title is the user's reminder title. Its body includes the real Chore name, due date/time and optional note. It is an OS schedule, not a JavaScript timer, so leaving the screen does not cancel it.

Identifiers are deterministic per account/reminder and persist in Expo's OS scheduling store. The backend reminder ID is included in notification metadata. Different phones need different OS schedules, so an OS-specific identifier is not written to the shared database.

Editing or deleting cancels the previous device schedule before the backend mutation. A failed backend mutation restores the previously saved schedule when the server is reachable. A successful edit schedules the updated record; successful deletion removes it. A serialized queue prevents concurrent reconciliation from restoring an old schedule during mutation. A backend save followed by a scheduling failure still counts as saved and displays a distinct warning, avoiding duplicate backend reminders on retry.

App startup, session changes, foreground entry, My Reminders refresh and foreground reconciliation every 30 seconds update native schedules. This interval only checks persisted records; it never delivers a notification through a JS countdown. Switching accounts/signing out clears only this feature's pending schedules. Completed/deleted/reassigned Chores cancel their schedules at reconciliation. Saving Chore Reminders OFF cancels device schedules immediately; changing the preference also requests reconciliation. Other notification features' OS schedules are preserved.

Android uses separate stable channels for vibration ON and OFF. ON requests `[0,300,200,300]`; OFF uses a channel with vibration disabled and adds no content vibration pattern. Foreground alerts are enabled through the Expo notification handler. iOS and OS-level sound/haptic, focus, battery and channel settings ultimately control physical behavior; the switch cannot override those settings.

Permission is requested only for an undetermined, requestable authorization when saving. Denied permission is not repeatedly prompted; the reminder is saved and the user is directed to phone settings. Unsupported web also saves with an explicit warning. Scheduling/permission failures never pretend a device schedule succeeded. Reopening My Reminders retries reconciliation after permissions are corrected.

## Android test commands

Use the existing backend configuration. Run this in one terminal:

```powershell
cd ChoreHub/backend
npm.cmd run dev
```

In `frontend/.env`, set the existing `EXPO_PUBLIC_API_URL` to your computer's reachable LAN address, for example `http://<your-computer-LAN-IP>:5000`, not the phone's localhost. Use the same Wi-Fi network; allow the backend through your local firewall. Do not change account roles or assignments to manufacture an Admin/Chore.

For a native debug build with this app's notification channels/permissions, connect an Android phone by USB, enable USB debugging, and have Android Studio/SDK configured:

```powershell
cd ChoreHub/frontend
npx.cmd expo run:android --device
```

After the initial build, start Metro as needed with `npx.cmd expo start`. Native plugin/package changes require rebuilding the installed app. No push token, Firebase credentials or Expo Push Service is needed for these local reminders.

Expo SDK 57 documentation says local notifications remain available in Expo Go; a development build is required for remote push, which this feature does not use. A native build is recommended to verify this project's exact-alarm permission and custom channels reliably. Web cannot prove Android background notifications or vibration. Documentation: https://docs.expo.dev/versions/v57.0.0/sdk/notifications/

Allow notification permission. On Android versions that require special access, enable this app under Settings > Special app access > Alarms & reminders. Verify the vibration channel in the app's Android notification settings; user overrides may persist across app updates.

Device acceptance test:

1. Assign a normal member a pending Chore due at 8 PM on a future date.
2. Sign in as that member, open My Reminders and Add Reminder, select that Chore, enter “Get ready to clean the room” and note “Take cleaning supplies”.
3. Select 10 minutes before; verify 7:50 PM and unchanged Chore due time. Enable vibration and Save.
4. For a fast physical test, use Custom time 1–2 minutes in the future. Test separately in foreground, after leaving this screen, and while backgrounded.
5. Edit before it fires; ensure the old alarm does not fire and the new one does. Delete a future reminder; ensure it never fires.
6. Deny permission, Save, and confirm the saved-but-not-scheduled warning. Re-enable permission in Android settings and reopen My Reminders.
7. Test a past time, foreign Chore/owner requests, vibration OFF, logout and re-login.

## Checks actually run and remaining limits

- 91 frontend tests passed, including actual form interactions, timezone/quick-offset calculation, reminder CRUD, global themes/languages and simulated native scheduling/cancellation/permission behavior.
- Real HTTP/JWT/PostgreSQL reminder test passed, including frontend create/edit/delete through the real API, 8 PM due / 7:50 PM persisted schedule, vibration persistence, ownership rejection, fresh-login persistence and a full unchanged-Chore snapshot.
- TypeScript passed; Expo web export passed for all 59 routes; Android Hermes bundle export and Android config/manifest introspection passed. The running My Reminders and Notifications routes returned HTTP 200 after restarting Expo with a clean cache.
- `npm.cmd run lint` was attempted but the existing repository is missing its `eslint` dependency. The command fails before linting code; unrelated lint dependencies were not installed.
- Initial package installation hit sandbox network `EACCES`; approved installation succeeded. npm reported existing dependency audit findings. No forced dependency upgrades were performed.
- The old running Metro cache initially could not resolve `expo-constants` after package installation; restarting with `--clear` fixed it. Android export initially hit sandbox execution restrictions on the installed Hermes compiler and passed with approved access.

No physical Android device was available to this tool session. Actual foreground/background notification presentation and vibration are **not yet device-verified**. The scheduling bridge is tested with a simulated native API; that is not proof of hardware vibration.

An offline/backgrounded phone cannot learn about deletion, reassignment or preference changes made on another device until it reconnects and reconciles. The OS may delay/suppress alarms due to denied exact-alarm access, force-stop, battery restrictions, focus or user channel settings. iOS also limits pending notifications. These platform limits cannot be bypassed with JavaScript timers. The existing backend in-app reminder delivery remains separate from OS presentation and is preserved.

No changes were pushed.
