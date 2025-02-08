
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
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
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
      if (!newService) throw new Error('Service data is required');
      
      // Remove any undefined or empty id field
      const { id, ...serviceData } = newService;
      
      const { data, error } = await supabase
        .from('services')
        .insert([serviceData])
        .select()
        .single();
        
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      toast({
        title: "Success",
        description: "Service added successfully",
      });
    },
    onError: (error) => {
      console.error('Add service error:', error);
      toast({
        title: "Error",
        description: "Failed to add service",
        variant: "destructive",
      });
    },
  });

  const updateServiceMutation = useMutation({
    mutationFn: async (service: any) => {
      if (!service?.id) throw new Error('Service ID is required');
      
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
      console.error('Update service error:', error);
      toast({
        title: "Error",
        description: "Failed to update service",
        variant: "destructive",
      });
    },
  });

  const deleteServiceMutation = useMutation({
    mutationFn: async (serviceId: string) => {
      if (!serviceId) throw new Error('Service ID is required');
      
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
      console.error('Delete service error:', error);
      toast({
        title: "Error",
        description: "Failed to delete service",
        variant: "destructive",
      });
    },
  });

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
    <div className="animate-fadeIn space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl md:text-3xl font-semibold">Services</h1>
        {isAdmin && (
          <Dialog>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto">
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
      
      <div className="grid gap-6">
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
