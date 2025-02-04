import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";

const Services = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [editingService, setEditingService] = useState<any>(null);
  const [newService, setNewService] = useState({
    name: "",
    price: "",
    category_id: "",
  });

  // Fetch user role
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
      setNewService({ name: "", price: "", category_id: "" });
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
      setIsEditing(false);
      setEditingService(null);
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
    <div className="p-4 md:p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 md:mb-8 gap-4">
        <h1 className="text-2xl md:text-3xl font-semibold">Services</h1>
        {isAdmin && (
          <Dialog>
            <DialogTrigger asChild>
              <Button className="w-full md:w-auto">
                <Plus className="mr-2 h-4 w-4" />
                Add Service
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add New Service</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={newService.name}
                    onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="price">Price</Label>
                  <Input
                    id="price"
                    type="number"
                    value={newService.price}
                    onChange={(e) => setNewService({ ...newService, price: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="category">Category</Label>
                  <select
                    id="category"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2"
                    value={newService.category_id}
                    onChange={(e) => setNewService({ ...newService, category_id: e.target.value })}
                  >
                    <option value="">Select a category</option>
                    {categories?.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
                <Button
                  onClick={() => addServiceMutation.mutate(newService)}
                  disabled={!newService.name || !newService.price || !newService.category_id}
                  className="w-full"
                >
                  Add Service
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
      
      <div className="space-y-4 md:space-y-6">
        {Object.entries(servicesByCategory || {}).map(([category, services]) => (
          <Card key={category} className="w-full">
            <CardHeader>
              <CardTitle>{category}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {services?.map((service) => (
                  <div key={service.id} className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2 md:gap-4">
                    <span className="text-lg">{service.name}</span>
                    <div className="flex flex-col md:flex-row items-start md:items-center gap-2 md:gap-4 w-full md:w-auto">
                      <span className="text-lg font-bold">${service.price}</span>
                      {isAdmin && (
                        <div className="flex gap-2 w-full md:w-auto">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="icon" className="h-8 w-8">
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[425px]">
                              <DialogHeader>
                                <DialogTitle>Edit Service</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <Label htmlFor="edit-name">Name</Label>
                                  <Input
                                    id="edit-name"
                                    defaultValue={service.name}
                                    onChange={(e) => setEditingService({ ...service, name: e.target.value })}
                                  />
                                </div>
                                <div>
                                  <Label htmlFor="edit-price">Price</Label>
                                  <Input
                                    id="edit-price"
                                    type="number"
                                    defaultValue={service.price}
                                    onChange={(e) => setEditingService({ ...service, price: e.target.value })}
                                  />
                                </div>
                                <div>
                                  <Label htmlFor="edit-category">Category</Label>
                                  <select
                                    id="edit-category"
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2"
                                    defaultValue={service.category_id}
                                    onChange={(e) => setEditingService({ ...service, category_id: e.target.value })}
                                  >
                                    {categories?.map((category) => (
                                      <option key={category.id} value={category.id}>
                                        {category.name}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                                <Button
                                  onClick={() => {
                                    const updatedService = editingService || {
                                      ...service,
                                      name: service.name,
                                      price: service.price,
                                      category_id: service.category_id
                                    };
                                    updateServiceMutation.mutate(updatedService);
                                  }}
                                  className="w-full"
                                >
                                  Update Service
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => {
                              if (window.confirm('Are you sure you want to delete this service?')) {
                                deleteServiceMutation.mutate(service.id);
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Services;