import { AdminSettingsGate } from '@/screens/admin/AdminComponent04Shared';
import { Component04Screen } from '@/screens/home/Component04Screens';
export default function AdminAbout() {
  return <AdminSettingsGate>{household => <Component04Screen kind="about" adminFamily={household} />}</AdminSettingsGate>;
}
