import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { Pencil, Trash2 } from "lucide-react";
import { ServiceForm } from "./ServiceForm";

interface ServiceCardProps {
  category: string;
  services: any[];
  categories: any[];
  onUpdate: (service: any) => void;
  onDelete: (id: string) => void;
  isAdmin: boolean;
}

export const ServiceCard = ({ 
  category, 
  services, 
  categories,
  onUpdate,
  onDelete,
  isAdmin 
}: ServiceCardProps) => {
  return (
    <Card className="w-full">
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
                      <ServiceForm
                        title="Edit Service"
                        initialData={service}
                        categories={categories}
                        onSubmit={onUpdate}
                      />
                    </Dialog>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => {
                        if (window.confirm('Are you sure you want to delete this service?')) {
                          onDelete(service.id);
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
  );
};