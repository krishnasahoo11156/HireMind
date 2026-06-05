export interface DecodedUser {
  // Firebase ID tokens use `sub` for uid, but also have `uid` field directly
  sub: string;
  uid?: string;
  role: 'candidate' | 'recruiter';
  email?: string;
  name?: string;
}

/**
 * Decode a Firebase ID token (JWT) without verification.
 * Extracts uid (from `sub`) and role (from custom claims).
 */
export function getDecodedToken(): DecodedUser | null {
  const token = localStorage.getItem('hiremind_token');
  if (!token) return null;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    const jsonPayload = decodeURIComponent(
      window.atob(padded)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const decoded = JSON.parse(jsonPayload);
    return {
      sub: decoded.sub ?? decoded.uid ?? '',
      uid: decoded.uid ?? decoded.sub ?? '',
      role: decoded.role ?? 'recruiter',
      email: decoded.email,
      name: decoded.name
    } as DecodedUser;
  } catch {
    return null;
  }
}

/**
 * Get the Firebase user ID from the stored token.
 */
export function getCurrentUserId(): string | null {
  const decoded = getDecodedToken();
  return decoded?.sub ?? null;
}

/**
 * Check if the stored token has expired.
 */
export function isTokenExpired(): boolean {
  const token = localStorage.getItem('hiremind_token');
  if (!token) return true;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return true;
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    const payload = JSON.parse(window.atob(padded));
    const exp = payload.exp as number;
    return Date.now() / 1000 > exp;
  } catch {
    return true;
  }
}
