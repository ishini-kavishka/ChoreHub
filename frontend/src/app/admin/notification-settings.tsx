import { Component04Screen } from '@/screens/home/Component04Screens';
import { AdminSettingsGate } from '@/screens/admin/AdminComponent04Shared';

export default function AdminNotificationSettingsRoute() {
  return <AdminSettingsGate>{household => <Component04Screen kind="notificationSettings" adminFamily={household} />}</AdminSettingsGate>;
}
