
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { ChevronDown, ChevronUp, Pencil, Trash2 } from "lucide-react";
import { ServiceForm } from "./ServiceForm";
import { useState } from "react";
import { cn } from "@/lib/utils";

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
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <Card className="w-full overflow-hidden border-0 shadow-md transition-all duration-300">
      <CardHeader 
        className={cn(
          "bg-accent/30 cursor-pointer transition-all duration-300",
          !isExpanded && "rounded-b-lg"
        )}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg md:text-xl">{category}</CardTitle>
          {isExpanded ? (
            <ChevronUp className="h-5 w-5 text-gray-500" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-500" />
          )}
        </div>
      </CardHeader>
      <CardContent 
        className={cn(
          "transition-all duration-300 ease-in-out",
          isExpanded ? "p-6 max-h-[1000px] opacity-100" : "p-0 max-h-0 opacity-0 overflow-hidden"
        )}
      >
        <div className="grid gap-4">
          {services?.map((service) => (
            <div 
              key={service.id} 
              className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-lg bg-white border shadow-sm hover:shadow-md transition-shadow duration-200"
            >
              <span className="text-base sm:text-lg font-medium text-gray-800">{service.name}</span>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
                <span className="text-lg font-bold text-primary">${service.price}</span>
                {isAdmin && (
                  <div className="flex gap-2 w-full sm:w-auto">
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
