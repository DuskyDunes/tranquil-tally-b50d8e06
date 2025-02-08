import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { ServiceForm } from "@/components/services/ServiceForm";
import { ServiceCard } from "@/components/services/ServiceCard";

const Services = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: userProfile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user?.id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const isAdmin = userProfile?.role === 'admin';

  const { data: services, isLoading } = useQuery({
    queryKey: ['services'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('services')
        .select('*, categories!services_category_id_fkey(id, name)');
      if (error) throw error;
      return data;
    },
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*');
      if (error) throw error;
      return data;
    },
  });

  const addServiceMutation = useMutation({
    mutationFn: async (newService: any) => {
      const { error } = await supabase
        .from('services')
        .insert([newService]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      toast({
        title: "Success",
        description: "Service added successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to add service",
        variant: "destructive",
      });
    },
  });

  const updateServiceMutation = useMutation({
    mutationFn: async (service: any) => {
      const { error } = await supabase
        .from('services')
        .update({
          name: service.name,
          price: service.price,
          category_id: service.category_id
        })
        .eq('id', service.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      toast({
        title: "Success",
        description: "Service updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update service",
        variant: "destructive",
      });
    },
  });

  const deleteServiceMutation = useMutation({
    mutationFn: async (serviceId: string) => {
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', serviceId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      toast({
        title: "Success",
        description: "Service deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete service",
        variant: "destructive",
      });
    },
  });

  if (isLoading) return <div>Loading...</div>;

  // Group services by category
  const servicesByCategory = services?.reduce((acc, service) => {
    const categoryName = service.categories?.name || 'Uncategorized';
    if (!acc[categoryName]) {
      acc[categoryName] = [];
    }
    acc[categoryName].push(service);
    return acc;
  }, {} as Record<string, typeof services>);

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <h1 className="text-2xl md:text-3xl font-semibold">Services</h1>
        {isAdmin && (
          <Dialog>
            <DialogTrigger asChild>
              <Button className="w-full md:w-auto">
                <Plus className="mr-2 h-4 w-4" />
                Add Service
              </Button>
            </DialogTrigger>
            <ServiceForm
              title="Add New Service"
              categories={categories}
              onSubmit={addServiceMutation.mutate}
            />
          </Dialog>
        )}
      </div>
      
      <div className="space-y-6">
        {Object.entries(servicesByCategory || {}).map(([category, services]) => (
          <ServiceCard
            key={category}
            category={category}
            services={services}
            categories={categories}
            onUpdate={updateServiceMutation.mutate}
            onDelete={deleteServiceMutation.mutate}
            isAdmin={isAdmin}
          />
        ))}
        {(!servicesByCategory || Object.keys(servicesByCategory).length === 0) && (
          <p className="text-center text-gray-500 py-8">No services available.</p>
        )}
      </div>
    </div>
  );
};

export default Services;
