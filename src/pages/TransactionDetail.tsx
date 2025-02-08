import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { format } from 'date-fns';
import { Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

const TransactionDetail = () => {
  const { id } = useParams();

  const { data: transaction, isLoading } = useQuery({
    queryKey: ['transaction', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          transaction_items (
            *,
            services (
              name
            ),
            profiles (
              full_name,
              email
            )
          )
        `)
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!transaction) {
    return (
      <div className="p-4 md:p-6">
        <div className="text-center">
          <h2 className="text-2xl font-semibold">Transaction not found</h2>
          <Link to="/transactions" className="text-primary hover:underline mt-4 block">
            Back to Transactions
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto animate-fadeIn">
      <div className="mb-6">
        <Link to="/transactions">
          <Button variant="ghost" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Transactions
          </Button>
        </Link>
      </div>

      <h1 className="text-2xl md:text-3xl font-semibold mb-6">Transaction Details</h1>
      
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Customer Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div className="flex flex-col md:flex-row justify-between">
                <span className="font-medium">Customer Name:</span>
                <span>{transaction.customer_name}</span>
              </div>
              <div className="flex flex-col md:flex-row justify-between">
                <span className="font-medium">Mobile Number:</span>
                <span>{transaction.customer_mobile}</span>
              </div>
              <div className="flex flex-col md:flex-row justify-between">
                <span className="font-medium">Transaction Date:</span>
                <span>{format(new Date(transaction.created_at), 'PPpp')}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Services</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {transaction.transaction_items?.map((item: any) => (
                <div key={item.id} className="border-b pb-4 last:border-0">
                  <div className="flex flex-col md:flex-row justify-between items-start gap-2">
                    <div>
                      <p className="font-medium">{item.services?.name}</p>
                      <p className="text-sm text-gray-500">
                        Staff: {item.profiles?.full_name || item.profiles?.email}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">${item.price}</p>
                      {item.tip > 0 && (
                        <p className="text-sm text-gray-500">Tip: ${item.tip}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between text-base md:text-lg">
                <span>Subtotal:</span>
                <span>${transaction.total_amount - transaction.total_tips}</span>
              </div>
              <div className="flex justify-between text-base md:text-lg">
                <span>Total Tips:</span>
                <span>${transaction.total_tips}</span>
              </div>
              <div className="flex justify-between text-lg md:text-xl font-bold border-t pt-3">
                <span>Total Amount:</span>
                <span>${transaction.total_amount}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TransactionDetail;
