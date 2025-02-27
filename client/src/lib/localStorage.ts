import clientsData from '@/data/clients.json';

interface ClientUser {
  email: string;
  role: string;
  uid: string;
}

export interface Client {
  clientId: string;
  companyName: string;
  url: string;
  users: ClientUser[];
}

interface SessionInfo {
  clientId: string;
  uid: string;
}

/**
 * Get client information by Firebase UID
 */
export function getClientByUID(uid: string): { client: Client; user: ClientUser } | null {
  console.log("Searching for UID:", uid);
  console.log("Available clients:", JSON.stringify(clientsData.clients, null, 2));

  for (const client of clientsData.clients) {
    const user = client.users.find(u => {
      console.log("Comparing UIDs:", u.uid, uid);
      return u.uid === uid;
    });
    if (user) {
      console.log("Found matching user:", user);
      return { client, user };
    }
  }
  console.log("No client found for UID:", uid);
  return null;
}

/**
 * Save session information after successful authentication
 */
export function saveSessionInfo(uid: string): boolean {
  const clientInfo = getClientByUID(uid);
  if (!clientInfo) {
    console.error("No client found for UID:", uid);
    return false;
  }

  // Store minimal session data
  sessionStorage.setItem('clientId', clientInfo.client.clientId);
  sessionStorage.setItem('uid', uid);
  return true;
}

/**
 * Get session information
 */
export function getSessionInfo(): SessionInfo | null {
  const clientId = sessionStorage.getItem('clientId');
  const uid = sessionStorage.getItem('uid');

  if (!clientId || !uid) {
    return null;
  }

  return { clientId, uid };
}

/**
 * Clear session data on logout
 */
export function clearSessionData(): void {
  sessionStorage.removeItem('clientId');
  sessionStorage.removeItem('uid');
}