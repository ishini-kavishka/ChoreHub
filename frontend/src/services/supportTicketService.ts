import { Platform } from 'react-native';

export interface SupportTicket {
  id: string;
  ticketNumber: string;
  userId?: string;
  userName: string;
  userEmail: string;
  category: 'Chore Issue' | 'Technical Bug' | 'Account & Login' | 'General Inquiry';
  subject: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved';
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
  updatedAt: string;
  adminNotes?: string;
}

const INITIAL_TICKETS: SupportTicket[] = [
  {
    id: 't-101',
    ticketNumber: 'TICK-1042',
    userName: 'Kavi Fernando',
    userEmail: 'kavi@example.com',
    category: 'Chore Issue',
    subject: 'Cannot mark "Clean Kitchen" as complete',
    description: 'When tapping the complete checkbox, the app loads for a second and then stays in pending state.',
    status: 'open',
    priority: 'high',
    createdAt: '2026-09-30T10:15:00.000Z',
    updatedAt: '2026-09-30T10:15:00.000Z',
  },
  {
    id: 't-102',
    ticketNumber: 'TICK-1039',
    userName: 'Sarah Jenkins',
    userEmail: 'sarah.j@example.com',
    category: 'Technical Bug',
    subject: 'Notifications not sounding on Android 14',
    description: 'Push notifications appear silently in tray without alert tone despite all permissions enabled.',
    status: 'in_progress',
    priority: 'medium',
    createdAt: '2026-09-29T14:30:00.000Z',
    updatedAt: '2026-09-30T09:00:00.000Z',
    adminNotes: 'Investigating FCM channel configuration.',
  },
  {
    id: 't-103',
    ticketNumber: 'TICK-1031',
    userName: 'David Miller',
    userEmail: 'david.m@example.com',
    category: 'Account & Login',
    subject: 'Family invite link expired',
    description: 'Sent invite code to my daughter yesterday but when she entered it, it said code was invalid.',
    status: 'resolved',
    priority: 'low',
    createdAt: '2026-09-28T08:20:00.000Z',
    updatedAt: '2026-09-28T16:45:00.000Z',
    adminNotes: 'Generated and sent a fresh household invite code.',
  },
];

let inMemoryTickets: SupportTicket[] = [...INITIAL_TICKETS];

export const supportTicketService = {
  async getTickets(): Promise<SupportTicket[]> {
    return inMemoryTickets;
  },

  async getUserTickets(userEmail?: string): Promise<SupportTicket[]> {
    const all = await this.getTickets();
    if (!userEmail) return all;
    return all.filter(
      (t) =>
        t.userEmail.toLowerCase() === userEmail.toLowerCase() ||
        t.userEmail === 'kavi@example.com'
    );
  },

  async createTicket(
    ticketData: Omit<SupportTicket, 'id' | 'ticketNumber' | 'status' | 'createdAt' | 'updatedAt'>
  ): Promise<SupportTicket> {
    const all = await this.getTickets();
    const newNumber = `TICK-${1043 + all.length}`;
    const newTicket: SupportTicket = {
      ...ticketData,
      id: `t-${Date.now()}`,
      ticketNumber: newNumber,
      status: 'open',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    inMemoryTickets = [newTicket, ...inMemoryTickets];
    return newTicket;
  },

  async updateTicketStatus(
    id: string,
    status: SupportTicket['status'],
    adminNotes?: string
  ): Promise<SupportTicket | null> {
    const target = inMemoryTickets.find((t) => t.id === id);
    if (!target) return null;

    target.status = status;
    target.updatedAt = new Date().toISOString();
    if (adminNotes !== undefined) target.adminNotes = adminNotes;

    return target;
  },
};
