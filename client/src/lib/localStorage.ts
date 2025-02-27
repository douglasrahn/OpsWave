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
export async function getClientByUID(uid: string): Promise<{ client: Client; user: ClientUser } | null> {
  try {
    const response = await fetch(`/api/clients/user/${uid}`);
    if (!response.ok) {
      console.error('Failed to fetch client data');
      return null;
    }

    const client = await response.json();
    const user = client.users.find(u => u.uid === uid);

    if (user) {
      return { client, user };
    }
  } catch (error) {
    console.error('Error fetching client data:', error);
  }
  return null;
}

/**
 * Save session information after successful authentication
 */
export async function saveSessionInfo(uid: string): Promise<boolean> {
  const clientInfo = await getClientByUID(uid);
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