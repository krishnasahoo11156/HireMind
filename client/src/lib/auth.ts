export interface DecodedUser {
  sub: string;
  role: 'candidate' | 'recruiter';
}

export function getDecodedToken(): DecodedUser | null {
  const token = localStorage.getItem('hiremind_token');
  if (!token) return null;
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      window.atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload) as DecodedUser;
  } catch (e) {
    return null;
  }
}
