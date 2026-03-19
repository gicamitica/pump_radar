import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { CheckCircle, Loader2, AlertCircle, Zap, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/shadcn/components/ui/card';
import { Button } from '@/shared/ui/shadcn/components/ui/button';

const getToken = () => localStorage.getItem('pumpradar_auth_token') || sessionStorage.getItem('pumpradar_auth_token');

export default function SubscriptionSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const sessionId = searchParams.get('session_id');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    if (!sessionId) {
      setStatus('error');
      return;
    }
    pollStatus(0);
  }, [sessionId]);

  const pollStatus = async (attempt: number) => {
    if (attempt >= 5) {
      setStatus('error');
      return;
    }
    try {
      const token = getToken();
      const res = await axios.get(`/api/payments/status/${sessionId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) {
        const ps = res.data.data.payment_status;
        if (ps === 'paid') {
          setStatus('success');
          return;
        } else if (res.data.data.status === 'expired') {
          setStatus('error');
          return;
        }
      }
    } catch (err) {
      console.error('Status check error:', err);
    }
    setAttempts(attempt + 1);
    setTimeout(() => pollStatus(attempt + 1), 2000);
  };

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4" data-testid="subscription-success">
      <Card className="max-w-md w-full">
        <CardContent className="pt-8 pb-8 text-center">
          {status === 'loading' && (
            <>
              <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto mb-4" />
              <h2 className="text-xl font-bold mb-2">Verifying payment...</h2>
              <p className="text-muted-foreground">Please wait a few seconds</p>
            </>
          )}
          {status === 'success' && (
            <>
              <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-950 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-10 w-10 text-emerald-500" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Payment Successful!</h2>
              <p className="text-muted-foreground mb-6">
                Your Pro subscription is now active. You have full access to all AI signals.
              </p>
              <div className="space-y-3">
                <Button className="w-full" onClick={() => navigate('/dashboard')} data-testid="go-dashboard-btn">
                  <Zap className="h-4 w-4 mr-2" />
                  Open Dashboard
                </Button>
                <Button variant="outline" className="w-full" onClick={() => navigate('/pages/pricing')}>
                  <Calendar className="h-4 w-4 mr-2" />
                  View Subscription
                </Button>
              </div>
            </>
          )}
          {status === 'error' && (
            <>
              <div className="w-20 h-20 bg-red-100 dark:bg-red-950 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="h-10 w-10 text-red-500" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Verification Error</h2>
              <p className="text-muted-foreground mb-6">
                Could not verify the payment. Please contact support if the amount was charged.
              </p>
              <Button variant="outline" className="w-full" onClick={() => navigate('/pages/pricing')}>
                Back to Pricing
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
