import ReminderTimeScreen from '@/screens/home/ReminderTimeScreen';
import { AdminSettingsGate } from '@/screens/admin/AdminComponent04Shared';

export default function AdminReminderTimeRoute() {
  return <AdminSettingsGate>{household => <ReminderTimeScreen settingsPath="/admin/settings" familyId={household.id} />}</AdminSettingsGate>;
}
