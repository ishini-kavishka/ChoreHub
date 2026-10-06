import { apiRequest } from './api';
import { authService } from './authService';

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

async function getToken() {
  const token = await authService.getAuthToken();
  if (!token) throw new Error('Your session has ended. Please sign in again.');
  return token;
}

export interface SupportMessagePayload {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export const supportTicketService = {
  async sendSupportMessage(payload: SupportMessagePayload): Promise<{ message: string }> {
    return apiRequest<{ message: string }>('/api/support/tickets/messages', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async getTickets(): Promise<SupportTicket[]> {
    const response = await apiRequest<{ tickets: SupportTicket[] }>(
      '/api/support/tickets',
      {},
      await getToken()
    );
    return response.tickets;
  },

  async getUserTickets(_userEmail?: string): Promise<SupportTicket[]> {
    const response = await apiRequest<{ tickets: SupportTicket[] }>(
      '/api/support/tickets/my',
      {},
      await getToken()
    );
    return response.tickets;
  },

  async createTicket(
    ticketData: Omit<SupportTicket, 'id' | 'ticketNumber' | 'status' | 'createdAt' | 'updatedAt'>
  ): Promise<SupportTicket> {
    const response = await apiRequest<{ ticket: SupportTicket }>(
      '/api/support/tickets',
      {
        method: 'POST',
        body: JSON.stringify({
          category: ticketData.category,
          subject: ticketData.subject,
          description: ticketData.description,
          priority: ticketData.priority,
        }),
      },
      await getToken()
    );
    return response.ticket;
  },

  async updateTicketStatus(
    id: string,
    status: SupportTicket['status'],
    adminNotes?: string
  ): Promise<SupportTicket | null> {
    const response = await apiRequest<{ ticket: SupportTicket }>(
      `/api/support/tickets/${id}/status`,
      {
        method: 'PATCH',
        body: JSON.stringify({ status, ...(adminNotes !== undefined ? { adminNotes } : {}) }),
      },
      await getToken()
    );
    return response.ticket;
  },

  async updateTicket(
    id: string,
    updates: Partial<Pick<SupportTicket, 'category' | 'subject' | 'description' | 'priority' | 'adminNotes'>>
  ): Promise<SupportTicket | null> {
    const response = await apiRequest<{ ticket: SupportTicket }>(
      `/api/support/tickets/${id}`,
      { method: 'PUT', body: JSON.stringify(updates) },
      await getToken()
    );
    return response.ticket;
  },

  async deleteTicket(id: string): Promise<boolean> {
    await apiRequest<{ message: string }>(
      `/api/support/tickets/${id}`,
      { method: 'DELETE' },
      await getToken()
    );
    return true;
  },
};
