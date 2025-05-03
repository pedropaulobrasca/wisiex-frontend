
import React from 'react';
import { useTrade } from '@/contexts/TradeContext';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';

const GlobalMatches: React.FC = () => {
  const { globalMatches, loading } = useTrade();

  if (loading) {
    return (
      <div className="global-matches trading-panel">
        <h2 className="text-xl font-semibold mb-4">Global Matches</h2>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="global-matches trading-panel">
      <h2 className="text-xl font-semibold mb-4">Global Matches</h2>
      <div className="overflow-auto max-h-[400px]">
        <Table>
          <TableHeader className="sticky top-0 bg-card">
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
                    ${match.price.toLocaleString()}
                  </TableCell>
                  <TableCell>{match.amount.toLocaleString()} BTC</TableCell>
                  <TableCell>{new Date(match.createdAt).toLocaleTimeString()}</TableCell>
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
