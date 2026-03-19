import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Loader2 } from 'lucide-react';

/**
 * AuthCallback - Handles Emergent Google OAuth callback
 * This component processes the session_id from URL fragment and exchanges it for a user session
 * 
 * REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
 */
export default function AuthCallback() {
  const navigate = useNavigate();
  const hasProcessed = useRef(false);

  useEffect(() => {
    // Prevent double processing in StrictMode
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const processAuth = async () => {
      // Extract session_id from URL fragment
      const hash = window.location.hash;
      const sessionIdMatch = hash.match(/session_id=([^&]+)/);
      
      if (!sessionIdMatch) {
        console.error('No session_id found in URL');
        navigate('/auth/login', { replace: true });
        return;
      }

      const sessionId = sessionIdMatch[1];

      try {
        // Exchange session_id with backend
        const response = await axios.post('/api/auth/google/session', {
          session_id: sessionId,
        });

        if (response.data.success) {
          const { user, accessToken, refreshToken } = response.data.data;
          
          // Store tokens
          localStorage.setItem('pumpradar_auth_token', JSON.stringify(accessToken));
          localStorage.setItem('pumpradar_refresh_token', JSON.stringify(refreshToken));
          localStorage.setItem('pumpradar_user', JSON.stringify(user));
          
          // Clear the hash from URL and navigate to dashboard
          window.history.replaceState(null, '', window.location.pathname);
          navigate('/dashboard', { replace: true, state: { user } });
        } else {
          console.error('Auth failed:', response.data);
          navigate('/auth/login', { replace: true });
        }
      } catch (error: any) {
        console.error('Auth error:', error.response?.data || error.message);
        navigate('/auth/login', { replace: true });
      }
    };

    processAuth();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
        <div>
          <h2 className="text-xl font-semibold">Signing you in...</h2>
          <p className="text-muted-foreground text-sm">Please wait while we complete authentication</p>
        </div>
      </div>
    </div>
  );
}
