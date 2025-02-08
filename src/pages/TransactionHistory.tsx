import { Card } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DatePicker } from "@/components/ui/date-picker";
import { useState } from "react";
import { startOfDay, endOfDay, format } from "date-fns";
import { Loader2 } from "lucide-react";
import { Link } from "react-router-dom";

interface TransactionItem {
  id: string;
  price: number;
  tip: number;
  services: {
    name: string;
  };
  profiles: {
    full_name: string | null;
    email: string | null;
  };
}

interface Transaction {
  id: string;
  customer_name: string;
  customer_mobile: string;
  total_amount: number;
  total_tips: number;
  created_at: string;
  transaction_items: TransactionItem[];
}

const TransactionHistory = () => {
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(new Date());

  const { data: transactions, isLoading } = useQuery<Transaction[]>({
    queryKey: ['transactions-history', startDate, endDate],
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
        .gte('created_at', startOfDay(startDate).toISOString())
        .lte('created_at', endOfDay(endDate).toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl md:text-3xl font-semibold mb-6">Transaction History</h1>

      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="w-full sm:w-auto">
          <label className="block text-sm font-medium mb-1">Start Date</label>
          <DatePicker date={startDate} onSelect={setStartDate} />
        </div>
        <div className="w-full sm:w-auto">
          <label className="block text-sm font-medium mb-1">End Date</label>
          <DatePicker date={endDate} onSelect={setEndDate} />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <div className="space-y-4">
          {transactions?.map((transaction) => (
            <Link key={transaction.id} to={`/transactions/${transaction.id}`}>
              <Card className="p-4 md:p-6 hover:shadow-lg transition-shadow duration-200">
                <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">{transaction.customer_name}</h3>
                    <p className="text-sm text-gray-500">{transaction.customer_mobile}</p>
                    <p className="text-sm text-gray-500">
                      {format(new Date(transaction.created_at), 'PPpp')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold">${transaction.total_amount}</p>
                    <p className="text-sm text-gray-500">Tips: ${transaction.total_tips}</p>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-medium mb-2">Services</h4>
                  <div className="space-y-3">
                    {transaction.transaction_items?.map((item: any) => (
                      <div key={item.id} className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
                        <div>
                          <p className="font-medium">{item.services?.name}</p>
                          <p className="text-sm text-gray-500">
                            Staff: {item.profiles?.full_name || item.profiles?.email}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">${item.price}</p>
                          {item.tip > 0 && (
                            <p className="text-sm text-gray-500">Tip: ${item.tip}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            </Link>
          ))}
          {(!transactions || transactions.length === 0) && (
            <p className="text-center text-gray-500 py-8">No transactions found.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default TransactionHistory;
