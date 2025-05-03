import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useTrade } from '@/contexts/TradeContext';
import { Skeleton } from '@/components/ui/skeleton';

// Este componente deve ocupar 3 colunas no grid através da classe statistics-panel
const StatisticsPanel: React.FC = () => {
  const { statistics, loading, balance, connectionStatus } = useTrade();

  if (loading) {
    return (
      <div className="statistics-panel trading-panel">
        <h2 className="text-xl font-semibold">Estatísticas do Mercado</h2>
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  return (
    <div className="statistics-panel trading-panel w-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Estatísticas do Mercado</h2>
        <span className={connectionStatus === 'connected' ? 'text-positive' : 'text-negative'}>
          {connectionStatus === 'connected' ? '● Online' : '● Offline'}
        </span>
      </div>
      
      {/* Estatísticas do mercado em uma única linha */}
      <div className="grid grid-cols-5 gap-2 mb-4">
        <Card>
          <CardContent className="p-3">
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Último Preço</p>
              <p className="text-lg font-bold">
                ${statistics?.lastPrice?.toLocaleString() || '0'}
              </p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-3">
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Vol. BTC</p>
              <p className="text-lg font-bold">
                {statistics?.btcVolume?.toLocaleString() || '0'}
              </p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-3">
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Vol. USD</p>
              <p className="text-lg font-bold">
                ${statistics?.usdVolume?.toLocaleString() || '0'}
              </p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-3">
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Alta 24h</p>
              <p className="text-lg font-bold text-positive">
                ${statistics?.high?.toLocaleString() || '0'}
              </p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-3">
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Baixa 24h</p>
              <p className="text-lg font-bold text-negative">
                ${statistics?.low?.toLocaleString() || '0'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Saldo do usuário */}
      <div className="mt-2 border-t pt-3">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-md font-semibold">Seu Saldo</h3>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Card className="bg-primary/5">
            <CardContent className="p-3 flex justify-between items-center">
              <span className="font-medium text-sm">USD</span>
              <span className="text-xl font-bold">
                ${balance?.usd?.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) || '0.00'}
              </span>
            </CardContent>
          </Card>
          
          <Card className="bg-primary/5">
            <CardContent className="p-3 flex justify-between items-center">
              <span className="font-medium text-sm">BTC</span>
              <span className="text-xl font-bold">
                {balance?.btc?.toLocaleString(undefined, {minimumFractionDigits: 6, maximumFractionDigits: 6}) || '0.000000'}
              </span>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default StatisticsPanel;
