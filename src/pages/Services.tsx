import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

const Services = () => {
  const { data: services, isLoading } = useQuery({
    queryKey: ['services'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('services')
        .select(`
          *,
          categories (
            name
          )
        `);
      if (error) throw error;
      return data;
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
    <div className="p-6">
      <h1 className="text-3xl font-semibold mb-8">Services</h1>
      
      <div className="space-y-6">
        {Object.entries(servicesByCategory || {}).map(([category, services]) => (
          <Card key={category} className="w-full">
            <CardHeader>
              <CardTitle>{category}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {services?.map((service) => (
                  <div key={service.id} className="flex items-center justify-between">
                    <span className="text-lg">{service.name}</span>
                    <span className="text-lg font-bold hidden">${service.price}</span>
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