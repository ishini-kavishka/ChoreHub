import Component04CrudScreen from '@/screens/home/Component04CrudScreen';
import { AdminGate } from '@/screens/admin/AdminComponent04Shared';
export default function Announcements() { return <AdminGate>{h => <Component04CrudScreen kind="announcements" familyId={h.id} admin />}</AdminGate>; }
