import React, { useEffect, useRef } from 'react';
import axios from 'axios';
import { useService } from '@/app/providers/useDI';
import { AUTH_SYMBOLS } from '@/modules/auth/di/symbols';
import type { IAuthService } from '@/modules/auth/application/ports/IAuthService';

const GOOGLE_CLIENT_ID = '850266140912-h0d5kig0s8jmue3ioa66t83e5lkn9537.apps.googleusercontent.com';

declare global {
  interface Window {
    google?: any;
  }
}

interface Props {
  onError?: (msg: string) => void;
}

const GoogleSignInButton: React.FC<Props> = ({ onError }) => {
  const auth = useService<IAuthService>(AUTH_SYMBOLS.IAuthService);
  const divRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let tries = 0;
    const init = () => {
      if (!window.google?.accounts?.id) {
        tries += 1;
        if (tries > 40) return;
        window.setTimeout(init, 100);
        return;
      }
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: async (resp: { credential?: string }) => {
          try {
            if (!resp.credential) throw new Error('No credential from Google');
            const r = await axios.post('/api/auth/google', { credential: resp.credential });
            if (r.data?.success) {
              const { user, accessToken, refreshToken } = r.data.data;
              await auth.completeLogin(user, { accessToken, refreshToken }, true);
              const target = user.subscription === 'free' ? '/subscription' : '/dashboard';
              window.location.assign(target);
            } else {
              throw new Error(r.data?.error?.message || 'Google authentication failed');
            }
          } catch (err: any) {
            const msg =
              err.response?.data?.detail?.error?.message ||
              err.message ||
              'Google authentication failed';
            if (onError) onError(msg);
          }
        },
      });
      if (divRef.current) {
        window.google.accounts.id.renderButton(divRef.current, {
          theme: 'outline',
          size: 'large',
          width: 320,
          text: 'continue_with',
        });
      }
    };
    init();
  }, [auth, onError]);

  return <div ref={divRef} style={{ display: 'flex', justifyContent: 'center' }} />;
};

export default GoogleSignInButton;
