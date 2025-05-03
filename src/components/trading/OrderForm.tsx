
import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useTrade, OrderType } from '@/contexts/TradeContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const OrderForm: React.FC = () => {
  const { 
    placeOrder, 
    balance, 
    selectedOrderForBuy, 
    selectedOrderForSell, 
    setSelectedOrderForBuy,
    setSelectedOrderForSell 
  } = useTrade();
  
  const [activeTab, setActiveTab] = useState<OrderType>('buy');
  const [amount, setAmount] = useState('');
  const [price, setPrice] = useState('');
  const [total, setTotal] = useState(0);

  // Calculate total whenever amount or price changes
  useEffect(() => {
    const calculatedTotal = parseFloat(amount || '0') * parseFloat(price || '0');
    setTotal(isNaN(calculatedTotal) ? 0 : calculatedTotal);
  }, [amount, price]);

  // Handle pre-filling form based on selected order from orderbook
  useEffect(() => {
    if (selectedOrderForBuy && activeTab === 'buy') {
      setPrice(selectedOrderForBuy.price.toString());
      setAmount(selectedOrderForBuy.volume.toString());
      setSelectedOrderForBuy(null);
    }
  }, [selectedOrderForBuy, activeTab, setSelectedOrderForBuy]);

  useEffect(() => {
    if (selectedOrderForSell && activeTab === 'sell') {
      setPrice(selectedOrderForSell.price.toString());
      setAmount(selectedOrderForSell.volume.toString());
      setSelectedOrderForSell(null);
    }
  }, [selectedOrderForSell, activeTab, setSelectedOrderForSell]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const amountValue = parseFloat(amount);
    const priceValue = parseFloat(price);
    
    if (isNaN(amountValue) || isNaN(priceValue) || amountValue <= 0 || priceValue <= 0) {
      return;
    }

    // Check balance constraints
    if (activeTab === 'buy' && total > (balance?.usd || 0)) {
      alert('Insufficient USD balance');
      return;
    }

    if (activeTab === 'sell' && amountValue > (balance?.btc || 0)) {
      alert('Insufficient BTC balance');
      return;
    }

    await placeOrder(activeTab, amountValue, priceValue);
    // Clear form after submission
    setAmount('');
    setPrice('');
  };

  return (
    <div className="buy-sell-panel trading-panel">
      <Tabs defaultValue="buy" className="w-full" onValueChange={(value) => setActiveTab(value as OrderType)}>
        <TabsList className="grid grid-cols-2 w-full mb-4">
          <TabsTrigger value="buy" className="data-[state=active]:bg-positive/20 data-[state=active]:text-positive">Buy</TabsTrigger>
          <TabsTrigger value="sell" className="data-[state=active]:bg-negative/20 data-[state=active]:text-negative">Sell</TabsTrigger>
        </TabsList>
        
        <TabsContent value="buy" className="mt-0">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="buy-amount" className="block text-sm font-medium">Amount (BTC)</label>
              <Input
                id="buy-amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                step="0.0001"
                min="0"
                className="w-full"
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="buy-price" className="block text-sm font-medium">Price (USD)</label>
              <Input
                id="buy-price"
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00"
                step="0.01"
                min="0"
                className="w-full"
              />
            </div>
            
            <div className="p-3 bg-secondary/50 rounded-md">
              <div className="flex justify-between items-center">
                <span className="text-sm">Total USD</span>
                <span className="font-medium">${total.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}</span>
              </div>
            </div>
            
            <Button 
              type="submit" 
              className="w-full bg-positive hover:bg-positive/90"
              disabled={!amount || !price || parseFloat(amount) <= 0 || parseFloat(price) <= 0}
            >
              Buy BTC
            </Button>
          </form>
        </TabsContent>
        
        <TabsContent value="sell" className="mt-0">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="sell-amount" className="block text-sm font-medium">Amount (BTC)</label>
              <Input
                id="sell-amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                step="0.0001"
                min="0"
                className="w-full"
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="sell-price" className="block text-sm font-medium">Price (USD)</label>
              <Input
                id="sell-price"
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00"
                step="0.01"
                min="0"
                className="w-full"
              />
            </div>
            
            <div className="p-3 bg-secondary/50 rounded-md">
              <div className="flex justify-between items-center">
                <span className="text-sm">Total USD</span>
                <span className="font-medium">${total.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}</span>
              </div>
            </div>
            
            <Button 
              type="submit" 
              className="w-full bg-negative hover:bg-negative/90"
              disabled={!amount || !price || parseFloat(amount) <= 0 || parseFloat(price) <= 0}
            >
              Sell BTC
            </Button>
          </form>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default OrderForm;
