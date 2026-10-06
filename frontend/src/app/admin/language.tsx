import React from 'react';
import LanguageScreen from '@/screens/home/LanguageScreen';
import { AdminSettingsGate } from '@/screens/admin/AdminComponent04Shared';

export default function AdminLanguageRoute() {
  return <AdminSettingsGate>{household => <LanguageScreen settingsPath="/admin/settings" familyId={household.id} />}</AdminSettingsGate>;
}
