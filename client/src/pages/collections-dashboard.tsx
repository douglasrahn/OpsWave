import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useState } from "react";
import { PhoneCall, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function CollectionsDashboardPage() {
  const [isActive, setIsActive] = useState(true);
  const { toast } = useToast();

  const handleToggleService = (checked: boolean) => {
    setIsActive(checked);
    toast({
      title: checked ? "Service Resumed" : "Service Paused",
      description: checked 
        ? "AI calling agent is now active" 
        : "AI calling agent has been paused"
    });
  };

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Collection Reminders Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Monitor and control your collection reminder service
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Calls Completed Today
            </CardTitle>
            <PhoneCall className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">28</div>
            <p className="text-xs text-muted-foreground">
              +4 from yesterday
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Calls Remaining
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">15</div>
            <p className="text-xs text-muted-foreground">
              Scheduled for today
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-8">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center space-y-4">
            <h2 className="text-xl font-semibold">AI Calling Agent</h2>
            <div className="flex items-center space-x-4">
              <span className={`text-sm ${!isActive ? "text-muted-foreground" : ""}`}>
                {isActive ? "ACTIVE" : "PAUSED"}
              </span>
              <Switch
                checked={isActive}
                onCheckedChange={handleToggleService}
                className="scale-125"
              />
            </div>
            <p className="text-sm text-muted-foreground text-center max-w-md">
              Toggle this switch to pause or resume the AI calling agent. 
              When paused, no new calls will be initiated.
            </p>
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
