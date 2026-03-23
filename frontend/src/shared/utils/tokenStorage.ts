const parseStoredString = (raw: string | null): string | null => {
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw);
    return typeof parsed === 'string' ? parsed : raw;
  } catch {
    return raw;
  }
};

const AUTH_TOKEN_KEY = 'pumpradar_auth_token';
const SUPER_ADMIN_TOKEN_KEY = 'pumpradar_super_admin_token';

const readTokenForKey = (key: string): string | null => {
  return parseStoredString(
    localStorage.getItem(key) || sessionStorage.getItem(key)
  );
};

export const readStoredToken = (): string | null => {
  return readTokenForKey(AUTH_TOKEN_KEY);
};

export const readStoredSuperAdminToken = (): string | null => {
  return readTokenForKey(SUPER_ADMIN_TOKEN_KEY);
};

export const writeStoredSuperAdminToken = (token: string): void => {
  localStorage.setItem(SUPER_ADMIN_TOKEN_KEY, JSON.stringify(token));
  sessionStorage.removeItem(SUPER_ADMIN_TOKEN_KEY);
};

export const clearStoredSuperAdminToken = (): void => {
  localStorage.removeItem(SUPER_ADMIN_TOKEN_KEY);
  sessionStorage.removeItem(SUPER_ADMIN_TOKEN_KEY);
};
