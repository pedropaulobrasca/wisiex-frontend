
import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { TradeProvider } from '@/contexts/TradeContext';
import Header from '@/components/Header';
import StatisticsPanel from '@/components/trading/StatisticsPanel';
import OrderForm from '@/components/trading/OrderForm';
import OrderBook from '@/components/trading/OrderBook';
import GlobalMatches from '@/components/trading/GlobalMatches';
import ActiveOrders from '@/components/trading/ActiveOrders';
import UserHistory from '@/components/trading/UserHistory';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { useTrade } from '@/contexts/TradeContext';

const TradePageContent: React.FC = () => {
  const { fetchData, loading } = useTrade();

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-background pb-8">
      <Header />
      <main className="container mx-auto px-4 mt-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Trading Dashboard</h1>
          <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Data
          </Button>
        </div>

        <div className="trading-grid">
          <StatisticsPanel />
          <GlobalMatches />
          <OrderForm />
          <OrderBook />
          <ActiveOrders />
          <UserHistory />
        </div>
      </main>
    </div>
  );
};

const TradePage: React.FC = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/" />;
  }

  return (
    <TradeProvider>
      <TradePageContent />
    </TradeProvider>
  );
};

export default TradePage;
