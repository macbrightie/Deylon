/**
 * Encodes onboarding session data into a URL-safe token for session transfer
 * between the landing page and auth pages.
 */
export function encodeSessionData(data: Record<string, unknown>): string {
  return Buffer.from(JSON.stringify(data)).toString('base64url');
}

export function decodeSessionData<T = Record<string, unknown>>(
  token: string
): T | null {
  try {
    return JSON.parse(Buffer.from(token, 'base64url').toString('utf-8')) as T;
  } catch {
    return null;
  }
}

/**
 * Stores onboarding conversation ID in sessionStorage so it survives
 * the magic link auth redirect flow.
 */
export const SESSION_KEY = 'daylon_conversation_id';

export function storeConversationId(conversationId: string): void {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem(SESSION_KEY, conversationId);
  }
}

export function retrieveConversationId(): string | null {
  if (typeof window !== 'undefined') {
    return sessionStorage.getItem(SESSION_KEY);
  }
  return null;
}

export function clearConversationId(): void {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem(SESSION_KEY);
  }
}
