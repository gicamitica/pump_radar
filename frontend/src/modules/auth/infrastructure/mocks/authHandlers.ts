import { http, delay } from 'msw';
import { ok, fail } from '../../../../mocks/utils/apiResponse';
import { api } from '../../../../mocks/utils/apiPath';

// Types for mock auth
interface MockUser {
  id: string;
  email: string;
  password: string;
  name: string;
  roles: string[];
}

interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  roles: string[];
}

// Request body types
interface LoginRequest { email: string; password: string; }
interface RegisterRequest { email: string; password: string; name?: string; }
interface ForgotPasswordRequest { email: string; }
interface ResetPasswordRequest { token: string; password: string; }
interface VerifyEmailRequest { token: string; }
interface MfaVerifyRequest { code: string; }
interface RefreshTokenRequest { refreshToken: string; }

// In-memory session store
let currentUser: AuthenticatedUser | null = null;
let refreshToken: string | null = null;

const mockUsers: MockUser[] = [
  { id: '1', email: 'admin@example.com', password: 'password', name: 'Admin User', roles: ['admin'] },
  { id: '2', email: 'user@example.com', password: 'password', name: 'Regular User', roles: ['viewer'] },
];

export const authHandlers = [
  // Login
  http.post(api('/auth/login'), async ({ request }) => {
    await delay(800);
    const body = await request.json() as LoginRequest;
    const user = mockUsers.find(u => u.email === body.email && u.password === body.password);
    
    if (!user) {
      return fail('AUTH_INVALID_CREDENTIALS', 'Email or password is incorrect', 401);
    }

    currentUser = { id: user.id, email: user.email, name: user.name, roles: user.roles };
    refreshToken = `refresh_${Date.now()}`;

    return ok({
      user: currentUser,
      accessToken: `access_${Date.now()}`,
      refreshToken,
    });
  }),

  // Register
  http.post(api('/auth/register'), async ({ request }) => {
    await delay(1000);
    const body = await request.json() as RegisterRequest;
    
    if (mockUsers.find(u => u.email === body.email)) {
      return fail('USER_CONFLICT_EMAIL', 'This email is already registered', 409);
    }

    const newUser = {
      id: String(mockUsers.length + 1),
      email: body.email,
      password: body.password,
      name: body.name || 'New User',
      roles: ['viewer'],
    };
    mockUsers.push(newUser);
    currentUser = { id: newUser.id, email: newUser.email, name: newUser.name, roles: newUser.roles };
    refreshToken = `refresh_${Date.now()}`;

    return ok({
      user: currentUser,
      accessToken: `access_${Date.now()}`,
      refreshToken,
    });
  }),

  // Forgot Password
  http.post(api('/auth/forgot-password'), async ({ request }) => {
    await delay(600);
    const body = await request.json() as ForgotPasswordRequest;
    const user = mockUsers.find(u => u.email === body.email);
    
    if (!user) {
      return fail('USER_NOT_FOUND', 'No account found with this email', 404);
    }

    return ok({
      message: 'Password reset email sent',
      resetToken: `reset_${Date.now()}`,
    });
  }),

  // Reset Password
  http.post(api('/auth/reset-password'), async ({ request }) => {
    await delay(700);
    const body = await request.json() as ResetPasswordRequest;
    
    if (!body.token || !body.password) {
      return fail('VALIDATION_ERROR', 'Token and password are required', 400);
    }

    return ok({
      message: 'Password reset successful',
    });
  }),

  // Verify Email
  http.post(api('/auth/verify-email'), async ({ request }) => {
    await delay(500);
    const body = await request.json() as VerifyEmailRequest;
    
    if (!body.token) {
      return fail('VALIDATION_ERROR', 'Verification token is required', 400);
    }

    return ok({
      message: 'Email verified successfully',
    });
  }),

  // MFA Setup
  http.post(api('/auth/mfa/setup'), async () => {
    await delay(600);
    return ok({
      secret: 'JBSWY3DPEHPK3PXP',
      qrCode: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    });
  }),

  // MFA Verify
  http.post(api('/auth/mfa/verify'), async ({ request }) => {
    await delay(500);
    const body = await request.json() as MfaVerifyRequest;
    
    if (body.code !== '123456') {
      return fail('AUTH_INVALID_MFA_CODE', 'The verification code is incorrect', 401);
    }

    return ok({
      message: 'MFA verified successfully',
      accessToken: `access_mfa_${Date.now()}`,
    });
  }),

  // Refresh Token
  http.post(api('/auth/refresh'), async ({ request }) => {
    await delay(300);
    const body = await request.json() as RefreshTokenRequest;
    
    if (body.refreshToken !== refreshToken) {
      return fail('AUTH_INVALID_TOKEN', 'Token is expired or invalid', 401);
    }

    return ok({
      accessToken: `access_${Date.now()}`,
      refreshToken: `refresh_${Date.now()}`,
    });
  }),

  // Logout
  http.post(api('/auth/logout'), async () => {
    await delay(300);
    currentUser = null;
    refreshToken = null;
    return ok({ message: 'Logged out successfully' });
  }),

  // Get Current User
  http.get(api('/auth/me'), async () => {
    await delay(200);
    
    if (!currentUser) {
      return fail('AUTH_UNAUTHORIZED', 'Please log in', 401);
    }

    return ok({ user: currentUser });
  }),
];
