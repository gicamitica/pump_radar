/**
 * AuthCallback - Handles Google OAuth callback from Emergent Auth
 * REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
 */
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Loader2 } from 'lucide-react';
import { useService } from '@/app/providers/useDI';
import { AUTH_SYMBOLS } from '@/modules/auth/di/symbols';
import type { IAuthService } from '@/modules/auth/application/ports/IAuthService';

const extractSessionId = (): string | null => {
  const searchParams = new URLSearchParams(window.location.search);
  const searchSessionId = searchParams.get('session_id');
  if (searchSessionId) {
    return searchSessionId;
  }

  const hash = window.location.hash.startsWith('#') ? window.location.hash.slice(1) : window.location.hash;
  const hashParams = new URLSearchParams(hash);
  return hashParams.get('session_id');
};

const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const authService = useService<IAuthService>(AUTH_SYMBOLS.IAuthService);
  const hasProcessed = useRef(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Prevent double execution in StrictMode
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const processAuth = async () => {
      try {
        const sessionId = extractSessionId();

        if (!sessionId) {
          setError('No session ID found. Please try logging in again.');
          setTimeout(() => navigate('/auth/login'), 3000);
          return;
        }

        // Exchange session_id for user data via backend
        const response = await axios.post('/api/auth/google', {
          session_id: sessionId
        });

        if (response.data.success) {
          const { user, accessToken, refreshToken } = response.data.data;

          await authService.completeLogin(
            user,
            { accessToken, refreshToken },
            true
          );

          window.history.replaceState(null, '', '/dashboard');
          navigate('/dashboard', { replace: true, state: { user } });
        } else {
          throw new Error(response.data.error?.message || 'Authentication failed');
        }
      } catch (err: any) {
        console.error('Auth callback error:', err);
        const message = err.response?.data?.detail?.error?.message || 
                       err.response?.data?.detail ||
                       err.message ||
                       'Authentication failed. Please try again.';
        setError(message);
        setTimeout(() => navigate('/auth/login'), 3000);
      }
    };

    processAuth();
  }, [authService, navigate]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-center max-w-md p-8">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Authentication Failed</h2>
          <p className="text-slate-400 mb-4">{error}</p>
          <p className="text-sm text-slate-500">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900">
      <div className="text-center">
        <Loader2 className="w-12 h-12 animate-spin text-emerald-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Completing sign in...</h2>
        <p className="text-slate-400">Please wait while we set up your account</p>
      </div>
    </div>
  );
};

export default AuthCallback;
