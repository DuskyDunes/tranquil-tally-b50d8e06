import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useState } from "react";

interface ServiceFormProps {
  initialData?: {
    id?: string;
    name: string;
    price: string | number;
    category_id: string;
  };
  categories?: Array<{ id: string; name: string }>;
  onSubmit: (data: any) => void;
  title: string;
}

export const ServiceForm = ({ initialData, categories, onSubmit, title }: ServiceFormProps) => {
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    price: initialData?.price || "",
    category_id: initialData?.category_id || "",
  });

  return (
    <DialogContent className="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
      </DialogHeader>
      <div className="space-y-4">
        <div>
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="price">Price</Label>
          <Input
            id="price"
            type="number"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="category">Category</Label>
          <select
            id="category"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2"
            value={formData.category_id}
            onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
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
          onClick={() => onSubmit(formData)}
          disabled={!formData.name || !formData.price || !formData.category_id}
          className="w-full"
        >
          {initialData ? 'Update Service' : 'Add Service'}
        </Button>
      </div>
    </DialogContent>
  );
};