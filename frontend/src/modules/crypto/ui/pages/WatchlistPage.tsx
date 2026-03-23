import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Star, Plus, Trash2, TrendingUp, TrendingDown, RefreshCw, Bell, BellOff, ExternalLink } from 'lucide-react';
import { Card, CardContent } from '@/shared/ui/shadcn/components/ui/card';
import { Badge } from '@/shared/ui/shadcn/components/ui/badge';
import { Button } from '@/shared/ui/shadcn/components/ui/button';
import { Input } from '@/shared/ui/shadcn/components/ui/input';
import { readStoredToken } from '@/shared/utils/tokenStorage';
import { toast } from 'sonner';

const getToken = () => readStoredToken();

interface WatchlistCoin {
  symbol: string;
  name: string;
  addedAt: string;
  alertEnabled: boolean;
  alertThreshold: number;
}

interface CoinData {
  symbol: string;
  name: string;
  price: number;
  price_change_1h: number;
  price_change_24h: number;
  image?: string;
  signal_type?: string;
  signal_strength?: number;
}

const STORAGE_KEY = 'pumpradar_watchlist';

export default function WatchlistPage() {
  const navigate = useNavigate();
  const [watchlist, setWatchlist] = useState<WatchlistCoin[]>([]);
  const [coinData, setCoinData] = useState<Map<string, CoinData>>(new Map());
  const [loading, setLoading] = useState(true);
  const [newCoin, setNewCoin] = useState('');
  const [adding, setAdding] = useState(false);

  // Require active subscription before exposing watchlist tools
  useEffect(() => {
    const checkAccess = async () => {
      const token = getToken();
      if (!token) {
        navigate('/auth/login', { replace: true });
        return;
      }

      try {
        const res = await axios.get('/api/user/subscription', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.data?.success || !res.data?.data?.is_active) {
          navigate('/subscription', { replace: true });
          return;
        }

        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          try {
            setWatchlist(JSON.parse(saved));
          } catch {}
        }
      } catch (error) {
        if (axios.isAxiosError(error)) {
          if (error.response?.status === 402) {
            navigate('/subscription', { replace: true });
            return;
          }
          if (error.response?.status === 401) {
            navigate('/auth/login', { replace: true });
            return;
          }
        }
      } finally {
        setLoading(false);
      }
    };

    checkAccess();
  }, [navigate]);

  // Save watchlist to localStorage
  useEffect(() => {
    if (!loading) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(watchlist));
    }
  }, [watchlist, loading]);

  // Fetch current prices for watchlist coins
  useEffect(() => {
    if (watchlist.length === 0) return;
    
    const fetchPrices = async () => {
      try {
        const token = getToken();
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        
        // Get current signals
        const res = await axios.get('/api/crypto/signals', { headers });
        if (res.data.success) {
          const allSignals = [
            ...res.data.data.pump_signals.map((s: any) => ({ ...s, signal_type: 'pump' })),
            ...res.data.data.dump_signals.map((s: any) => ({ ...s, signal_type: 'dump' })),
          ];
          
          const dataMap = new Map<string, CoinData>();
          allSignals.forEach((s: any) => {
            dataMap.set(s.symbol.toUpperCase(), {
              symbol: s.symbol,
              name: s.name,
              price: s.price,
              price_change_1h: s.price_change_1h,
              price_change_24h: s.price_change_24h,
              image: s.image,
              signal_type: s.signal_type,
              signal_strength: s.signal_strength,
            });
          });
          setCoinData(dataMap);
        }
      } catch (err) {
        if (axios.isAxiosError(err)) {
          if (err.response?.status === 402) {
            navigate('/subscription', { replace: true });
            return;
          }
          if (err.response?.status === 401) {
            navigate('/auth/login', { replace: true });
            return;
          }
        }
        console.error('Failed to fetch prices', err);
      }
    };
    
    fetchPrices();
    const interval = setInterval(fetchPrices, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, [watchlist, navigate]);

  const addCoin = async () => {
    if (!newCoin.trim()) return;
    
    const symbol = newCoin.trim().toUpperCase();
    
    // Check if already in watchlist
    if (watchlist.some(w => w.symbol === symbol)) {
      toast.error(`${symbol} is already in your watchlist`);
      return;
    }
    
    setAdding(true);
    
    // Try to get coin info
    try {
      const token = getToken();
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await axios.get(`/api/crypto/coin/${symbol}`, { headers });
      
      const coinInfo = res.data.data;
      
      setWatchlist(prev => [...prev, {
        symbol: symbol,
        name: coinInfo?.name || symbol,
        addedAt: new Date().toISOString(),
        alertEnabled: false,
        alertThreshold: 80,
      }]);
      
      setNewCoin('');
      toast.success(`Added ${symbol} to watchlist`);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 402) {
          navigate('/subscription', { replace: true });
          setAdding(false);
          return;
        }
        if (err.response?.status === 401) {
          navigate('/auth/login', { replace: true });
          setAdding(false);
          return;
        }
      }
      // Add anyway with just symbol
      setWatchlist(prev => [...prev, {
        symbol: symbol,
        name: symbol,
        addedAt: new Date().toISOString(),
        alertEnabled: false,
        alertThreshold: 80,
      }]);
      setNewCoin('');
      toast.success(`Added ${symbol} to watchlist`);
    }
    
    setAdding(false);
  };

  const removeCoin = (symbol: string) => {
    setWatchlist(prev => prev.filter(w => w.symbol !== symbol));
    toast.info(`Removed ${symbol} from watchlist`);
  };

  const toggleAlert = (symbol: string) => {
    setWatchlist(prev => prev.map(w => 
      w.symbol === symbol ? { ...w, alertEnabled: !w.alertEnabled } : w
    ));
  };

  const updateThreshold = (symbol: string, threshold: number) => {
    setWatchlist(prev => prev.map(w => 
      w.symbol === symbol ? { ...w, alertThreshold: threshold } : w
    ));
  };

  // Check for alerts
  useEffect(() => {
    watchlist.forEach(coin => {
      if (!coin.alertEnabled) return;
      
      const data = coinData.get(coin.symbol);
      if (data && data.signal_strength && data.signal_strength >= coin.alertThreshold) {
        toast(`${coin.symbol} Alert!`, {
          description: `Signal strength: ${data.signal_strength}% (${data.signal_type?.toUpperCase()})`,
          duration: 10000,
        });
      }
    });
  }, [coinData, watchlist]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="watchlist-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-amber-100 dark:bg-amber-950 flex items-center justify-center">
            <Star className="h-5 w-5 text-amber-500" />
          </div>
          <div>
            <h1 className="font-bold text-lg">My Watchlist</h1>
            <p className="text-xs text-muted-foreground">Track your favorite coins and set alerts</p>
          </div>
        </div>
      </div>

      {/* Add Coin */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-2">
            <Input
              placeholder="Enter coin symbol (e.g. BTC, ETH)"
              value={newCoin}
              onChange={(e) => setNewCoin(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === 'Enter' && addCoin()}
              className="flex-1"
              data-testid="watchlist-input"
            />
            <Button onClick={addCoin} disabled={adding || !newCoin.trim()} data-testid="add-coin-btn">
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Watchlist */}
      {watchlist.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Star className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
            <h3 className="font-semibold mb-2">Your watchlist is empty</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Add coins to track their signals and set up alerts
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {watchlist.map(coin => {
            const data = coinData.get(coin.symbol);
            const hasSignal = data?.signal_type;
            
            return (
              <Card key={coin.symbol} className={hasSignal ? 'border-primary/30' : ''}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {data?.image && (
                        <img src={data.image} alt={coin.symbol} className="w-10 h-10 rounded-full" />
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold">{coin.symbol}</span>
                          {hasSignal && (
                            <Badge className={data.signal_type === 'pump' ? 'bg-emerald-500/15 text-emerald-600' : 'bg-red-500/15 text-red-500'}>
                              {data.signal_type === 'pump' ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                              {data.signal_strength}%
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">{coin.name}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      {data && (
                        <div className="text-right">
                          <div className="font-semibold">${data.price > 1 ? data.price.toFixed(2) : data.price.toFixed(6)}</div>
                          <div className={`text-xs ${data.price_change_24h >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                            {data.price_change_24h >= 0 ? '+' : ''}{data.price_change_24h?.toFixed(2)}%
                          </div>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => toggleAlert(coin.symbol)}
                          className={`p-2 rounded-lg transition ${coin.alertEnabled ? 'bg-amber-100 dark:bg-amber-950 text-amber-600' : 'hover:bg-muted text-muted-foreground'}`}
                          title={coin.alertEnabled ? 'Disable alerts' : 'Enable alerts'}
                        >
                          {coin.alertEnabled ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
                        </button>
                        
                        {hasSignal && (
                          <a
                            href={`/coin/${coin.symbol}?type=${data.signal_type}`}
                            className="p-2 rounded-lg hover:bg-muted text-muted-foreground transition"
                            title="View details"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        )}
                        
                        <button
                          onClick={() => removeCoin(coin.symbol)}
                          className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-950 text-muted-foreground hover:text-red-600 transition"
                          title="Remove from watchlist"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {coin.alertEnabled && (
                    <div className="mt-3 pt-3 border-t border-border flex items-center gap-3">
                      <span className="text-xs text-muted-foreground">Alert when signal strength ≥</span>
                      <input
                        type="range"
                        min="50"
                        max="100"
                        value={coin.alertThreshold}
                        onChange={(e) => updateThreshold(coin.symbol, parseInt(e.target.value))}
                        className="flex-1 accent-amber-500"
                      />
                      <span className="text-sm font-semibold w-12">{coin.alertThreshold}%</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
