
import React from 'react';
import { useTrade } from '@/contexts/TradeContext';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

const ActiveOrders: React.FC = () => {
  const { userOrders, loading, cancelOrder } = useTrade();

  // Filter to show only active orders
  const activeOrders = userOrders.filter(order => order.status === 'active');

  if (loading) {
    return (
      <div className="active-orders trading-panel">
        <h2 className="text-xl font-semibold mb-4">My Active Orders</h2>
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <div className="active-orders trading-panel">
      <h2 className="text-xl font-semibold mb-4">My Active Orders</h2>
      <div className="overflow-auto">
        <Table>
          <TableHeader>
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
                  <TableCell className={order.type === 'buy' ? 'text-positive' : 'text-negative'}>
                    {order.type.toUpperCase()}
                  </TableCell>
                  <TableCell>{order.amount.toLocaleString()} BTC</TableCell>
                  <TableCell>${order.price.toLocaleString()}</TableCell>
                  <TableCell>${(order.amount * order.price).toLocaleString()}</TableCell>
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
