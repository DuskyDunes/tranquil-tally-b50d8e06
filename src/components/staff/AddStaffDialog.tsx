import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { UserPlus } from "lucide-react";

const addStaffSchema = z.object({
  email: z.string().email(),
  full_name: z.string().min(1, "Full name is required"),
});

interface AddStaffDialogProps {
  onSubmit: (values: z.infer<typeof addStaffSchema>) => void;
}

export const AddStaffDialog = ({ onSubmit }: AddStaffDialogProps) => {
  const form = useForm({
    resolver: zodResolver(addStaffSchema),
    defaultValues: {
      email: "",
      full_name: "",
    },
  });

  return (
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
  );
};