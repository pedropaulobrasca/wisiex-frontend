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
  buyerId: string;
  sellerId: string;
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
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      const userId = localStorage.getItem('userId');
      setCurrentUserId(userId);
    }
  }, [isAuthenticated]);

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
      
      // Atualizações otimistas (antes da resposta do servidor)
      // Criar uma ordem temporária com ID local
      const tempOrderId = `temp-${Date.now()}`;
      const tempOrder = {
        id: tempOrderId,
        userId: currentUserId || '',
        type: formattedType,
        amount,
        price,
        status: 'OPEN' as const,
        createdAt: new Date().toISOString()
      } as Order;
      
      // Adicionar imediatamente à lista de ordens locais
      setUserOrders(prev => [tempOrder, ...prev]);
      
      // Atualizar localmente o orderbook (otimista)
      if (orderBook) {
        const newOrderBook = { ...orderBook };
        const orderEntry = { price, volume: amount };
        
        if (formattedType === 'BUY') {
          const bidIndex = newOrderBook.bids.findIndex(bid => bid.price === price);
          if (bidIndex >= 0) {
            newOrderBook.bids[bidIndex].volume += amount;
          } else {
            // Inserir na posição correta (ordem decrescente)
            const insertIndex = newOrderBook.bids.findIndex(bid => bid.price < price);
            if (insertIndex >= 0) {
              newOrderBook.bids.splice(insertIndex, 0, orderEntry);
            } else {
              newOrderBook.bids.push(orderEntry);
            }
            // Reordenar bids (preço decrescente)
            newOrderBook.bids.sort((a, b) => b.price - a.price);
          }
        } else {
          const askIndex = newOrderBook.asks.findIndex(ask => ask.price === price);
          if (askIndex >= 0) {
            newOrderBook.asks[askIndex].volume += amount;
          } else {
            // Inserir na posição correta (ordem crescente)
            const insertIndex = newOrderBook.asks.findIndex(ask => ask.price > price);
            if (insertIndex >= 0) {
              newOrderBook.asks.splice(insertIndex, 0, orderEntry);
            } else {
              newOrderBook.asks.push(orderEntry);
            }
            // Reordenar asks (preço crescente)
            newOrderBook.asks.sort((a, b) => a.price - b.price);
          }
        }
        
        setOrderBook(newOrderBook);
      }
      
      // Enviar a ordem ao servidor
      const response = await tradeService.placeOrder({ type: formattedType, amount, price });
      toast({
        title: 'Ordem enviada com sucesso',
        description: `Sua ordem de ${type} para ${amount} BTC a $${price} foi enviada.`,
      });
      
      // Substituir a ordem temporária pela ordem real do servidor
      if (response && response.id) {
        console.log('Substituindo ordem temporária pela ordem real:', response);
        setUserOrders(prev => {
          const filtered = prev.filter(o => o.id !== tempOrderId);
          return [response, ...filtered];
        });
      }
      
    } catch (error) {
      console.error('Erro ao enviar ordem:', error);
      
      // Remover a ordem temporária em caso de erro
      setUserOrders(prev => prev.filter(o => !o.id.startsWith('temp-')));
      
      toast({
        variant: 'destructive',
        title: 'Falha ao enviar ordem',
        description: 'Por favor, tente novamente.',
      });
    }
  };

  const cancelOrder = async (orderId: string) => {
    try {
      // Atualizações otimistas (antes da resposta do servidor)
      // Remover a ordem da lista de ordens do usuário
      const orderToCancel = userOrders.find(o => o.id === orderId);
      
      if (orderToCancel) {
        // Atualizar a lista de ordens localmente
        setUserOrders(prev => prev.filter(order => order.id !== orderId));
        
        // Atualizar o orderbook localmente
        if (orderBook && orderToCancel.status === 'OPEN') {
          const newOrderBook = { ...orderBook };
          
          if (orderToCancel.type === 'BUY' || orderToCancel.type === 'buy') {
            const bidIndex = newOrderBook.bids.findIndex(bid => bid.price === orderToCancel.price);
            if (bidIndex >= 0) {
              if (newOrderBook.bids[bidIndex].volume > orderToCancel.amount) {
                newOrderBook.bids[bidIndex].volume -= orderToCancel.amount;
              } else {
                newOrderBook.bids.splice(bidIndex, 1);
              }
            }
          } else {
            const askIndex = newOrderBook.asks.findIndex(ask => ask.price === orderToCancel.price);
            if (askIndex >= 0) {
              if (newOrderBook.asks[askIndex].volume > orderToCancel.amount) {
                newOrderBook.asks[askIndex].volume -= orderToCancel.amount;
              } else {
                newOrderBook.asks.splice(askIndex, 1);
              }
            }
          }
          
          setOrderBook(newOrderBook);
        }
      }
      
      // Enviar o cancelamento para o servidor
      await tradeService.cancelOrder(orderId);
      toast({
        title: 'Ordem cancelada',
        description: 'Sua ordem foi cancelada com sucesso.',
      });
    } catch (error) {
      console.error('Erro ao cancelar ordem:', error);
      
      // Desfazer a atualização otimista em caso de erro
      fetchData(); // Carregar dados novamente
      
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
        
        // Recarregar dados após reconexão para garantir sincronização
        fetchData();
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
      const handleNewMatch = (match: Match) => {
        console.log('Recebido novo match:', match);
        
        // Adicionar à lista global de matches
        setGlobalMatches(prevMatches => {
          const isDuplicate = prevMatches.some(m => m.id === match.id);
          if (!isDuplicate) {
            return [match, ...prevMatches.slice(0, 19)];
          }
          return prevMatches;
        });
        
        // Se o usuário estiver envolvido na negociação, atualizar os matches do usuário também
        const userId = currentUserId;
        if (userId && (match.buyerId === userId || match.sellerId === userId)) {
          setUserMatches(prev => {
            const isDuplicate = prev.some(m => m.id === match.id);
            if (!isDuplicate) {
              return [match, ...prev.slice(0, 19)];
            }
            return prev;
          });
        }
      };
      
      // 2. Nova ordem
      const handleNewOrder = (order: Order) => {
        console.log('Recebido nova ordem:', order);
        
        // Se for uma ordem do usuário atual, atualizar a lista de ordens do usuário
        const userId = currentUserId;
        if (userId && order.userId === userId) {
          setUserOrders(prev => {
            const index = prev.findIndex(o => o.id === order.id);
            if (index >= 0) {
              // Atualizar ordem existente
              const updated = [...prev];
              updated[index] = order;
              return updated;
            } else {
              // Adicionar nova ordem
              return [order, ...prev];
            }
          });
        }
        
        // Após qualquer nova ordem, solicitar atualização do order book
        // como fallback, caso o evento orderBookUpdate não chegue
        if (order.status === 'OPEN') {
          console.log('Solicitando atualização do order book após nova ordem');
          tradeService.getOrderBook()
            .then(updatedOrderBook => {
              if (updatedOrderBook && 
                  (updatedOrderBook.asks.length !== orderBook?.asks.length || 
                   updatedOrderBook.bids.length !== orderBook?.bids.length)) {
                console.log('Atualizando order book manualmente após nova ordem');
                setOrderBook(updatedOrderBook);
              }
            })
            .catch(err => console.error('Erro ao atualizar order book após nova ordem:', err));
        }
      };
      
      // 3. Atualização do order book
      const handleOrderBookUpdate = (updatedOrderBook: OrderBook) => {
        console.log('Recebido atualização do order book:', updatedOrderBook);
        setOrderBook(updatedOrderBook);
      };
      
      // 4. Atualização de estatísticas
      const handleStatisticsUpdate = (updatedStats: Statistics) => {
        console.log('Recebido atualização de estatísticas:', updatedStats);
        setStatistics(updatedStats);
      };
      
      // 5. Ordem cancelada
      const handleOrderCancelled = (orderData: { orderId: string }) => {
        console.log('Recebido cancelamento de ordem:', orderData);
        
        // Remover da lista de ordens do usuário
        setUserOrders(prev => prev.filter(order => order.id !== orderData.orderId));
      };
      
      // 6. Atualização de saldo do usuário
      const handleBalanceUpdate = (data: { userId: string, balance: Balance }) => {
        const { userId, balance: newBalance } = data;
        
        // Verificar se o evento de saldo é para o usuário atual
        if (userId === currentUserId) {
          console.log('Recebido atualização de saldo:', newBalance);
          setBalance(newBalance);
        }
      };
      
      // Registrar os listeners
      socketService.on('connect', handleConnect);
      socketService.on('disconnect', handleDisconnect);
      socketService.on('newMatch', handleNewMatch);
      socketService.on('newOrder', handleNewOrder);
      socketService.on('orderBookUpdate', handleOrderBookUpdate);
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
        socketService.off('orderBookUpdate', handleOrderBookUpdate);
        socketService.off('updateStatistics', handleStatisticsUpdate);
        socketService.off('orderCancelled', handleOrderCancelled);
        socketService.off('balanceUpdate', handleBalanceUpdate);
        socketService.disconnect();
      };
    }
  }, [isAuthenticated, fetchData, toast, currentUserId]);

  // Verificação periódica do status da conexão e sincronização de dados
  useEffect(() => {
    if (isAuthenticated) {
      // Verificar estado inicial logo após autenticação
      const initialCheck = setTimeout(() => {
        const isConnected = socketService.isConnected();
        setConnectionStatus(isConnected ? 'connected' : 'disconnected');
        console.log('Status inicial da conexão:', isConnected ? 'conectado' : 'desconectado');
      }, 1000);
      
      // Verificar periodicamente o estado da conexão
      const connectionInterval = setInterval(() => {
        const isConnected = socketService.isConnected();
        setConnectionStatus(isConnected ? 'connected' : 'disconnected');
      }, 3000);
      
      // Sincronizar dados a cada 5 segundos para garantir consistência
      const syncInterval = setInterval(() => {
        console.log('Sincronizando dados...');
        
        // Apenas atualizar os dados mais críticos que precisam estar sincronizados
        Promise.allSettled([
          tradeService.getOrderBook(),
          tradeService.getUserOrders(),
          tradeService.getUserBalance()
        ]).then(results => {
          if (results[0].status === 'fulfilled') {
            const newOrderBook = results[0].value;
            setOrderBook(current => {
              // Verificar se há mudanças significativas para evitar re-renders desnecessários
              const hasSignificantChange = !current || 
                JSON.stringify(newOrderBook.bids) !== JSON.stringify(current.bids) || 
                JSON.stringify(newOrderBook.asks) !== JSON.stringify(current.asks);
              
              return hasSignificantChange ? newOrderBook : current;
            });
          }
          
          if (results[1].status === 'fulfilled') {
            const newOrders = results[1].value;
            setUserOrders(current => {
              // Verificar se há diferença nas ordens
              if (newOrders.length !== current.length) return newOrders;
              
              const currentIds = current.map(o => o.id).sort().join(',');
              const newIds = newOrders.map(o => o.id).sort().join(',');
              return currentIds !== newIds ? newOrders : current;
            });
          }
          
          if (results[2].status === 'fulfilled') {
            const newBalance = results[2].value;
            setBalance(current => {
              if (!current) return newBalance;
              if (current.btc !== newBalance.btc || current.usd !== newBalance.usd) {
                return newBalance;
              }
              return current;
            });
          }
        });
      }, 5000);
      
      return () => {
        clearTimeout(initialCheck);
        clearInterval(connectionInterval);
        clearInterval(syncInterval);
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
