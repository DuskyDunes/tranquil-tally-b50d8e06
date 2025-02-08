
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
    <Card className="p-4">
      <div className="flex flex-col gap-3">
        <div className="flex justify-between items-start gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold truncate">
              {staff.full_name || 'No name set'}
            </h3>
            <p className="text-sm text-gray-500 truncate">{staff.email}</p>
          </div>
          {isAdmin && (
            <Button
              variant="destructive"
              size="icon"
              className="shrink-0"
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
        
        <div className="flex flex-col gap-2">
          <p className="text-sm text-gray-500 capitalize">{staff.role}</p>
          <Badge 
            variant={staff.approval_status === 'approved' ? 'default' : 'secondary'}
            className="w-fit capitalize"
          >
            {staff.approval_status}
          </Badge>
        </div>

        {isAdmin && staff.approval_status === 'pending' && (
          <div className="flex flex-wrap gap-2 mt-2">
            <Button 
              size="sm" 
              className="flex-1"
              onClick={() => onUpdateStatus(staff.id, 'approved')}
            >
              Approve
            </Button>
            <Button 
              size="sm" 
              variant="destructive"
              className="flex-1"
              onClick={() => onUpdateStatus(staff.id, 'rejected')}
            >
              Reject
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
};
