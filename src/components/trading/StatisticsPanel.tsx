
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useTrade } from '@/contexts/TradeContext';
import { Skeleton } from '@/components/ui/skeleton';

const StatisticsPanel: React.FC = () => {
  const { statistics, balance, loading } = useTrade();

  return (
    <div className="stats-panel trading-panel">
      <h2 className="text-xl font-semibold mb-4">Market Statistics</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {loading ? (
          Array(7)
            .fill(0)
            .map((_, i) => (
              <Card key={i} className="bg-secondary">
                <CardContent className="p-4">
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-6 w-16" />
                </CardContent>
              </Card>
            ))
        ) : (
          <>
            <Card className="bg-secondary">
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Last Price</p>
                <p className="text-lg font-medium">
                  ${statistics?.lastPrice ? statistics.lastPrice.toLocaleString() : '0.00'}
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-secondary">
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">24h High</p>
                <p className="text-lg font-medium text-positive">
                  ${statistics?.high ? statistics.high.toLocaleString() : '0.00'}
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-secondary">
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">24h Low</p>
                <p className="text-lg font-medium text-negative">
                  ${statistics?.low ? statistics.low.toLocaleString() : '0.00'}
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-secondary">
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">BTC Volume (24h)</p>
                <p className="text-lg font-medium">
                  {statistics?.btcVolume ? statistics.btcVolume.toLocaleString() : '0.00'} BTC
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-secondary">
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">USD Volume (24h)</p>
                <p className="text-lg font-medium">
                  ${statistics?.usdVolume ? statistics.usdVolume.toLocaleString() : '0.00'}
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-secondary">
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">BTC Balance</p>
                <p className="text-lg font-medium">
                  {balance?.btc ? balance.btc.toLocaleString() : '0.00'} BTC
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-secondary">
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">USD Balance</p>
                <p className="text-lg font-medium">
                  ${balance?.usd ? balance.usd.toLocaleString() : '0.00'}
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
};

export default StatisticsPanel;
