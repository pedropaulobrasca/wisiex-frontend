import React, { useEffect } from 'react';
import { useTrade } from '@/contexts/TradeContext';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

const ActiveOrders: React.FC = () => {
  const { userOrders, loading, cancelOrder } = useTrade();

  // Filter to show only active orders - now only using normalized status
  const activeOrders = userOrders.filter(order => order.status === 'active');

  useEffect(() => {
    console.log('Todas as ordens do usuário:', userOrders);
    console.log('Ordens ativas filtradas:', activeOrders);
    if (userOrders.length > 0) {
      console.log('Status da primeira ordem:', userOrders[0].status);
      console.log('Status das ordens:', userOrders.map(order => order.status));
    }
  }, [userOrders, activeOrders]);

  if (loading) {
    return (
      <div className="active-orders trading-panel">
        <h2 className="text-xl font-semibold">My Active Orders</h2>
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <div className="active-orders trading-panel">
      <h2 className="text-xl font-semibold">My Active Orders ({userOrders.length} total / {activeOrders.length} active)</h2>
      <div className="table-container max-h-[300px]">
        <Table>
          <TableHeader className="sticky top-0 bg-card z-10">
            <TableRow>
              <TableHead className="w-1/5">Type</TableHead>
              <TableHead className="w-1/5">Amount</TableHead>
              <TableHead className="w-1/5">Price</TableHead>
              <TableHead className="w-1/5">Total</TableHead>
              <TableHead className="w-1/5">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {activeOrders.length > 0 ? (
              activeOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className={(order.type || '').toUpperCase() === 'BUY' ? 'text-positive' : 'text-negative'}>
                    {(order.type || '').toUpperCase()}
                  </TableCell>
                  <TableCell>{order.amount?.toLocaleString() || '0'} BTC</TableCell>
                  <TableCell>${order.price?.toLocaleString() || '0'}</TableCell>
                  <TableCell>${((order.amount || 0) * (order.price || 0)).toLocaleString()}</TableCell>
                  <TableCell>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => cancelOrder(order.id)}
                    >
                      Cancel
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-4">
                  No active orders
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default ActiveOrders;
