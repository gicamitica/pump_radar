import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { Loader2, CheckCircle, XCircle, Mail } from 'lucide-react';
import { Button } from '@/shared/ui/shadcn/components/ui/button';
import { Card, CardContent } from '@/shared/ui/shadcn/components/ui/card';
import { useService } from '@/app/providers/useDI';
import { AUTH_SYMBOLS } from '@/modules/auth/di/symbols';
import type { IAuthService } from '@/modules/auth/application/ports/IAuthService';

const USER_STORAGE_KEY = 'pumpradar_auth_current_user';

type VerifyStatus = 'loading' | 'success' | 'error' | 'no-token';

export default function VerifyEmailPage() {
  const navigate = useNavigate();
  const authService = useService<IAuthService>(AUTH_SYMBOLS.IAuthService);
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<VerifyStatus>('loading');
  const [message, setMessage] = useState('');
  const [resendMessage, setResendMessage] = useState('');
  const [isResending, setIsResending] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  
  const token = searchParams.get('token');
  const email = searchParams.get('email') || '';

  useEffect(() => {
    if (!token) {
      setStatus('no-token');
      setMessage('No verification token provided.');
      return;
    }

    const verifyEmail = async () => {
      try {
        const response = await axios.post('/api/auth/verify-email', { token });
        if (response.data.success) {
          setStatus('success');
          setMessage('Your email has been verified. Redirecting you to secure card setup for the 7-day trial.');
          
          if (response.data.data.user && response.data.data.accessToken && response.data.data.refreshToken) {
            await authService.completeLogin(
              response.data.data.user,
              {
                accessToken: response.data.data.accessToken,
                refreshToken: response.data.data.refreshToken,
              },
              true
            );

            localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(response.data.data.user));
            setCheckoutLoading(true);
            try {
              const checkoutResponse = await axios.post(
                '/api/payments/checkout',
                {
                  plan: 'monthly',
                  origin_url: window.location.origin,
                },
                {
                  headers: { Authorization: `Bearer ${response.data.data.accessToken}` },
                }
              );

              if (checkoutResponse.data.success && checkoutResponse.data.data.url) {
                window.location.href = checkoutResponse.data.data.url;
                return;
              }
            } catch {
              setMessage('Your email has been verified. We could not open secure card checkout automatically, so use the button below.');
            } finally {
              setCheckoutLoading(false);
            }
            return;
          }

          if (response.data.data.user) {
            localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(response.data.data.user));
          }
        } else {
          setStatus('error');
          setMessage(response.data.error?.message || 'Verification failed.');
        }
      } catch (error: any) {
        setStatus('error');
        const errorMsg = error.response?.data?.detail?.error?.message || 
                        error.response?.data?.detail || 
                        'The verification link is invalid or has expired.';
        setMessage(errorMsg);
      }
    };

    verifyEmail();
  }, [token, authService, navigate]);

  const handleResend = async () => {
    if (!email || isResending) {
      return;
    }

    try {
      setIsResending(true);
      setResendMessage('');
      const response = await axios.post('/api/auth/resend-verification', { email });
      setResendMessage(response.data?.data?.message || 'Verification email sent. Please check your inbox.');
    } catch (error: any) {
      const errorMsg =
        error.response?.data?.detail?.error?.message ||
        error.response?.data?.detail ||
        'Could not resend verification email. Please try again.';
      setResendMessage(errorMsg);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-8 text-center">
          {status === 'loading' && (
            <>
              <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto mb-4" />
              <h2 className="text-xl font-bold mb-2">Verifying your email...</h2>
              <p className="text-muted-foreground">Please wait a moment</p>
            </>
          )}
          
          {status === 'success' && (
            <>
              <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-950 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-10 w-10 text-emerald-500" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Email Verified!</h2>
              <p className="text-muted-foreground mb-6">{message}</p>
              <p className="text-sm text-muted-foreground mb-6">
                You are being signed in automatically and sent to Stripe card setup.
              </p>
              <Button className="w-full" onClick={() => window.location.assign('/subscription')} data-testid="go-subscription-btn" disabled={checkoutLoading}>
                {checkoutLoading ? 'Opening secure card setup...' : 'Open Secure Card Setup'}
              </Button>
            </>
          )}
          
          {status === 'error' && (
            <>
              <div className="w-20 h-20 bg-red-100 dark:bg-red-950 rounded-full flex items-center justify-center mx-auto mb-4">
                <XCircle className="h-10 w-10 text-red-500" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Verification Failed</h2>
              <p className="text-muted-foreground mb-6">{message}</p>
              <div className="space-y-3">
                <Button className="w-full" onClick={() => navigate('/auth/login')}>
                  Back to Login
                </Button>
                <Button variant="outline" className="w-full" onClick={() => navigate('/auth/register')}>
                  Create New Account
                </Button>
              </div>
            </>
          )}
          
          {status === 'no-token' && (
            <>
              <div className="w-20 h-20 bg-amber-100 dark:bg-amber-950 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="h-10 w-10 text-amber-500" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Check Your Email</h2>
              <p className="text-muted-foreground mb-6">
                Your account was created. Verify your email first, then you will continue to secure card setup for the 7-day free trial.
              </p>
              {email && (
                <p className="text-sm text-foreground mb-4">
                  Verification email sent to <span className="font-medium">{email}</span>
                </p>
              )}
              <div className="space-y-3">
                {email && (
                  <Button variant="outline" className="w-full" onClick={handleResend} disabled={isResending}>
                    {isResending ? 'Sending...' : 'Resend Verification Email'}
                  </Button>
                )}
                <Button className="w-full" onClick={() => navigate('/auth/login')}>
                  Back to Login
                </Button>
              </div>
              {resendMessage && <p className="text-sm text-muted-foreground mt-4">{resendMessage}</p>}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
