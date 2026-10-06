import { AdminGate } from '@/screens/admin/AdminComponent04Shared';
import { Component04Screen } from '@/screens/home/Component04Screens';
export default function AdminAbout() {
  return <AdminGate>{() => <Component04Screen kind="about" />}</AdminGate>;
}
