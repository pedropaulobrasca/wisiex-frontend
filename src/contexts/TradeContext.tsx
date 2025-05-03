import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { tradeService } from '../services/api';
import { useToast } from '../hooks/use-toast';
import { useAuth } from './AuthContext';
import socketService from '../services/socket';

export type OrderType = 'buy' | 'sell' | 'BUY' | 'SELL';

export interface Order {
  id: string;
  type: OrderType;
  amount: number;
  price: number;
  userId: string;
  status: 'active' | 'completed' | 'cancelled' | 'OPEN' | 'CANCELED' | 'COMPLETED' | 'open' | 'canceled' | 'completed';
  createdAt: string;
}

export interface Match {
  id: string;
  price: number;
  amount: number;
  type: OrderType;
  createdAt: string;
  buyOrderId: string;
  sellOrderId: string;
}

export interface OrderBook {
  bids: { price: number; volume: number }[];
  asks: { price: number; volume: number }[];
}

export interface Statistics {
  lastPrice: number;
  btcVolume: number;
  usdVolume: number;
  high: number;
  low: number;
}

export interface Balance {
  btc: number;
  usd: number;
}

interface TradeContextType {
  statistics: Statistics | null;
  orderBook: OrderBook | null;
  userOrders: Order[];
  globalMatches: Match[];
  userMatches: Match[];
  balance: Balance | null;
  loading: boolean;
  error: string | null;
  connectionStatus: 'connected' | 'disconnected';
  selectedOrderForBuy: { price: number; volume: number } | null;
  selectedOrderForSell: { price: number; volume: number } | null;
  fetchData: () => Promise<void>;
  placeOrder: (type: OrderType, amount: number, price: number) => Promise<void>;
  cancelOrder: (orderId: string) => Promise<void>;
  setSelectedOrderForBuy: (order: { price: number; volume: number } | null) => void;
  setSelectedOrderForSell: (order: { price: number; volume: number } | null) => void;
}

const TradeContext = createContext<TradeContextType | undefined>(undefined);

export const TradeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [orderBook, setOrderBook] = useState<OrderBook | null>(null);
  const [userOrders, setUserOrders] = useState<Order[]>([]);
  const [globalMatches, setGlobalMatches] = useState<Match[]>([]);
  const [userMatches, setUserMatches] = useState<Match[]>([]);
  const [balance, setBalance] = useState<Balance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected'>('disconnected');
  const [selectedOrderForBuy, setSelectedOrderForBuy] = useState<{ price: number; volume: number } | null>(null);
  const [selectedOrderForSell, setSelectedOrderForSell] = useState<{ price: number; volume: number } | null>(null);
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();

  const fetchData = useCallback(async () => {
    if (!isAuthenticated) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Fetch all data in parallel with proper error handling
      const results = await Promise.allSettled([
        tradeService.getStatistics(),
        tradeService.getOrderBook(),
        tradeService.getUserOrders(),
        tradeService.getGlobalMatches(),
        tradeService.getUserMatches(),
        tradeService.getUserBalance()
      ]);
      
      // Processa os resultados, atualizando apenas o que foi bem-sucedido
      if (results[0].status === 'fulfilled') setStatistics(results[0].value);
      if (results[1].status === 'fulfilled') setOrderBook(results[1].value);
      if (results[2].status === 'fulfilled') setUserOrders(Array.isArray(results[2].value) ? results[2].value : []);
      if (results[3].status === 'fulfilled') setGlobalMatches(Array.isArray(results[3].value) ? results[3].value : []);
      if (results[4].status === 'fulfilled') setUserMatches(Array.isArray(results[4].value) ? results[4].value : []);
      if (results[5].status === 'fulfilled') setBalance(results[5].value);
      
      // Verifica se houve algum erro
      const errors = results.filter(r => r.status === 'rejected');
      if (errors.length > 0) {
        console.error('Alguns dados não puderam ser carregados:', errors);
        setError('Alguns dados não puderam ser carregados. Verifique sua conexão.');
        toast({
          variant: 'destructive',
          title: 'Erro ao carregar dados',
          description: 'Alguns dados da aplicação não foram carregados.',
        });
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      setError('Não foi possível carregar os dados. Por favor, verifique sua conexão.');
      toast({
        variant: 'destructive',
        title: 'Falha ao carregar dados',
        description: 'Por favor, atualize a página para tentar novamente.',
      });
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, toast]);

  const placeOrder = async (type: OrderType, amount: number, price: number) => {
    try {
      const formattedType = typeof type === 'string' ? type.toUpperCase() as OrderType : type;
      await tradeService.placeOrder({ type: formattedType, amount, price });
      toast({
        title: 'Ordem enviada com sucesso',
        description: `Sua ordem de ${type} para ${amount} BTC a $${price} foi enviada.`,
      });
      
      // Atualizar saldo imediatamente após colocar ordem
      try {
        const newBalance = await tradeService.getUserBalance();
        console.log('Saldo atualizado após enviar ordem:', newBalance);
        setBalance(newBalance);
      } catch (balanceError) {
        console.error('Erro ao atualizar saldo após enviar ordem:', balanceError);
      }
      
      fetchData();
    } catch (error) {
      console.error('Erro ao enviar ordem:', error);
      toast({
        variant: 'destructive',
        title: 'Falha ao enviar ordem',
        description: 'Por favor, tente novamente.',
      });
    }
  };

  const cancelOrder = async (orderId: string) => {
    try {
      await tradeService.cancelOrder(orderId);
      toast({
        title: 'Ordem cancelada',
        description: 'Sua ordem foi cancelada com sucesso.',
      });
      
      // Atualizar saldo imediatamente após cancelar ordem
      try {
        const newBalance = await tradeService.getUserBalance();
        console.log('Saldo atualizado após cancelar ordem:', newBalance);
        setBalance(newBalance);
      } catch (balanceError) {
        console.error('Erro ao atualizar saldo após cancelar ordem:', balanceError);
      }
      
      fetchData();
    } catch (error) {
      console.error('Erro ao cancelar ordem:', error);
      toast({
        variant: 'destructive',
        title: 'Falha ao cancelar ordem',
        description: 'Por favor, tente novamente.',
      });
    }
  };

  // Configurar os listeners de socket
  useEffect(() => {
    if (isAuthenticated) {
      // Conectar ao socket
      socketService.connect();
      
      // Definir estado de conexão
      const handleConnect = () => {
        console.log('Socket conectado com sucesso!');
        setConnectionStatus('connected');
        toast({
          title: 'Conectado ao servidor',
          description: 'Dados em tempo real estão sendo recebidos.',
        });
      };
      
      const handleDisconnect = () => {
        console.log('Socket desconectado!');
        setConnectionStatus('disconnected');
        toast({
          variant: 'destructive',
          title: 'Desconectado do servidor',
          description: 'Tentando reconectar...',
        });
      };
      
      // Configurar os listeners para cada tipo de atualização
      
      // 1. Nova negociação ou match
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const handleNewMatch = (match: any) => {
        console.log('Recebido novo match:', match);
        setGlobalMatches(prevMatches => [match, ...prevMatches.slice(0, 19)]);
        
        // Se o usuário estiver envolvido na negociação, atualizar os matches do usuário também
        setUserMatches(prev => {
          const isUserMatch = match.buyOrderId || match.sellOrderId; // Na prática, verificaríamos se o ID do usuário corresponde
          if (isUserMatch) {
            return [match, ...prev.slice(0, 19)];
          }
          return prev;
        });
        
        // Atualizar o saldo de forma imediata após um match
        tradeService.getUserBalance()
          .then(newBalance => {
            console.log('Saldo atualizado após match:', newBalance);
            setBalance(newBalance);
          })
          .catch(err => console.error('Erro ao atualizar saldo após match:', err));
      };
      
      // 2. Nova ordem
      const handleNewOrder = () => {
        // Atualizar o order book
        tradeService.getOrderBook()
          .then(data => setOrderBook(data))
          .catch(err => console.error('Erro ao atualizar order book:', err));
        
        // Atualizar as ordens do usuário
        tradeService.getUserOrders()
          .then(data => setUserOrders(data))
          .catch(err => console.error('Erro ao atualizar ordens do usuário:', err));
      };
      
      // 3. Atualização de estatísticas
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const handleStatisticsUpdate = (updatedStats: any) => {
        setStatistics(updatedStats);
      };
      
      // 4. Ordem cancelada
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const handleOrderCancelled = (orderData: any) => {
        // Atualizar o order book
        tradeService.getOrderBook()
          .then(data => setOrderBook(data))
          .catch(err => console.error('Erro ao atualizar order book após cancelamento:', err));
        
        // Atualizar as ordens do usuário
        setUserOrders(prev => prev.filter(order => order.id !== orderData.orderId));
      };
      
      // 5. Atualização de saldo do usuário
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const handleBalanceUpdate = (data: any) => {
        const { userId, balance } = data;
        
        // Verificar se o evento de saldo é para o usuário atual
        if (userId === localStorage.getItem('userId')) {
          console.log('Recebido atualização de saldo:', balance);
          setBalance(balance);
        }
      };
      
      // Registrar os listeners
      socketService.on('connect', handleConnect);
      socketService.on('disconnect', handleDisconnect);
      socketService.on('newMatch', handleNewMatch);
      socketService.on('newOrder', handleNewOrder);
      socketService.on('updateStatistics', handleStatisticsUpdate);
      socketService.on('orderCancelled', handleOrderCancelled);
      socketService.on('balanceUpdate', handleBalanceUpdate);
      
      // Carregar dados iniciais
      fetchData();
      
      // Limpar listeners ao desmontar
      return () => {
        socketService.off('connect', handleConnect);
        socketService.off('disconnect', handleDisconnect);
        socketService.off('newMatch', handleNewMatch);
        socketService.off('newOrder', handleNewOrder);
        socketService.off('updateStatistics', handleStatisticsUpdate);
        socketService.off('orderCancelled', handleOrderCancelled);
        socketService.off('balanceUpdate', handleBalanceUpdate);
        socketService.disconnect();
      };
    }
  }, [isAuthenticated, fetchData, toast]);

  // Verificação periódica do status da conexão
  useEffect(() => {
    if (isAuthenticated) {
      // Verificar estado inicial logo após autenticação
      const initialCheck = setTimeout(() => {
        const isConnected = socketService.isConnected();
        setConnectionStatus(isConnected ? 'connected' : 'disconnected');
        console.log('Status inicial da conexão:', isConnected ? 'conectado' : 'desconectado');
      }, 2000);
      
      // Verificar periodicamente o estado da conexão
      const interval = setInterval(() => {
        const isConnected = socketService.isConnected();
        setConnectionStatus(isConnected ? 'connected' : 'disconnected');
      }, 5000);
      
      return () => {
        clearTimeout(initialCheck);
        clearInterval(interval);
      };
    }
  }, [isAuthenticated]);

  return (
    <TradeContext.Provider
      value={{
        statistics,
        orderBook,
        userOrders,
        globalMatches,
        userMatches,
        balance,
        loading,
        error,
        connectionStatus,
        selectedOrderForBuy,
        selectedOrderForSell,
        fetchData,
        placeOrder,
        cancelOrder,
        setSelectedOrderForBuy,
        setSelectedOrderForSell,
      }}
    >
      {children}
    </TradeContext.Provider>
  );
};

export const useTrade = (): TradeContextType => {
  const context = useContext(TradeContext);
  if (context === undefined) {
    throw new Error('useTrade must be used within a TradeProvider');
  }
  return context;
};
