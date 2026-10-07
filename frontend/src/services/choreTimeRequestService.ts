import { apiRequest } from './api';
import { authService } from './authService';

export interface ChoreTimeRequest {
  id: string; chore_id: string; requester_id: string; recipient_id: string;
  chore_title: string; requester_name: string; recipient_name: string;
  original_due_date: string; requested_due_date: string; current_due_date: string | null;
  message: string; status: 'PENDING'|'APPROVED'|'REJECTED'|'CANCELLED';
  can_review?: boolean; admin_response?: string; created_at: string; updated_at: string; reviewed_at?: string;
}
export interface RequestChore { id: string; title: string; due_date: string }
export type RequestTarget = { choreId: string } | { requestId: string };
async function call<T>(path: string, method = 'GET', body?: object): Promise<T> {
  const token = await authService.getAuthToken();
  if (!token) throw new Error('Authentication is required.');
  return apiRequest<T>('/api/chore-time-requests'+path, { method, ...(body ? { body:JSON.stringify(body) } : {}) }, token);
}
export const choreTimeRequestService = {
  list: (admin = false) => call<{requests:ChoreTimeRequest[]}>(admin?'?inbox=admin':''),
  get: (id:string) => call<{request:ChoreTimeRequest}>('/'+id),
  context: (id:string) => call<{chore:RequestChore;request:ChoreTimeRequest|null}>('/context/'+id),
  create: (chore_id:string, requested_due_date:string, message:string) => call<{request:ChoreTimeRequest}>('', 'POST', {chore_id,requested_due_date,message}),
  edit: (id:string, requested_due_date:string, message:string) => call<{request:ChoreTimeRequest}>('/'+id, 'PATCH', {requested_due_date,message}),
  cancel: (id:string) => call<{request:ChoreTimeRequest}>('/'+id+'/cancel','POST'),
  review: (id:string,status:'APPROVED'|'REJECTED',admin_response:string) => call<{request:ChoreTimeRequest}>('/'+id+'/review','POST',{status,admin_response}),
  dismiss: (id:string) => call<{id:string}>('/'+id+'/dismiss','POST'),
};
