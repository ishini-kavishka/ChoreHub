import { Component04Screen } from '@/screens/home/Component04Screens';
import { AdminSettingsGate } from '@/screens/admin/AdminComponent04Shared';

export default function AdminPreferencesRoute() {
  return <AdminSettingsGate>{household => <Component04Screen kind="preferences" adminFamily={household} />}</AdminSettingsGate>;
}
