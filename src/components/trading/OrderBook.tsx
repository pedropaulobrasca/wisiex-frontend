
import React from 'react';
import { useTrade } from '@/contexts/TradeContext';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const OrderBook: React.FC = () => {
  const { orderBook, loading, setSelectedOrderForBuy, setSelectedOrderForSell } = useTrade();

  const handleBidClick = (bid: { price: number; volume: number }) => {
    setSelectedOrderForSell(bid);
  };

  const handleAskClick = (ask: { price: number; volume: number }) => {
    setSelectedOrderForBuy(ask);
  };

  if (loading) {
    return (
      <div className="order-book trading-panel">
        <h2 className="text-xl font-semibold mb-4">Order Book</h2>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="order-book trading-panel">
      <h2 className="text-xl font-semibold mb-4">Order Book</h2>
      <Tabs defaultValue="both" className="w-full">
        <TabsList className="grid grid-cols-3 w-full mb-4">
          <TabsTrigger value="asks">Asks (Sell)</TabsTrigger>
          <TabsTrigger value="both">Both</TabsTrigger>
          <TabsTrigger value="bids">Bids (Buy)</TabsTrigger>
        </TabsList>
        
        <TabsContent value="asks" className="mt-0">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-1/2 text-right">Price</TableHead>
                    <TableHead className="w-1/2 text-right">Volume (BTC)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orderBook?.asks && orderBook.asks.length > 0 ? (
                    orderBook.asks.map((ask, index) => (
                      <TableRow 
                        key={`ask-${index}-${ask.price}`} 
                        className="cursor-pointer hover:bg-secondary/60"
                        onClick={() => handleAskClick(ask)}
                      >
                        <TableCell className="text-right font-medium text-negative">
                          ${ask.price.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          {ask.volume.toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={2} className="text-center py-4">
                        No asks available
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="both" className="mt-0">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-1/2 text-right">Price</TableHead>
                    <TableHead className="w-1/2 text-right">Volume (BTC)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orderBook?.asks && orderBook.asks.length > 0 ? (
                    orderBook.asks.slice().reverse().map((ask, index) => (
                      <TableRow 
                        key={`ask-both-${index}-${ask.price}`} 
                        className="cursor-pointer hover:bg-secondary/60"
                        onClick={() => handleAskClick(ask)}
                      >
                        <TableCell className="text-right font-medium text-negative">
                          ${ask.price.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          {ask.volume.toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={2} className="text-center py-2">
                        No asks available
                      </TableCell>
                    </TableRow>
                  )}
                  
                  <TableRow className="bg-secondary/30">
                    <TableCell colSpan={2} className="text-center py-1 border-y border-primary/30">
                      Spread: ${orderBook?.asks[0] && orderBook?.bids[0] 
                        ? (orderBook.asks[0].price - orderBook.bids[0].price).toLocaleString() 
                        : '0'}
                    </TableCell>
                  </TableRow>
                  
                  {orderBook?.bids && orderBook.bids.length > 0 ? (
                    orderBook.bids.map((bid, index) => (
                      <TableRow 
                        key={`bid-both-${index}-${bid.price}`} 
                        className="cursor-pointer hover:bg-secondary/60"
                        onClick={() => handleBidClick(bid)}
                      >
                        <TableCell className="text-right font-medium text-positive">
                          ${bid.price.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          {bid.volume.toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={2} className="text-center py-2">
                        No bids available
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="bids" className="mt-0">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-1/2 text-right">Price</TableHead>
                    <TableHead className="w-1/2 text-right">Volume (BTC)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orderBook?.bids && orderBook.bids.length > 0 ? (
                    orderBook.bids.map((bid, index) => (
                      <TableRow 
                        key={`bid-${index}-${bid.price}`} 
                        className="cursor-pointer hover:bg-secondary/60"
                        onClick={() => handleBidClick(bid)}
                      >
                        <TableCell className="text-right font-medium text-positive">
                          ${bid.price.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          {bid.volume.toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={2} className="text-center py-4">
                        No bids available
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default OrderBook;
