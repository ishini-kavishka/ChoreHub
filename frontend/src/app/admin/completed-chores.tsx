import { AdminGate } from '@/screens/admin/AdminComponent04Shared';
import { Component04Screen } from '@/screens/home/Component04Screens';
export default function AdminHistory() {
  return <AdminGate>{household => <Component04Screen kind="completed" adminFamily={household} />}</AdminGate>;
}
