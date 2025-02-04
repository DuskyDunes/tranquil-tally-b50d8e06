import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { StaffCard } from "@/components/staff/StaffCard";
import { AddStaffDialog } from "@/components/staff/AddStaffDialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Staff = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      return profile;
    },
  });

  const { data: staffMembers, isLoading } = useQuery({
    queryKey: ['staff'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'staff')
        .order('approval_status', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const addStaffMutation = useMutation({
    mutationFn: async (values: any) => {
      const response = await supabase.functions.invoke('manage-staff', {
        body: {
          action: 'add',
          ...values,
        },
      });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to add staff member');
      }

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      toast({
        title: "Success",
        description: "Staff member added successfully. They will receive an email to set their password.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: "Failed to add staff member: " + error.message,
        variant: "destructive",
      });
    },
  });

  const removeStaffMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await supabase.functions.invoke('manage-staff', {
        body: {
          action: 'remove',
          userId,
        },
      });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to remove staff member');
      }

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      toast({
        title: "Success",
        description: "Staff member removed successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: "Failed to remove staff member: " + error.message,
        variant: "destructive",
      });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ userId, status }: { userId: string; status: string }) => {
      const { error } = await supabase
        .from('profiles')
        .update({ approval_status: status })
        .eq('id', userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      toast({
        title: "Success",
        description: "Staff member status updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: "Failed to update staff member status: " + error.message,
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const isAdmin = currentUser?.role === 'admin';
  const pendingStaff = staffMembers?.filter(staff => staff.approval_status === 'pending') || [];
  const approvedStaff = staffMembers?.filter(staff => staff.approval_status === 'approved') || [];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-semibold">Staff Members</h1>
        {isAdmin && <AddStaffDialog onSubmit={addStaffMutation.mutate} />}
      </div>

      <Tabs defaultValue="approved" className="w-full">
        <TabsList>
          <TabsTrigger value="approved">
            Approved Staff
          </TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="pending" className="relative">
              Pending Approvals
              {pendingStaff.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {pendingStaff.length}
                </span>
              )}
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="approved" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {approvedStaff.map((staff) => (
              <StaffCard
                key={staff.id}
                staff={staff}
                isAdmin={isAdmin}
                onRemove={removeStaffMutation.mutate}
                onUpdateStatus={(id, status) => 
                  updateStatusMutation.mutate({ userId: id, status })
                }
              />
            ))}
            {approvedStaff.length === 0 && (
              <p className="text-gray-500 col-span-3 text-center py-8">
                No approved staff members found.
              </p>
            )}
          </div>
        </TabsContent>

        {isAdmin && (
          <TabsContent value="pending" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {pendingStaff.map((staff) => (
                <StaffCard
                  key={staff.id}
                  staff={staff}
                  isAdmin={isAdmin}
                  onRemove={removeStaffMutation.mutate}
                  onUpdateStatus={(id, status) => 
                    updateStatusMutation.mutate({ userId: id, status })
                  }
                />
              ))}
              {pendingStaff.length === 0 && (
                <p className="text-gray-500 col-span-3 text-center py-8">
                  No pending approval requests.
                </p>
              )}
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default Staff;