
import { Card } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DatePicker } from "@/components/ui/date-picker";
import { useState } from "react";
import { startOfDay, endOfDay } from "date-fns";
import { Loader2 } from "lucide-react";

interface StaffPerformance {
  name: string;
  totalTips: number;
  serviceCount: number;
}

const Dashboard = () => {
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(new Date());

  const { data: totalSales, isLoading: isLoadingSales } = useQuery({
    queryKey: ['total-sales', startDate, endDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select('total_amount')
        .gte('created_at', startOfDay(startDate).toISOString())
        .lte('created_at', endOfDay(endDate).toISOString());
      if (error) throw error;
      return data.reduce((sum, transaction) => sum + Number(transaction.total_amount), 0);
    },
  });

  const { data: staffPerformance, isLoading: isLoadingStaff } = useQuery<StaffPerformance[]>({
    queryKey: ['staff-performance', startDate, endDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transaction_items')
        .select(`
          staff_id,
          tip,
          profiles (
            full_name,
            email
          )
        `)
        .gte('created_at', startOfDay(startDate).toISOString())
        .lte('created_at', endOfDay(endDate).toISOString());
      
      if (error) throw error;

      const staffStats = data.reduce((acc: Record<string, StaffPerformance>, item) => {
        const staffId = item.staff_id;
        if (!acc[staffId]) {
          acc[staffId] = {
            name: item.profiles?.full_name || item.profiles?.email || 'Unknown',
            totalTips: 0,
            serviceCount: 0,
          };
        }
        acc[staffId].totalTips += Number(item.tip);
        acc[staffId].serviceCount += 1;
        return acc;
      }, {});

      return Object.values(staffStats);
    },
  });

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto w-full">
      <h1 className="text-2xl md:text-3xl font-semibold mb-6">Dashboard</h1>
      
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="w-full sm:w-auto">
          <label className="block text-sm font-medium mb-1">Start Date</label>
          <DatePicker date={startDate} onSelect={setStartDate} />
        </div>
        <div className="w-full sm:w-auto">
          <label className="block text-sm font-medium mb-1">End Date</label>
          <DatePicker date={endDate} onSelect={setEndDate} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card className="p-6">
          <h3 className="text-lg font-medium text-gray-600">Total Sales</h3>
          {isLoadingSales ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <p className="text-2xl md:text-3xl font-bold mt-2">${totalSales?.toFixed(2) || '0.00'}</p>
          )}
        </Card>
      </div>

      <div className="space-y-6">
        <h2 className="text-xl font-semibold">Staff Performance</h2>
        {isLoadingStaff ? (
          <div className="flex justify-center">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-4 md:p-6">
              <h3 className="text-lg font-medium mb-4">Top Tips Earners</h3>
              <div className="space-y-3">
                {staffPerformance
                  ?.sort((a, b) => b.totalTips - a.totalTips)
                  .slice(0, 5)
                  .map((staff, index) => (
                    <div key={index} className="flex justify-between items-center bg-secondary/50 p-3 rounded-lg">
                      <span className="font-medium truncate">{staff.name}</span>
                      <span className="font-semibold">${staff.totalTips.toFixed(2)}</span>
                    </div>
                  ))}
                {(!staffPerformance || staffPerformance.length === 0) && (
                  <p className="text-center text-gray-500">No data available</p>
                )}
              </div>
            </Card>
            <Card className="p-4 md:p-6">
              <h3 className="text-lg font-medium mb-4">Most Services Provided</h3>
              <div className="space-y-3">
                {staffPerformance
                  ?.sort((a, b) => b.serviceCount - a.serviceCount)
                  .slice(0, 5)
                  .map((staff, index) => (
                    <div key={index} className="flex justify-between items-center bg-secondary/50 p-3 rounded-lg">
                      <span className="font-medium truncate">{staff.name}</span>
                      <span className="font-semibold">{staff.serviceCount} services</span>
                    </div>
                  ))}
                {(!staffPerformance || staffPerformance.length === 0) && (
                  <p className="text-center text-gray-500">No data available</p>
                )}
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
