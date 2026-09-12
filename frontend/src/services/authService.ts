export type Member = { id: string; name: string; email: string; phone?: string; avatarUri?: string };

const delay = () => new Promise((resolve) => setTimeout(resolve, 550));
let currentMember: Member | null = null;

// Replace each method with a call to the backend API. This layer intentionally never talks to Neon directly.
export const authService = {
  async signIn(email: string, _password: string) { await delay(); currentMember = { id: 'member-demo', name: 'ChoreHub Member', email }; return currentMember; },
  async signUp(name: string, email: string, _password: string) { await delay(); currentMember = { id: 'member-demo', name, email }; return currentMember; },
  async requestPasswordReset(email: string) { await delay(); return { email }; },
  async signOut() { await delay(); currentMember = null; },
  async getCurrentMember() { await delay(); return currentMember; },
};
