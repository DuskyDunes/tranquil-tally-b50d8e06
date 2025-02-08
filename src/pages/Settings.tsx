
import { Card } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";

const Settings = () => {
  const { user } = useAuth();

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-6 space-y-6">
      <h1 className="text-2xl md:text-3xl font-semibold mb-6">Settings</h1>
      <Card className="p-4 md:p-6 space-y-4">
        <h2 className="text-xl font-semibold mb-4">Account Information</h2>
        <div className="space-y-3">
          <div className="flex flex-col md:flex-row md:items-center gap-2">
            <span className="font-medium min-w-32">Email:</span>
            <span className="text-gray-600">{user?.email}</span>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Settings;
