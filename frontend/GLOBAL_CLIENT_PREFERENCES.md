# Global client theme and language

## Existing architecture and changes

The existing root ThemeProvider and LanguageProvider remain the only preference authorities. ThemeContext already supplied the purple semantic palette, light/dark/system preference, and application visual brightness. LanguageContext already supplied translation dictionaries, account-specific language storage, authenticated preference synchronization, and the supported-language configuration. The legacy use-theme hook now consumes the same global theme rather than independently following the operating system.

Root initialization retains the existing splash and waits for fonts and both saved preferences before mounting navigation. Router background and status bar follow the global theme. Theme-dependent neutral colors in existing client screens/components now consume ThemeColors through useThemedStyles or useAppTheme. Purple branding, layouts, routes, navigation structure, cards and CRUD callbacks are preserved. No Admin screen was changed by this task; shared providers/components can also improve theme consistency wherever reused.

Client confirmations use one AppDialogProvider so their presentation follows the selected app theme instead of the device theme. Existing confirmation labels, callbacks and cancellation/destructive actions are preserved. Application-owned validation/feedback is translated at render time, including messages already visible during a language change.

## Persistence and independence

Theme, brightness and auto-brightness are cached under the authenticated account ID (or guest). Existing settingsService preference endpoints remain in use. Preference writes contain only changed fields; theme writes never include language and language writes never include theme. Offline theme choices remain cached and pending for retry. Serialized writes and restore-generation guards prevent delayed preference responses from overwriting newer selections. Session changes and foreground restoration reload the correct account's preferences.

Language keeps its existing per-account cache, configured availability cache, and strict backend synchronization. Failed authenticated language saves retain the previous confirmed selection and surface the existing save failure. Logout uses guest preferences; another account loads its own preferences. No new preference table, endpoint or device permission was introduced. Brightness remains the existing app visual intensity feature, including auto mode.

## Languages and content

English (en), Sinhala (si), and Tamil (ta) have client translation resources. Selection still respects the Admin-enabled language configuration. Other catalog languages remain visible according to the existing selector/search policy but are not advertised as translated or selectable when translation support is missing. This task does not enable disabled languages in production.

User names, email, household names, chore titles/descriptions, client messages, notes, and stored notification free text remain exactly as supplied. Branding and technical example code are intentionally unchanged. Date formatting continues through existing locale-aware utilities. Application interface labels and known UI feedback use the existing dictionaries; user content is never sent through the feedback translator.

## Client route audit

All 36 client-facing routes below were rendered with their existing components in English/Sinhala/Tamil, each in Light and Dark: 216 route combinations. No accessible route in this audited set remains unconverted. Historical unmounted workflow components are outside the accessible route set and were not rebuilt.

- /home/about
- /home/announcements
- /home/calendar
- /home/chore-completed
- /home/chore-details
- /home/chores
- /home/completed-chores
- /home/family
- /home
- /home/language
- /home/notification-settings
- /home/notifications
- /home/preferences
- /home/profile
- /home/progress
- /home/reminder-time
- /home/reminders
- /home/schedule
- /home/settings
- /profile/change-password
- /profile/edit
- /profile
- /profile/picture
- /support/contact-support
- /support/contact-us
- /support/faqs
- /support/help-center
- /support
- /support/tickets
- /support/topic
- /auth/forgot-password
- /auth/login
- /auth/privacy-policy
- /auth/signup
- /auth/terms
- /auth/welcome

Reusable forms, notifications panel, Message Admin, Add/Edit Chore, auth fields/buttons/banners, avatar, member tabs, support navigation, and client confirmations were also checked. Existing MemberTabBar retains its four routes; no new tabs or navigation were added.

## Modified existing frontend files

This task's files (not the entire pre-existing dirty Git working tree):

- frontend/scripts/test-client-notification-delete.cjs
- frontend/scripts/test-client-reminders.cjs
- frontend/scripts/test-private-chore-messages.cjs
- frontend/src/app/_layout.tsx
- frontend/src/components/app-tabs.tsx
- frontend/src/components/app-tabs.web.tsx
- frontend/src/components/auth/FeedbackBanner.tsx
- frontend/src/components/auth/FormField.tsx
- frontend/src/components/auth/PrimaryButton.tsx
- frontend/src/components/chores/AddChoreModal.tsx
- frontend/src/components/chores/ChoreItemCard.tsx
- frontend/src/components/chores/EditChoreModal.tsx
- frontend/src/components/chores/MemberChoreCard.tsx
- frontend/src/components/navigation/MemberTabBar.tsx
- frontend/src/components/notifications/NotificationPanel.tsx
- frontend/src/components/notifications/PrivateChoreMessageForm.tsx
- frontend/src/components/profile/Avatar.tsx
- frontend/src/components/support/SupportBottomNav.tsx
- frontend/src/components/web-badge.tsx
- frontend/src/context/LanguageContext.tsx
- frontend/src/context/ThemeContext.tsx
- frontend/src/hooks/use-theme.ts
- frontend/src/i18n/translations.ts
- frontend/src/screens/auth/AuthLayout.tsx
- frontend/src/screens/auth/LoginScreen.tsx
- frontend/src/screens/auth/PrivacyPolicyScreen.tsx
- frontend/src/screens/auth/SignUpScreen.tsx
- frontend/src/screens/auth/SplashScreen.tsx
- frontend/src/screens/auth/TermsScreen.tsx
- frontend/src/screens/auth/WelcomeScreen.tsx
- frontend/src/screens/home/ChoreCompletedScreen.tsx
- frontend/src/screens/home/Component04CrudScreen.tsx
- frontend/src/screens/home/Component04Screens.tsx
- frontend/src/screens/home/HomeScreen.tsx
- frontend/src/screens/home/LanguageScreen.tsx
- frontend/src/screens/home/MemberCalendarScreen.tsx
- frontend/src/screens/home/MemberChoreDetailsScreen.tsx
- frontend/src/screens/home/MemberChoresScreen.tsx
- frontend/src/screens/home/MemberFamilyScreen.tsx
- frontend/src/screens/home/MemberHomeScreen.tsx
- frontend/src/screens/home/MemberScheduleScreen.tsx
- frontend/src/screens/home/ProgressDashboardScreen.tsx
- frontend/src/screens/home/ReminderTimeScreen.tsx
- frontend/src/screens/profile/ChangePasswordScreen.tsx
- frontend/src/screens/profile/EditProfileScreen.tsx
- frontend/src/screens/profile/ProfileScreen.tsx
- frontend/src/screens/profile/UpdateProfilePictureScreen.tsx
- frontend/src/screens/support/ContactSupportScreen.tsx
- frontend/src/screens/support/ContactUsScreen.tsx
- frontend/src/screens/support/CustomerTicketsScreen.tsx
- frontend/src/screens/support/FaqScreen.tsx
- frontend/src/screens/support/HelpCenterScreen.tsx
- frontend/src/screens/support/HelpTopicScreen.tsx
- frontend/src/screens/support/SupportDashboardScreen.tsx

## New files in this task

- frontend/src/components/ui/AppDialog.tsx
- frontend/scripts/prepare-client-theme.cjs
- frontend/scripts/test-global-preferences.cjs
- frontend/scripts/test-client-route-appearance.cjs
- frontend/GLOBAL_CLIENT_PREFERENCES.md

Ignored .expo audit, route-results, log and export files are generated verification artifacts. Existing frontend test files that were already untracked before this task are listed as modified above rather than incorrectly attributed as newly created here.

Only backend/test/settingsPersistence.test.js was adjusted in the backend by this task: its transaction explicitly enables en/si/ta for its own preference round-trip fixture and rolls that configuration back. Production controllers, services, APIs and schemas were not changed by this task.

## Checks actually run

- Frontend regression suite: 63 passed, zero failed. Includes 36 routes in six combinations, four modal forms, translated/themed tabs and dialogs, startup readiness, immediate global updates, preference independence, cache/restart, logout/account switching, offline theme retry, and stale-response protection.
- Notifications regressions: All/Today/This Week, unread/read handling, removal and refreshed counts remain covered by existing tests.
- Message Admin regressions: validation, typed-message preservation, failed-input retention, duplicate-send prevention, translations and successful close remain covered.
- TypeScript: npx.cmd tsc --noEmit passed.
- Expo: npx.cmd expo export --platform web --output-dir .expo/global-preferences-check succeeded; 59 routes exported.
- Real PostgreSQL integration tests: settingsPersistence.test.js, languageManagement.test.js and privateChoreMessages.postgres.test.js passed. The latter verifies recipient privacy, delivery/read/delete and an unchanged Chore snapshot using isolated test fixtures.
- git diff --check passed.

Light/Dark and all three translated languages respond globally in the automated checks. Theme and language changes preserve each other. Message Admin and Notifications regression checks pass. Chore CRUD business behavior was not changed; only its client presentation and UI feedback use global preferences. Existing interfaces were not redesigned; confirmation dialogs received the minimal shared themed presentation needed to honor the selected app theme.

## Verification limits

No browser is connected to the UI automation tool, so interactive authenticated click-through, pixel inspection, and physical-device restart testing could not be performed. Route rendering uses actual components with mocked native primitives and API fixtures; persistence tests use actual providers with controlled transport/storage. Successful Expo bundling and route HTTP responses do not by themselves prove every runtime interaction. Real database message checks use isolated users/chores; existing production account relationships were not altered.

No changes were pushed or committed. Pre-existing changes and deletions elsewhere in the working tree were preserved.
