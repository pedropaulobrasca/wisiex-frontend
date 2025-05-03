
import React, { createContext, useState, useEffect, useContext } from 'react';
import { tradeService } from '../services/api';
import { useToast } from '../hooks/use-toast';
import { useAuth } from './AuthContext';

export type OrderType = 'buy' | 'sell';

export interface Order {
  id: string;
  type: OrderType;
  amount: number;
  price: number;
  userId: string;
  status: 'active' | 'completed' | 'cancelled';
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
  const [selectedOrderForBuy, setSelectedOrderForBuy] = useState<{ price: number; volume: number } | null>(null);
  const [selectedOrderForSell, setSelectedOrderForSell] = useState<{ price: number; volume: number } | null>(null);
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();

  const fetchData = async () => {
    if (!isAuthenticated) return;
    
    try {
      setLoading(true);
      
      // Fetch all data in parallel
      const [statsData, bookData, ordersData, globalMatchesData, userMatchesData, balanceData] = await Promise.all([
        tradeService.getStatistics(),
        tradeService.getOrderBook(),
        tradeService.getUserOrders(),
        tradeService.getGlobalMatches(),
        tradeService.getUserMatches(),
        tradeService.getUserBalance()
      ]);
      
      setStatistics(statsData);
      setOrderBook(bookData);
      setUserOrders(ordersData);
      setGlobalMatches(globalMatchesData);
      setUserMatches(userMatchesData);
      setBalance(balanceData);
    } catch (error) {
      console.error('Error fetching trade data:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to load data',
        description: 'Please refresh the page to try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  const placeOrder = async (type: OrderType, amount: number, price: number) => {
    try {
      await tradeService.placeOrder({ type, amount, price });
      toast({
        title: 'Order placed successfully',
        description: `Your ${type} order for ${amount} BTC at $${price} has been placed.`,
      });
      fetchData(); // Refresh data
    } catch (error) {
      console.error('Error placing order:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to place order',
        description: 'Please try again.',
      });
    }
  };

  const cancelOrder = async (orderId: string) => {
    try {
      await tradeService.cancelOrder(orderId);
      toast({
        title: 'Order cancelled',
        description: 'Your order has been cancelled successfully.',
      });
      fetchData(); // Refresh data
    } catch (error) {
      console.error('Error cancelling order:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to cancel order',
        description: 'Please try again.',
      });
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
      
      // Set up polling for real-time updates (every 5 seconds)
      const intervalId = setInterval(fetchData, 5000);
      
      return () => clearInterval(intervalId);
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
