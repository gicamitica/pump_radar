import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { Loader2, CheckCircle, XCircle, Mail } from 'lucide-react';
import { Button } from '@/shared/ui/shadcn/components/ui/button';
import { Card, CardContent } from '@/shared/ui/shadcn/components/ui/card';

type VerifyStatus = 'loading' | 'success' | 'error' | 'no-token';

export default function VerifyEmailPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<VerifyStatus>('loading');
  const [message, setMessage] = useState('');
  
  const token = searchParams.get('token');

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
          setMessage('Your email has been verified successfully!');
          
          // If user data is returned, update localStorage
          if (response.data.data.user) {
            localStorage.setItem('pumpradar_user', JSON.stringify(response.data.data.user));
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
  }, [token]);

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
              <Button className="w-full" onClick={() => navigate('/auth/login')} data-testid="go-login-btn">
                Continue to Login
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
                We sent a verification link to your email address. Click the link in the email to verify your account.
              </p>
              <Button variant="outline" className="w-full" onClick={() => navigate('/auth/login')}>
                Back to Login
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
