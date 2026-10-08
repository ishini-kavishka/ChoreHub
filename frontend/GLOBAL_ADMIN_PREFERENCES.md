# Global Admin Theme and Language

## Architecture inspected and reused

The root layout already wraps both authenticated Admin and Client routes in one ThemeProvider and one LanguageProvider. ThemeContext owns Light/Dark/System, the purple semantic palette, brightness/auto-brightness, account-specific local cache, serialized backend preference writes and startup readiness. LanguageContext owns English/Sinhala/Tamil dictionaries, account-specific language cache, configured availability and backend synchronization. Both respond to authentication-session and foreground changes. Root navigation already waits for preference restoration before mounting the interface; that initialization was retained.

No AdminThemeContext, AdminLanguageContext, duplicate settings system, navigation system, app, dashboard, preference table or endpoint was created. Neither provider nor the root layout required changes in this task. The existing Admin useAdminColors adapter now maps to shared ThemeColors; Admin screens use the same useAppTheme/useThemedStyles hooks. AdminTabBar keeps its existing six tabs and purple active state; its background, border and inactive text/icon colors follow the selected theme. Tab titles use the existing language provider.

## Integration and persistence

Admin Settings no longer reapplies both global preferences when loading its form. Selecting theme calls the existing global setTheme with only the selected theme. Selecting language calls setLanguage with only the selected language. Displayed selections follow current global state. Supported-language controls keep their existing functionality and refresh availability after configuration changes; personal choices honor enabled/translated languages.

Theme/brightness are cached per authenticated user ID (guest has separate keys), synchronized through existing settingsService preference APIs, and restored after navigation, reload/restart, login/logout/account switching. Offline theme choices remain cached and retry through the existing pending-write mechanism. Language retains the existing per-user cache and confirmed backend save behavior; a failed authenticated save rolls back to the previous confirmed language. Changing either preference does not write or reset the other. Brightness remains application visual intensity, with no new device permission.

## Screens audited

All 19 dedicated Admin-facing routes below were rendered with their actual components in Light/Dark x English/Sinhala/Tamil (114 route combinations):

- /admin/about
- /admin/add-chore
- /admin/add-family-member
- /admin/announcements
- /admin/calendar
- /admin/chore-details
- /admin/chores
- /admin/completed-chores
- /admin/dashboard
- /admin/edit-chore
- /admin/members
- /admin/notifications
- /admin/profile
- /admin/progress
- /admin/reminders
- /admin/schedule
- /admin/settings
- /support/admin-tickets
- /support/admin

The client appearance suite also rechecked 36 shared/client routes (216 combinations), including shared Profile, edit profile, password, picture, settings, theme, language/search, notification preferences/reminder time, about, completed chores, support/help and authentication screens. Admin profile/about/completed/history routes reuse existing shared screens. No accessible route in the audited sets remains unconverted. No absent screen was invented.

## Theme colors and translated interface strings

The source audit converted 342 fixed theme-dependent colors across 16 existing Admin files, followed by targeted fixes for dashboard action tints and shared palette/navigation behavior. Neutral page/card/surface backgrounds, primary/secondary text, borders, placeholders, input fields, modal surfaces, empty/loading/error states and status badge backgrounds now use shared semantic tokens in Dark Mode. Original Light styling, layout dimensions, typography, cards and purple branding were retained wherever applicable. Shared semantic colors also preserve existing visual brightness behavior.

Existing dictionaries were reused for known UI labels. A new Admin dictionary supplies missing dashboard/action subtitles, Chore form labels/pickers, family connection steps, calendar/schedule labels, member-management headings, safe validation/errors, and support/ticket/reply/analytics labels. Enum labels are translated at render time while API values remain original. Calendar weekdays and formatted dates use the selected locale; already-selected dates update when language changes. Dynamic UI messages use translation keys and explicit interpolation.

Existing shared AppDialog now accepts an optional translation-key/values descriptor for Admin confirmations with dynamic values. Open confirmation text re-renders in the selected language while Chore titles, ticket IDs and member names remain original. Existing string-based Client calls still work. Admin native alert call sites now reuse this already-mounted themed dialog provider; callbacks and destructive/cancel behavior remain intact. The existing Admin client-message removal modal keeps its layout and behavior.

## Languages and intentionally original content

English, Sinhala and Tamil have complete matching interface translation resources for this audit; selection still respects configured language availability. Other catalog languages are not advertised as translated when resources are missing. No production language configuration was enabled by this task.

Client/member names, email, household names, Chore titles/descriptions, client messages, ticket subjects/descriptions, notes/replies and arbitrary database free text remain unchanged. Branding, decorative symbols and non-rendered technical/configuration strings remain original. Relationship and priority/recurrence/status identifiers in submissions stay original; translating their labels does not change stored data. Numerical statistics and existing support analytics values were preserved.

## Modified existing frontend files

This list is scoped to this task using a before/after source hash snapshot, not the entire already-dirty Git working tree:

- frontend/src/app/admin/_layout.tsx
- frontend/src/components/chores/AdminChoreCard.tsx
- frontend/src/components/navigation/AdminTabBar.tsx
- frontend/src/components/ui/AppDialog.tsx
- frontend/src/i18n/translations.ts
- frontend/src/screens/admin/AddChoreScreen.tsx
- frontend/src/screens/admin/AddFamilyMemberScreen.tsx
- frontend/src/screens/admin/AdminCalendarScreen.tsx
- frontend/src/screens/admin/AdminChoresScreen.tsx
- frontend/src/screens/admin/AdminComponent04Shared.tsx
- frontend/src/screens/admin/AdminDashboardScreen.tsx
- frontend/src/screens/admin/AdminMembersScreen.tsx
- frontend/src/screens/admin/AdminNotificationsScreen.tsx
- frontend/src/screens/admin/AdminProgressScreen.tsx
- frontend/src/screens/admin/AdminScheduleScreen.tsx
- frontend/src/screens/admin/AdminSettingsScreen.tsx
- frontend/src/screens/admin/ChoreDetailsScreen.tsx
- frontend/src/screens/admin/EditChoreScreen.tsx
- frontend/src/screens/support/AdminSupportDashboardScreen.tsx
- frontend/src/screens/support/AdminTicketsScreen.tsx
- frontend/scripts/test-admin-notifications.cjs (existing regression-test mocks updated for shared theme/feedback imports)

## New files

- frontend/src/i18n/adminGlobalTranslations.ts
- frontend/scripts/prepare-admin-theme.cjs
- frontend/scripts/audit-admin-language.cjs
- frontend/scripts/test-admin-route-appearance.cjs
- frontend/GLOBAL_ADMIN_PREFERENCES.md

Ignored .expo files contain audit/results/log/export artifacts. No existing file was deleted. No backend source, API, authentication, preference model or schema file was modified by this task.

## Checks actually run

- Frontend regression suite: 96 tests passed, zero failures. Admin coverage includes 114 route combinations, all Add/Edit pickers, six-tab navigation, notifications/private-message removal dialogs, support reply modal, existing shared forms, open dialog locale switching, and Settings preference independence. Existing Client/theme/language/notification/reminder/Message Admin regressions all pass.
- Admin Chore component submission checks: create/update/delete retain original Chore titles, category, priority, recurrence and IDs in Sinhala Dark Mode. Add-member submits the original Mother relationship identifier while labels and success feedback translate.
- Actual-provider tests: immediate preference updates, six combinations, restart/cache restoration, account switching/logout isolation, delayed response protection, uncached startup readiness, brightness preservation, and offline theme retry passed.
- TypeScript: npx.cmd tsc --noEmit passed.
- Expo web export: npx.cmd expo export --platform web --output-dir .expo/admin-global-check passed; all 59 app routes exported.
- Running frontend: all 19 dedicated Admin route URLs returned HTTP 200 on localhost:8081.
- Existing real PostgreSQL/HTTP tests: adminNotifications.postgres.test.js and privateChoreMessages.postgres.test.js passed (2/2). Isolated test accounts verify notification synchronization, read state, deletion, recipient/ownership enforcement and private-message delivery; Chore snapshots remain unchanged. Temporary fixtures were cleaned up.
- git diff --check passed.

## Acceptance conclusions and limitations

Automated checks confirm global Light/Dark, English/Sinhala/Tamil updates across every dedicated Admin route and shared screens, persistent/account-specific preferences, and independence in both directions. Admin Notifications/private messages and Chore CRUD retain existing functionality. Client regression tests pass, Client screens were not redesigned, and no unrelated layout/navigation/business feature was changed.

The computer-use surface inventory returned no connected apps or browsers. Therefore interactive Admin login/click-through, pixel-based visual inspection and physical-device restart acceptance tests were not performed. Route appearance tests render real components with controlled API fixtures/native primitives; provider tests exercise real state logic with controlled transport/storage. HTTP 200 and a successful export do not alone prove interactive runtime behavior. Backend integration checks use isolated test users, not modified production relationships.

No changes were committed or pushed. Pre-existing changes/deletions elsewhere in the working tree were preserved. Repository guidance required consulting the versioned Expo reference before editing: https://docs.expo.dev/versions/v57.0.0/.
