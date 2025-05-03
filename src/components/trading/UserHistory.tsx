
import React from 'react';
import { useTrade } from '@/contexts/TradeContext';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';

const UserHistory: React.FC = () => {
  const { userMatches, loading } = useTrade();

  if (loading) {
    return (
      <div className="history-panel trading-panel">
        <h2 className="text-xl font-semibold mb-4">My History</h2>
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <div className="history-panel trading-panel">
      <h2 className="text-xl font-semibold mb-4">My History</h2>
      <div className="overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Price</TableHead>
              <TableHead>Volume</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {userMatches && userMatches.length > 0 ? (
              userMatches.map((match) => (
                <TableRow key={match.id}>
                  <TableCell className={match.type === 'buy' ? 'text-positive' : 'text-negative'}>
                    ${match.price.toLocaleString()}
                  </TableCell>
                  <TableCell>{match.amount.toLocaleString()} BTC</TableCell>
                  <TableCell className={match.type === 'buy' ? 'text-positive' : 'text-negative'}>
                    {match.type === 'buy' ? 'Buy' : 'Sell'}
                  </TableCell>
                  <TableCell>{new Date(match.createdAt).toLocaleDateString()}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-4">
                  No transaction history
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default UserHistory;
