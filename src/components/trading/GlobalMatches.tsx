import React from 'react';
import { useTrade } from '@/contexts/TradeContext';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';

const GlobalMatches: React.FC = () => {
  const { globalMatches, loading } = useTrade();

  if (loading) {
    return (
      <div className="global-matches trading-panel">
        <h2 className="text-xl font-semibold">Global Matches</h2>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="global-matches trading-panel">
      <h2 className="text-xl font-semibold">Global Matches</h2>
      <div className="table-container max-h-[300px]">
        <Table>
          <TableHeader className="sticky top-0 bg-card z-10">
            <TableRow>
              <TableHead className="w-1/3">Price</TableHead>
              <TableHead className="w-1/3">Volume</TableHead>
              <TableHead className="w-1/3">Time</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {globalMatches && globalMatches.length > 0 ? (
              globalMatches.map((match) => (
                <TableRow key={match.id}>
                  <TableCell className={`font-medium ${match.type === 'buy' ? 'text-positive' : 'text-negative'}`}>
                    ${typeof match.price === 'number' ? match.price.toLocaleString() : '0'}
                  </TableCell>
                  <TableCell>{typeof match.amount === 'number' ? match.amount.toLocaleString() : '0'} BTC</TableCell>
                  <TableCell>{match.createdAt ? new Date(match.createdAt).toLocaleTimeString() : 'N/A'}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-4">
                  No matches found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default GlobalMatches;
