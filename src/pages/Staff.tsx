
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { StaffCard } from "@/components/staff/StaffCard";
import { AddStaffDialog } from "@/components/staff/AddStaffDialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useIsMobile } from "@/hooks/use-mobile";

const Staff = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching current user profile:', error);
        return null;
      }
      
      return profile;
    },
  });

  const { data: staffMembers, isLoading, error } = useQuery({
    queryKey: ['staff'],
    queryFn: async () => {
      console.log('Fetching staff members...');
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'staff')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching staff members:', error);
        throw error;
      }
      
      console.log('Staff members fetched:', data);
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
      console.log('Updating status:', { userId, status });
      const { data, error } = await supabase
        .from('profiles')
        .update({ approval_status: status })
        .eq('id', userId)
        .select()
        .maybeSingle();

      if (error) {
        console.error('Error updating status:', error);
        throw error;
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      toast({
        title: "Success",
        description: "Staff member status updated successfully",
      });
    },
    onError: (error: Error) => {
      console.error('Update status error:', error);
      toast({
        title: "Error",
        description: "Failed to update staff member status: " + error.message,
        variant: "destructive",
      });
    },
  });

  if (error) {
    return (
      <div className="p-4 text-red-500">
        Error loading staff members. Please try again later.
      </div>
    );
  }

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
    <div className="p-4 max-w-[100vw] overflow-x-hidden">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl font-semibold">Staff Members</h1>
        {isAdmin && <AddStaffDialog onSubmit={addStaffMutation.mutate} />}
      </div>

      <Tabs defaultValue="approved" className="w-full">
        <TabsList className="w-full grid grid-cols-2 mb-4">
          <TabsTrigger value="approved" className="flex-1">
            {isMobile ? 'Approved' : 'Approved Staff'}
          </TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="pending" className="relative flex-1">
              {isMobile ? 'Pending' : 'Pending Approvals'}
              {pendingStaff.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {pendingStaff.length}
                </span>
              )}
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="approved">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
              <p className="text-gray-500 col-span-full text-center py-8">
                No approved staff members found.
              </p>
            )}
          </div>
        </TabsContent>

        {isAdmin && (
          <TabsContent value="pending">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
                <p className="text-gray-500 col-span-full text-center py-8">
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
