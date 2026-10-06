import { privateMessageTranslations } from './privateMessageTranslations';
import { timeRequestTranslations } from './timeRequestTranslations';
/**
 * i18n translations dictionary.
 * Supports: English (en), Sinhala (si), Tamil (ta).
 * Complete translations across all client and admin screens.
 */

import { adminTranslations } from './adminTranslations';
import { clientTranslations } from './clientTranslations';
import { crudTranslations } from './crudTranslations';
import { additionalTranslations } from './additionalTranslations';

export type Language = keyof typeof translations;

export const translations = {
  ...additionalTranslations,
  en: {
    ...timeRequestTranslations.en,
    ...privateMessageTranslations.en,
    ...adminTranslations.en,
    ...crudTranslations.en,
    ...clientTranslations.en,

    // Bottom Tab Bar
    tab_home: 'Home',
    tab_chores: 'Chores',
    tab_calendar: 'Calendar',
    tab_family: 'Family',
    tab_notifications: 'Notifications',
    tab_profile: 'Profile',
    home: 'Home',
    chores: 'Chores',
    calendar: 'Calendar',
    family: 'Family',
    notifications: 'Notifications',
    profile: 'Profile',

    // Greetings
    greeting_prefix: 'Hi,',
    greeting_suffix: '👋',
    greeting_subtitle: 'Great job keeping the home tidy!',
    greeting_morning: 'Good morning!',
    greeting_afternoon: 'Good afternoon!',
    greeting_evening: 'Good evening!',
    make_today_productive: "Let's make today productive together.",
    small_steps_big_change: 'Small Steps\nBig Change!',

    // Common UI actions & words
    view: 'View',
    view_all: 'View All',
    cancel: 'Cancel',
    save: 'Save',
    edit: 'Edit',
    delete: 'Delete',
    done: 'Done',
    retry: 'Retry',
    go_back: 'Go Back',
    back: 'Back',
    close: 'Close',
    search: 'Search',
    loading: 'Loading…',
    saving: 'Saving…',
    all: 'All',
    error: 'Error',
    success: 'Success',
    not_set: 'Not set',

    // Priorities & Statuses
    priority_high: 'High',
    priority_medium: 'Medium',
    priority_low: 'Low',
    status_pending: 'Pending',
    status_completed: 'Completed',
    status_overdue: 'Overdue',
    priority_label: 'Priority',
    due_date_label: 'Due Date',
    repeat_label: 'Repeat',
    assigned_by_label: 'Assigned by',
    description_label: 'Description',

    // Recurrence
    repeat_daily: 'Daily',
    repeat_weekly: 'Weekly',
    repeat_monthly: 'Monthly',
    repeat_none: 'No repeat',

    // Home Screen
    my_progress: 'My Progress',
    chores_completed_week: 'chores completed this week',
    chores_completed_this_week: 'chores completed this week!',
    todays_chores: "Today's Chores",
    all_caught_up: 'All caught up!',
    no_pending_chores_today: 'No pending chores scheduled for today.',
    quick_actions: 'Quick Actions',
    quick_view_chores: 'View All\nChores',
    quick_view_calendar: 'View\nCalendar',
    quick_family_members: 'Family\nMembers',
    quick_my_progress: 'My\nProgress',
    recent_notifications: 'Recent Notifications',
    chore_due_today: 'Chore Due Today',
    due_today_at: 'is due today at',

    // My Chores Screen
    my_chores_title: 'My Chores',
    my_chores_sub: 'View and manage chores assigned specifically to you',
    search_my_chores: 'Search my chores…',
    no_chores_found: 'No chores found',
    no_chores_assigned: 'No chores are currently assigned to you.',
    try_changing_filter: 'Try changing your search or filter settings.',
    filter_all: 'All',
    filter_pending: 'Pending',
    filter_completed: 'Completed',

    // Chore Details Screen
    chore_details_title: 'Chore Details',
    chore_not_found: 'Chore not found.',
    no_description_provided: 'No additional description provided for this chore.',
    mark_as_completed: 'Mark as Completed',
    mark_as_pending: 'Mark as Pending',
    status_updated: 'Status updated successfully.',

    // Chore Completed Celebration Screen
    chore_completed_title: 'Chore Completed!',
    great_job_completed: 'Great job! You have completed',
    completed_on: 'Completed on',
    btn_done: 'Done',
    btn_view_my_chores: 'View My Chores',

    // Progress Dashboard Screen
    progress_title: 'Progress',
    heres_your_progress: "Here's your progress",
    overall_completion: 'Overall Completion',
    completed_chores: 'Completed Chores',
    pending_chores: 'Pending Chores',
    overdue_chores: 'Overdue Chores',
    progress_by_member: 'Progress by Family Member',
    all_history: 'All History',
    this_week: 'This Week',
    this_month: 'This Month',
    all_time: 'All Time',
    streak: 'Streak',
    days: 'Days',
    keep_going: 'Keep going! 🎉',
    total_chores_count: 'Total',

    // Completed Chores Screen
    completed_chores_title: 'Completed Chores',
    completed_chores_subtitle: 'Your completed chores history',
    search_placeholder: 'Search chores…',
    filter_today: 'Today',
    filter_week: 'This Week',
    filter_month: 'This Month',
    by: 'By',

    // Calendar Screen
    calendar_title: 'Calendar',
    calendar_subtitle: 'Scheduled chores and upcoming dates',
    no_chores_on_date: 'No chores scheduled for this date.',
    sun: 'Sun', mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu', fri: 'Fri', sat: 'Sat',

    // Household / Family Screen
    household_family: 'Household Family',
    members_in_household: 'members in your household',
    my_household: 'My Household',
    role_admin: 'Admin',
    role_member: 'Member',
    relationship_other: 'Other',

    // Notifications Screen
    notifications_title: 'Notifications',
    notifications_subtitle: 'Reminders and household updates',
    mark_all_read: 'Mark all as read',
    filter_unread: 'Unread',
    filter_read: 'Read',
    today: 'Today',
    yesterday: 'Yesterday',
    no_notifications: 'No notifications yet',

    // Settings Screen
    settings_title: 'Settings',
    notification_settings: 'Notification Settings',
    notification_settings_sub: 'Manage your alert preferences',
    reminder_time: 'Reminder Time',
    reminder_time_sub: 'When to remind you before a chore',
    theme: 'Theme',
    theme_sub: 'Personalise your app appearance',
    language: 'Language',
    language_sub: 'Choose your preferred language',
    about_app: 'About App',
    about_app_sub: 'Version, privacy policy & terms',

    // Notification Preferences
    chore_reminders: 'Chore Reminders',
    chore_completions: 'Chore Completions',
    family_updates_label: 'Family Updates',
    announcements: 'Announcements',
    save_settings: 'Save notification settings',
    settings_saved: 'Settings saved successfully',
    '10_min': '10 minutes before',
    '30_min': '30 minutes before',
    '1_hour': '1 hour before',
    '1_day': '1 day before',

    // App Preferences Screen
    preferences_title: 'Preferences',
    light_theme: 'Light',
    dark_theme: 'Dark',
    system_theme: 'System',
    brightness: 'Brightness',
    auto_brightness: 'Auto Brightness',
    auto_brightness_sub: 'Adjust brightness based on your device settings',
    theme_pref_note: 'Choose your preferred theme and adjust the brightness to make the app comfortable for you.',
    english: 'English',
    sinhala: 'සිංහල',
    tamil: 'தமிழ்',

    // Language Screen
    language_screen_title: 'Language',
    search_languages: 'Search languages…',
    no_languages_found: 'No languages found',
    disabled_by_admin: 'This language has been disabled by the household administrator.',

    // About Screen
    about_title: 'About App',
    tagline: 'A happier home together',
    version: 'Version',
    build: 'Build',
    privacy_policy: 'Privacy Policy',
    terms_of_service: 'Terms of Service',

    // Profile Screen
    profile_title: 'Profile',
    menu_personal_info: 'Personal Information',
    menu_household_settings: 'Household Settings',
    menu_app_settings: 'App Settings',
    menu_change_password: 'Change Password',
    menu_app_preferences: 'App Preferences',
    menu_support_help: 'Support & Help',
    btn_logout: 'Logout',
    logout_confirm_title: 'Log Out?',
    logout_confirm_message: 'Are you sure you want to log out from your ChoreHub account?',
    back_to_welcome: 'Back to Welcome',
    session_ended: 'Your session has ended.',

    // Edit Profile Screen
    edit_profile_title: 'Edit Profile',
    full_name: 'Full Name',
    phone_number: 'Phone Number',
    save_changes: 'Save Changes',
    delete_account: 'Delete Account',
    delete_account_confirm: 'This action permanently removes your account and cannot be undone. Continue?',

    // Change Password Screen
    change_password_title: 'Change Password',
    current_password: 'Current Password',
    new_password: 'New Password',
    confirm_new_password: 'Confirm New Password',
    update_password: 'Update Password',
    password_updated_success: 'Your password has been changed successfully.',

    // Auth Screens
    login: 'Login',
    sign_up: 'Sign Up',
    create_account: 'Create Account',
    email: 'Email',
    password: 'Password',
    remember_me: 'Remember me',
    or: 'OR',
    continue_google: 'Continue with Google',
    dont_have_account: "Don't have an account?",
    already_have_account: 'Already have an account?',
    forgot_password: 'Forgot Password?',
    tagline_hero: 'Organize Chores, Build Happier Homes',
    enter_email_password: 'Please enter both email and password.',
    valid_email: 'Please enter a valid email address.',

    // Admin Language Management
    admin_language_admin_select: 'Admin Interface Language',
    admin_client_languages: 'Client Available Languages',
    admin_lang_enabled: 'Available to clients',
    admin_lang_disabled: 'Hidden from clients',
    admin_lang_default_desc: 'Default language · Always available',
    admin_lang_toggle_note: 'Manage which languages family members and clients can select.',
  },

  si: {
    ...timeRequestTranslations.si,
    ...privateMessageTranslations.si,
    ...adminTranslations.si,
    ...crudTranslations.si,
    ...clientTranslations.si,

    // Bottom Tab Bar
    tab_home: 'මුල් පිටුව',
    tab_chores: 'කාර්යයන්',
    tab_calendar: 'දින දර්ශනය',
    tab_family: 'පවුල',
    tab_notifications: 'දැනුම්දීම්',
    tab_profile: 'පැතිකඩ',
    home: 'මුල් පිටුව',
    chores: 'කාර්යයන්',
    calendar: 'දින දර්ශනය',
    family: 'පවුල',
    notifications: 'දැනුම්දීම්',
    profile: 'පැතිකඩ',

    // Greetings
    greeting_prefix: 'හෙලෝ,',
    greeting_suffix: '👋',
    greeting_subtitle: 'නිවස පිළිවෙලට තබා ගැනීම ගැන ස්තූතියි!',
    greeting_morning: 'සුබ උදෑසනක්!',
    greeting_afternoon: 'සුබ දහවලක්!',
    greeting_evening: 'සුබ සන්ධ්‍යාවක්!',
    make_today_productive: 'අද දවස ඵලදායී කර ගනිමු.',
    small_steps_big_change: 'කුඩා පියවර\nවිශාල වෙනසක්!',

    // Common UI actions & words
    view: 'බලන්න',
    view_all: 'සියල්ල බලන්න',
    cancel: 'අවලංගු කරන්න',
    save: 'සුරකින්න',
    edit: 'සංස්කරණය',
    delete: 'මකන්න',
    done: 'අවසන්',
    retry: 'නැවත උත්සාහ කරන්න',
    go_back: 'ආපසු යන්න',
    back: 'ආපසු',
    close: 'වසන්න',
    search: 'සොයන්න',
    loading: 'පූරණය වෙමින්…',
    saving: 'සුරකිමින්…',
    all: 'සියල්ල',
    error: 'දෝෂයකි',
    success: 'සාර්ථකයි',
    not_set: 'සකසා නැත',

    // Priorities & Statuses
    priority_high: 'ඉහළ',
    priority_medium: 'මධ්‍යම',
    priority_low: 'අඩු',
    status_pending: 'ඉතිරි',
    status_completed: 'සම්පූර්ණයි',
    status_overdue: 'කල් ඉකුත්',
    priority_label: 'ප්‍රමුඛතාව',
    due_date_label: 'නියමිත දිනය',
    repeat_label: 'නැවත සිදුවීම',
    assigned_by_label: 'පවරන ලද්දේ',
    description_label: 'විස්තරය',

    // Recurrence
    repeat_daily: 'දිනපතා',
    repeat_weekly: 'සතිපතා',
    repeat_monthly: 'මාසිකව',
    repeat_none: 'නැවත නොවේ',

    // Home Screen
    my_progress: 'මගේ ප්‍රගතිය',
    chores_completed_week: 'මේ සතියේ සම්පූර්ණ කළ කාර්යයන්',
    chores_completed_this_week: 'මේ සතියේ සම්පූර්ණ කළ කාර්යයන්!',
    todays_chores: 'අද දින කාර්යයන්',
    all_caught_up: 'සියල්ල අවසන්!',
    no_pending_chores_today: 'අදට නියමිත කාර්යයන් නොමැත.',
    quick_actions: 'ක්ෂණික ක්‍රියා',
    quick_view_chores: 'සියලු කාර්යයන්\nබලන්න',
    quick_view_calendar: 'දින දර්ශනය\nබලන්න',
    quick_family_members: 'පවුලේ\nසාමාජිකයන්',
    quick_my_progress: 'මගේ\nප්‍රගතිය',
    recent_notifications: 'මෑත දැනුම්දීම්',
    chore_due_today: 'අදට නියමිත කාර්යය',
    due_today_at: 'අද නියමිත වේලාව:',

    // My Chores Screen
    my_chores_title: 'මගේ කාර්යයන්',
    my_chores_sub: 'ඔබට පවරා ඇති කාර්යයන් කළමනාකරණය කරන්න',
    search_my_chores: 'මගේ කාර්යයන් සොයන්න…',
    no_chores_found: 'කාර්යයන් හමු නොවීය',
    no_chores_assigned: 'දැනට ඔබට පැවරූ කාර්යයන් නොමැත.',
    try_changing_filter: 'සෙවීම හෝ පෙරහන වෙනස් කර බලන්න.',
    filter_all: 'සියල්ල',
    filter_pending: 'ඉතිරි',
    filter_completed: 'සම්පූර්ණයි',

    // Chore Details Screen
    chore_details_title: 'කාර්යයේ විස්තර',
    chore_not_found: 'කාර්යය හමු නොවීය.',
    no_description_provided: 'මෙම කාර්යය සඳහා අමතර විස්තරයක් සපයා නැත.',
    mark_as_completed: 'සම්පූර්ණ කළ ලෙස සලකන්න',
    mark_as_pending: 'ඉතිරි ලෙස සලකන්න',
    status_updated: 'තත්ත්වය සාර්ථකව යාවත්කාලීන කරන ලදී.',

    // Chore Completed Celebration Screen
    chore_completed_title: 'කාර්යය සම්පූර්ණයි!',
    great_job_completed: 'විශිෂ්ටයි! ඔබ සාර්ථකව අවසන් කළා',
    completed_on: 'සම්පූර්ණ කළ දිනය',
    btn_done: 'අවසන්',
    btn_view_my_chores: 'මගේ කාර්යයන් බලන්න',

    // Progress Dashboard Screen
    progress_title: 'ප්‍රගතිය',
    heres_your_progress: 'මෙන්න ඔබේ ප්‍රගතිය',
    overall_completion: 'සමස්ත සම්පූර්ණ කිරීම',
    completed_chores: 'සම්පූර්ණ කළ කාර්යයන්',
    pending_chores: 'ඉතිරි කාර්යයන්',
    overdue_chores: 'කල් ඉකුත් වූ කාර්යයන්',
    progress_by_member: 'පවුලේ සාමාජිකයන් අනුව ප්‍රගතිය',
    all_history: 'සියලු ඉතිහාසය',
    this_week: 'මේ සතිය',
    this_month: 'මේ මාසය',
    all_time: 'සෑම කාලයකම',
    streak: 'දින අඛණ්ඩතාව',
    days: 'දින',
    keep_going: 'දිගටම කරගෙන යන්න! 🎉',
    total_chores_count: 'මුළු',

    // Completed Chores Screen
    completed_chores_title: 'සම්පූර්ණ කළ කාර්යයන්',
    completed_chores_subtitle: 'ඔබේ සම්පූර්ණ කළ කාර්ය ඉතිහාසය',
    search_placeholder: 'කාර්ය සොයන්න…',
    filter_today: 'අද',
    filter_week: 'මේ සතිය',
    filter_month: 'මේ මාසය',
    by: 'විසින්',

    // Calendar Screen
    calendar_title: 'දින දර්ශනය',
    calendar_subtitle: 'නියමිත කාර්යයන් සහ ඉදිරි දින',
    no_chores_on_date: 'මෙම දිනයට නියමිත කාර්යයන් නොමැත.',
    sun: 'ඉරිදා', mon: 'සඳුදා', tue: 'අඟහ', wed: 'බදාදා', thu: 'බ්‍රහස්', fri: 'සිකු', sat: 'සෙන',

    // Household / Family Screen
    household_family: 'ගෘහස්ථ පවුල',
    members_in_household: 'ඔබේ නිවසේ සාමාජිකයන්',
    my_household: 'මගේ නිවස',
    role_admin: 'පරිපාලක',
    role_member: 'සාමාජික',
    relationship_other: 'වෙනත්',

    // Notifications Screen
    notifications_title: 'දැනුම්දීම්',
    notifications_subtitle: 'මතක් කිරීම් සහ නිවෙස් යාවත්කාලීන',
    mark_all_read: 'සියල්ල කියවූ ලෙස සලකන්න',
    filter_unread: 'නොකියවූ',
    filter_read: 'කියවූ',
    today: 'අද',
    yesterday: 'ඊයේ',
    no_notifications: 'දැනුම්දීම් නොමැත',

    // Settings Screen
    settings_title: 'සැකසුම්',
    notification_settings: 'දැනුම්දීම් සැකසුම්',
    notification_settings_sub: 'ඔබේ ඇඟවීම් මනාප කළමනාකරණය කරන්න',
    reminder_time: 'මතක් කිරීමේ වේලාව',
    reminder_time_sub: 'කාර්යයකට පෙර කවදා මතක් කළ යුතුද',
    theme: 'තේමාව',
    theme_sub: 'ඔබේ යෙදුම් පෙනුම පුද්ගලාරෝපිත කරන්න',
    language: 'භාෂාව',
    language_sub: 'ඔබේ කැමති භාෂාව තෝරන්න',
    about_app: 'යෙදුම ගැන',
    about_app_sub: 'අනුවාදය, රහස්‍යතා ප්‍රතිපත්තිය සහ නියම',

    // Notification Preferences
    chore_reminders: 'කාර්ය මතක් කිරීම්',
    chore_completions: 'කාර්ය සම්පූර්ණ කිරීම්',
    family_updates_label: 'පවුල් යාවත්කාලීන',
    announcements: 'නිවේදන',
    save_settings: 'දැනුම්දීම් සැකසුම් සුරකින්න',
    settings_saved: 'සැකසුම් සාර්ථකව සුරකින ලදී',
    '10_min': 'විනාඩි 10 කට පෙර',
    '30_min': 'විනාඩි 30 කට පෙර',
    '1_hour': 'පැයකට පෙර',
    '1_day': 'දිනකට පෙර',

    // App Preferences Screen
    preferences_title: 'මනාප',
    light_theme: 'ආලෝකය',
    dark_theme: 'අඳුර',
    system_theme: 'පද්ධතිය',
    brightness: 'දීප්තිය',
    auto_brightness: 'ස්වයංක්‍රීය දීප්තිය',
    auto_brightness_sub: 'ඔබගේ උපාංග සැකසුම් මත පදනම්ව දීප්තිය සීරුමාරු කරන්න',
    theme_pref_note: 'ඔබේ කැමති තේමාව තෝරා යෙදුම පහසුවෙන් භාවිතා කිරීමට දීප්තිය සකසන්න.',
    english: 'English',
    sinhala: 'සිංහල',
    tamil: 'தமிழ்',

    // Language Screen
    language_screen_title: 'භාෂාව',
    search_languages: 'භාෂා සොයන්න…',
    no_languages_found: 'භාෂා හමු නොවීය',
    disabled_by_admin: 'මෙම භාෂාව පරිපාලක විසින් අක්‍රිය කර ඇත.',

    // About Screen
    about_title: 'යෙදුම ගැන',
    tagline: 'සතුටින් පිරි නිවසක් එකට',
    version: 'අනුවාදය',
    build: 'ගොඩනැගිල්ල',
    privacy_policy: 'රහස්‍යතා ප්‍රතිපත්තිය',
    terms_of_service: 'සේවා නියම',

    // Profile Screen
    profile_title: 'පැතිකඩ',
    menu_personal_info: 'පුද්ගලික තොරතුරු',
    menu_household_settings: 'ගෘහස්ථ සැකසුම්',
    menu_app_settings: 'යෙදුම් සැකසුම්',
    menu_change_password: 'මුරපදය වෙනස් කරන්න',
    menu_app_preferences: 'යෙදුම් මනාප',
    menu_support_help: 'සහාය සහ උපකාර',
    btn_logout: 'පිටවීම',
    logout_confirm_title: 'පිටවෙන්නද?',
    logout_confirm_message: 'ඔබට ChoreHub ගිණුමෙන් පිටවීමට අවශ්‍ය බව සහතිකද?',
    back_to_welcome: 'ආපසු සාදරයෙන් පිළිගනිමු පිටුවට',
    session_ended: 'ඔබගේ සැසිය අවසන් වී ඇත.',

    // Edit Profile Screen
    edit_profile_title: 'පැතිකඩ සංස්කරණය',
    full_name: 'සම්පූර්ණ නම',
    phone_number: 'දුරකථන අංකය',
    save_changes: 'වෙනස්කම් සුරකින්න',
    delete_account: 'ගිණුම මකන්න',
    delete_account_confirm: 'මෙමඟින් ඔබගේ ගිණුම ස්ථිරවම මකා දැමෙන අතර එය නැවත ලබාගත නොහැක. ඉදිරියට යන්නද?',

    // Change Password Screen
    change_password_title: 'මුරපදය වෙනස් කරන්න',
    current_password: 'වත්මන් මුරපදය',
    new_password: 'නව මුරපදය',
    confirm_new_password: 'නව මුරපදය තහවුරු කරන්න',
    update_password: 'මුරපදය යාවත්කාලීන කරන්න',
    password_updated_success: 'ඔබේ මුරපදය සාර්ථකව වෙනස් කරන ලදී.',

    // Auth Screens
    login: 'ඇතුල් වන්න',
    sign_up: 'ලියාපදිංචි වන්න',
    create_account: 'ගිණුමක් සාදන්න',
    email: 'විද්‍යුත් තැපෑල',
    password: 'මුරපදය',
    remember_me: 'මාව මතක තබා ගන්න',
    or: 'හෝ',
    continue_google: 'Google සමඟ ඉදිරියට යන්න',
    dont_have_account: 'ගිණුමක් නැද්ද?',
    already_have_account: 'දැනටමත් ගිණුමක් තිබේද?',
    forgot_password: 'මුරපදය අමතකද?',
    tagline_hero: 'කාර්යයන් පිළිවෙලට, සතුටින් පිරි නිවසක්',
    enter_email_password: 'කරුණාකර විද්‍යුත් තැපෑල සහ මුරපදය ඇතුළත් කරන්න.',
    valid_email: 'කරුණාකර වලංගු විද්‍යුත් තැපැල් ලිපිනයක් ඇතුළත් කරන්න.',

    // Admin Language Management
    admin_language_admin_select: 'පරිපාලක අතුරුමුහුණත් භාෂාව',
    admin_client_languages: 'සාමාජිකයන්ට තෝරාගත හැකි භාෂා',
    admin_lang_enabled: 'සාමාජිකයන්ට ලබා ගත හැක',
    admin_lang_disabled: 'සාමාජිකයන්ට සඟවා ඇත',
    admin_lang_default_desc: 'පෙරනිමි භාෂාව · සැමවිටම සක්‍රියයි',
    admin_lang_toggle_note: 'පවුලේ සාමාජිකයන්ට තෝරාගත හැකි භාෂා කළමනාකරණය කරන්න.',
  },

  ta: {
    ...timeRequestTranslations.ta,
    ...privateMessageTranslations.ta,
    ...adminTranslations.ta,
    ...crudTranslations.ta,
    ...clientTranslations.ta,

    // Bottom Tab Bar
    tab_home: 'முகப்பு',
    tab_chores: 'வேலைகள்',
    tab_calendar: 'நாட்காட்டி',
    tab_family: 'குடும்பம்',
    tab_notifications: 'அறிவிப்புகள்',
    tab_profile: 'சுயவிவரம்',
    home: 'முகப்பு',
    chores: 'வேலைகள்',
    calendar: 'நாட்காட்டி',
    family: 'குடும்பம்',
    notifications: 'அறிவிப்புகள்',
    profile: 'சுயவிவரம்',

    // Greetings
    greeting_prefix: 'வணக்கம்,',
    greeting_suffix: '👋',
    greeting_subtitle: 'வீட்டை சுத்தமாக வைத்திருப்பதற்கு நன்றி!',
    greeting_morning: 'காலை வணக்கம்!',
    greeting_afternoon: 'மதிய வணக்கம்!',
    greeting_evening: 'மாலை வணக்கம்!',
    make_today_productive: 'இன்றைய நாளை பயனுள்ளதாக்குவோம்.',
    small_steps_big_change: 'சிறு படிகள்\nபெரிய மாற்றம்!',

    // Common UI actions & words
    view: 'பார்',
    view_all: 'அனைத்தும் பார்',
    cancel: 'ரத்து',
    save: 'சேமி',
    edit: 'திருத்து',
    delete: 'நீக்கு',
    done: 'முடிந்தது',
    retry: 'மீண்டும் முயல்க',
    go_back: 'பின்செல்',
    back: 'பின்செல்',
    close: 'மூடு',
    search: 'தேடு',
    loading: 'ஏற்றுகிறது…',
    saving: 'சேமிக்கிறது…',
    all: 'அனைத்தும்',
    error: 'பிழை',
    success: 'வெற்றி',
    not_set: 'அமைக்கப்படவில்லை',

    // Priorities & Statuses
    priority_high: 'அதிகம்',
    priority_medium: 'நடுத்தரம்',
    priority_low: 'குறைவு',
    status_pending: 'நிலுவை',
    status_completed: 'முடிந்தது',
    status_overdue: 'தாமதம்',
    priority_label: 'முன்னுரிமை',
    due_date_label: 'கெடு தேதி',
    repeat_label: 'மீண்டும்',
    assigned_by_label: 'ஒதுக்கியவர்',
    description_label: 'விவரம்',

    // Recurrence
    repeat_daily: 'தினசரி',
    repeat_weekly: 'வாராந்திர',
    repeat_monthly: 'மாதாந்திர',
    repeat_none: 'மீண்டும் இல்லை',

    // Home Screen
    my_progress: 'எனது முன்னேற்றம்',
    chores_completed_week: 'இந்த வாரம் முடிந்த வேலைகள்',
    chores_completed_this_week: 'இந்த வாரம் முடிந்த வேலைகள்!',
    todays_chores: 'இன்றைய வேலைகள்',
    all_caught_up: 'அனைத்தும் முடிந்தது!',
    no_pending_chores_today: 'இன்று நிலுவையில் வேலைகள் இல்லை.',
    quick_actions: 'விரைவு செயல்கள்',
    quick_view_chores: 'அனைத்து வேலைகள்\nபார்',
    quick_view_calendar: 'நாட்காட்டி\nபார்',
    quick_family_members: 'குடும்ப\nஉறுப்பினர்கள்',
    quick_my_progress: 'எனது\nமுன்னேற்றம்',
    recent_notifications: 'சமீபத்திய அறிவிப்புகள்',
    chore_due_today: 'இன்று கெடு தேதி உள்ள வேலை',
    due_today_at: 'இன்று கெடு நேரம்:',

    // My Chores Screen
    my_chores_title: 'எனது வேலைகள்',
    my_chores_sub: 'உங்களுக்கு ஒதுக்கப்பட்ட வேலைகளை நிர்வகிக்கவும்',
    search_my_chores: 'எனது வேலைகளைத் தேடுங்கள்…',
    no_chores_found: 'வேலைகள் எதுவும் கிடைக்கவில்லை',
    no_chores_assigned: 'தற்போது உங்களுக்கு வேலைகள் எதுவும் ஒதுக்கப்படவில்லை.',
    try_changing_filter: 'தேடல் அல்லது வடிகட்டி அமைப்புகளை மாற்றிப் பார்க்கவும்.',
    filter_all: 'அனைத்தும்',
    filter_pending: 'நிலுவை',
    filter_completed: 'முடிந்தது',

    // Chore Details Screen
    chore_details_title: 'வேலை விவரங்கள்',
    chore_not_found: 'வேலை கிடைக்கவில்லை.',
    no_description_provided: 'இந்த வேலைக்கு கூடுதல் விவரங்கள் எதுவும் வழங்கப்படவில்லை.',
    mark_as_completed: 'முடிந்ததாகக் குறிக்கவும்',
    mark_as_pending: 'நிலுவையாகக் குறிக்கவும்',
    status_updated: 'நிலை வெற்றிகரமாக புதுப்பிக்கப்பட்டது.',

    // Chore Completed Celebration Screen
    chore_completed_title: 'வேலை முடிந்தது!',
    great_job_completed: 'சிறப்பான வேலை! நீங்கள் முடித்துவிட்டீர்கள்',
    completed_on: 'முடித்த தேதி',
    btn_done: 'முடிந்தது',
    btn_view_my_chores: 'எனது வேலைகளைப் பார்',

    // Progress Dashboard Screen
    progress_title: 'முன்னேற்றம்',
    heres_your_progress: 'இதோ உங்கள் முன்னேற்றம்',
    overall_completion: 'ஒட்டுமொத்த முடிவு',
    completed_chores: 'முடிந்த வேலைகள்',
    pending_chores: 'நிலுவையில் உள்ள வேலைகள்',
    overdue_chores: 'தாமதமான வேலைகள்',
    progress_by_member: 'குடும்ப உறுப்பினர்களின் முன்னேற்றம்',
    all_history: 'அனைத்து வரலாறு',
    this_week: 'இந்த வாரம்',
    this_month: 'இந்த மாதம்',
    all_time: 'எல்லா நேரமும்',
    streak: 'தொடர்ச்சி',
    days: 'நாட்கள்',
    keep_going: 'தொடருங்கள்! 🎉',
    total_chores_count: 'மொத்தம்',

    // Completed Chores Screen
    completed_chores_title: 'முடிந்த வேலைகள்',
    completed_chores_subtitle: 'உங்கள் முடிந்த வேலைகளின் வரலாறு',
    search_placeholder: 'வேலைகளை தேடுங்கள்…',
    filter_today: 'இன்று',
    filter_week: 'இந்த வாரம்',
    filter_month: 'இந்த மாதம்',
    by: 'மூலம்',

    // Calendar Screen
    calendar_title: 'நாட்காட்டி',
    calendar_subtitle: 'திட்டமிடப்பட்ட வேலைகள் மற்றும் வரவிருக்கும் தேதிகள்',
    no_chores_on_date: 'இந்த தேதியில் வேலைகள் எதுவும் திட்டமிடப்படவில்லை.',
    sun: 'ஞாயிறு', mon: 'திங்கள்', tue: 'செவ்வாய்', wed: 'புதன்', thu: 'வியாழன்', fri: 'வெள்ளி', sat: 'சனி',

    // Household / Family Screen
    household_family: 'குடும்பம்',
    members_in_household: 'குடும்ப உறுப்பினர்கள்',
    my_household: 'எனது குடும்பம்',
    role_admin: 'நிர்வாகி',
    role_member: 'உறுப்பினர்',
    relationship_other: 'மற்றவை',

    // Notifications Screen
    notifications_title: 'அறிவிப்புகள்',
    notifications_subtitle: 'நினைவூட்டல்கள் மற்றும் வீட்டு புதுப்பிப்புகள்',
    mark_all_read: 'அனைத்தையும் படித்தது என குறி',
    filter_unread: 'படிக்காதது',
    filter_read: 'படித்தது',
    today: 'இன்று',
    yesterday: 'நேற்று',
    no_notifications: 'அறிவிப்புகள் இல்லை',

    // Settings Screen
    settings_title: 'அமைப்புகள்',
    notification_settings: 'அறிவிப்பு அமைப்புகள்',
    notification_settings_sub: 'உங்கள் எச்சரிக்கை விருப்பங்களை நிர்வகிக்கவும்',
    reminder_time: 'நினைவூட்டல் நேரம்',
    reminder_time_sub: 'வேலைக்கு முன் எப்போது நினைவூட்ட வேண்டும்',
    theme: 'தீம்',
    theme_sub: 'உங்கள் பயன்பாட்டு தோற்றத்தை தனிப்பயனாக்கவும்',
    language: 'மொழி',
    language_sub: 'உங்கள் விருப்பமான மொழியை தேர்வு செய்யவும்',
    about_app: 'பயன்பாட்டு பற்றி',
    about_app_sub: 'பதிப்பு, தனியுரிமைக் கொள்கை மற்றும் விதிமுறைகள்',

    // Notification Preferences
    chore_reminders: 'வேலை நினைவூட்டல்கள்',
    chore_completions: 'வேலை நிறைவுகள்',
    family_updates_label: 'குடும்ப புதுப்பிப்புகள்',
    announcements: 'அறிவிப்புகள்',
    save_settings: 'அறிவிப்பு அமைப்புகளை சேமி',
    settings_saved: 'அமைப்புகள் வெற்றிகரமாக சேமிக்கப்பட்டன',
    '10_min': '10 நிமிடங்களுக்கு முன்',
    '30_min': '30 நிமிடங்களுக்கு முன்',
    '1_hour': '1 மணி நேரத்திற்கு முன்',
    '1_day': '1 நாளுக்கு முன்',

    // App Preferences Screen
    preferences_title: 'விருப்பங்கள்',
    light_theme: 'வெளிர்',
    dark_theme: 'இருண்ட',
    system_theme: 'கணினி',
    brightness: 'பிரகாசம்',
    auto_brightness: 'தானியங்கி பிரகாசம்',
    auto_brightness_sub: 'உங்கள் சாதன அமைப்புகளின்படி பிரகாசத்தை சரிசெய்யவும்',
    theme_pref_note: 'உங்கள் விருப்பமான தீமைத் தேர்ந்தெடுத்து பிரகாசத்தை வசதியாக மாற்றவும்.',
    english: 'English',
    sinhala: 'සිංහල',
    tamil: 'தமிழ்',

    // Language Screen
    language_screen_title: 'மொழி',
    search_languages: 'மொழிகளை தேடுங்கள்…',
    no_languages_found: 'மொழிகள் எதுவும் கிடைக்கவில்லை',
    disabled_by_admin: 'இந்த மொழி நிர்வாகியால் முடக்கப்பட்டுள்ளது.',

    // About Screen
    about_title: 'பயன்பாட்டு பற்றி',
    tagline: 'ஒன்றாக மகிழ்ச்சியான வீடு',
    version: 'பதிப்பு',
    build: 'கட்டமைப்பு',
    privacy_policy: 'தனியுரிமைக் கொள்கை',
    terms_of_service: 'சேவை விதிமுறைகள்',

    // Profile Screen
    profile_title: 'சுயவிவரம்',
    menu_personal_info: 'தனிப்பட்ட தகவல்',
    menu_household_settings: 'குடும்ப அமைப்புகள்',
    menu_app_settings: 'செயலி அமைப்புகள்',
    menu_change_password: 'கடவுச்சொல் மாற்று',
    menu_app_preferences: 'செயலி விருப்பங்கள்',
    menu_support_help: 'ஆதரவு மற்றும் உதவி',
    btn_logout: 'வெளியேறு',
    logout_confirm_title: 'வெளியேறவா?',
    logout_confirm_message: 'உங்கள் ChoreHub கணக்கிலிருந்து வெளியேற விரும்புகிறீர்களா?',
    back_to_welcome: 'வரவேற்புப் பக்கத்திற்குத் திரும்பு',
    session_ended: 'உங்கள் அமர்வு முடிந்துவிட்டது.',

    // Edit Profile Screen
    edit_profile_title: 'சுயவிவரத்தை திருத்து',
    full_name: 'முழு பெயர்',
    phone_number: 'தொலைபேசி எண்',
    save_changes: 'மாற்றங்களை சேமி',
    delete_account: 'கணக்கை நீக்கு',
    delete_account_confirm: 'இந்த செயல் உங்கள் கணக்கை நிரந்தரமாக நீக்கும் மற்றும் மாற்ற முடியாது. தொடரவா?',

    // Change Password Screen
    change_password_title: 'கடவுச்சொல்லை மாற்று',
    current_password: 'தற்போதைய கடவுச்சொல்',
    new_password: 'புதிய கடவுச்சொல்',
    confirm_new_password: 'புதிய கடவுச்சொல்லை உறுதிசெய்',
    update_password: 'கடவுச்சொல்லை புதுப்பி',
    password_updated_success: 'உங்கள் கடவுச்சொல் வெற்றிகரமாக மாற்றப்பட்டது.',

    // Auth Screens
    login: 'உள்நுழைக',
    sign_up: 'பதிவு செய்க',
    create_account: 'கணக்கை உருவாக்கவும்',
    email: 'மின்னஞ்சல்',
    password: 'கடவுச்சொல்',
    remember_me: 'என்னை நினைவில் கொள்க',
    or: 'அல்லது',
    continue_google: 'Google மூலம் தொடரவும்',
    dont_have_account: 'கணக்கு இல்லையா?',
    already_have_account: 'ஏற்கனவே கணக்கு உள்ளதா?',
    forgot_password: 'கடவுச்சொல் மறந்துவிட்டதா?',
    tagline_hero: 'வேலைகளை ஒழுங்கமைத்து மகிழ்ச்சியான வீட்டை உருவாக்குங்கள்',
    enter_email_password: 'மின்னஞ்சல் மற்றும் கடவுச்சொல்லை உள்ளிடவும்.',
    valid_email: 'செல்லுபடியாகும் மின்னஞ்சல் முகவரியை உள்ளிடவும்.',

    // Admin Language Management
    admin_language_admin_select: 'நிர்வாக இடைமுக மொழி',
    admin_client_languages: 'உறுப்பினர்களுக்குக் கிடைக்கும் மொழிகள்',
    admin_lang_enabled: 'உறுப்பினர்களுக்கு கிடைக்கிறது',
    admin_lang_disabled: 'உறுப்பினர்களுக்கு மறைக்கப்பட்டுள்ளது',
    admin_lang_default_desc: 'இயல்புநிலை மொழி · எப்போதும் செயலில்',
    admin_lang_toggle_note: 'குடும்ப உறுப்பினர்கள் தேர்ந்தெடுக்கக்கூடிய மொழிகளை நிர்வகிக்கவும்.',
  },
} as const;

export type TranslationKey = keyof typeof translations.en;

// Only for application-owned feedback already produced by this dictionary.
// User names, Chore titles, messages and notes never pass through this helper.
const feedbackKeys = new Map(Object.values(translations).flatMap(dictionary =>
  Object.entries(dictionary).map(([key, value]) => [value, key] as [string, string])));
export function translateFeedback(message: string, t: (key: string) => string, fallbackKey?: string): string {
  const key = feedbackKeys.get(message);
  return key ? t(key) : fallbackKey ? t(fallbackKey) : message;
}
