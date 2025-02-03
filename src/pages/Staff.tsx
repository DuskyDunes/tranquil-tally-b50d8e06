import { Card } from "@/components/ui/card";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, UserPlus, UserMinus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";

interface StaffMember {
  id: string;
  full_name: string | null;
  email: string;
  role: string;
}

const addStaffSchema = z.object({
  email: z.string().email(),
  full_name: z.string().min(1, "Full name is required"),
});

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
        .eq('role', 'staff');
      
      if (error) {
        console.error('Error fetching staff:', error);
        throw error;
      }
      return data as StaffMember[];
    },
  });

  const form = useForm({
    resolver: zodResolver(addStaffSchema),
    defaultValues: {
      email: "",
      full_name: "",
    },
  });

  const addStaffMutation = useMutation({
    mutationFn: async (values: z.infer<typeof addStaffSchema>) => {
      const { data, error } = await supabase
        .from('profiles')
        .insert([
          { ...values, role: 'staff' }
        ])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      toast({
        title: "Success",
        description: "Staff member added successfully",
      });
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to add staff member: " + error.message,
        variant: "destructive",
      });
    },
  });

  const removeStaffMutation = useMutation({
    mutationFn: async (staffId: string) => {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', staffId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      toast({
        title: "Success",
        description: "Staff member removed successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to remove staff member: " + error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: z.infer<typeof addStaffSchema>) => {
    addStaffMutation.mutate(values);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const isAdmin = currentUser?.role === 'admin';

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-semibold">Staff Members</h1>
        {isAdmin && (
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="mr-2" />
                Add Staff
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Staff Member</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input placeholder="Email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="full_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Full Name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full">
                    Add Staff Member
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {staffMembers?.map((staff) => (
          <Card key={staff.id} className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-semibold">
                  {staff.full_name || 'No name set'}
                </h3>
                <p className="text-sm text-gray-500">{staff.email}</p>
                <p className="text-sm text-gray-500 mt-2 capitalize">{staff.role}</p>
              </div>
              {isAdmin && (
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={() => {
                    if (window.confirm('Are you sure you want to remove this staff member?')) {
                      removeStaffMutation.mutate(staff.id);
                    }
                  }}
                >
                  <UserMinus className="h-4 w-4" />
                </Button>
              )}
            </div>
          </Card>
        ))}
        {staffMembers?.length === 0 && (
          <p className="text-gray-500 col-span-3 text-center py-8">
            No staff members found.
          </p>
        )}
      </div>
    </div>
  );
};

export default Staff;