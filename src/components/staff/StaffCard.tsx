import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserMinus } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface StaffCardProps {
  staff: {
    id: string;
    full_name: string | null;
    email: string;
    role: string;
    approval_status: string;
  };
  isAdmin: boolean;
  onRemove: (id: string) => void;
  onUpdateStatus: (id: string, status: string) => void;
}

export const StaffCard = ({ staff, isAdmin, onRemove, onUpdateStatus }: StaffCardProps) => {
  return (
    <Card className="p-6">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-semibold">
            {staff.full_name || 'No name set'}
          </h3>
          <p className="text-sm text-gray-500">{staff.email}</p>
          <p className="text-sm text-gray-500 mt-2 capitalize">{staff.role}</p>
          <div className="mt-2">
            <Badge 
              variant={staff.approval_status === 'approved' ? 'default' : 'secondary'}
              className="capitalize"
            >
              {staff.approval_status}
            </Badge>
          </div>
          {isAdmin && staff.approval_status === 'pending' && (
            <div className="mt-2 space-x-2">
              <Button 
                size="sm" 
                onClick={() => onUpdateStatus(staff.id, 'approved')}
              >
                Approve
              </Button>
              <Button 
                size="sm" 
                variant="destructive"
                onClick={() => onUpdateStatus(staff.id, 'rejected')}
              >
                Reject
              </Button>
            </div>
          )}
        </div>
        {isAdmin && (
          <Button
            variant="destructive"
            size="icon"
            onClick={() => {
              if (window.confirm('Are you sure you want to remove this staff member?')) {
                onRemove(staff.id);
              }
            }}
          >
            <UserMinus className="h-4 w-4" />
          </Button>
        )}
      </div>
    </Card>
  );
};