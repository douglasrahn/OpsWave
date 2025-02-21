import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useState, useEffect } from "react";
import { PhoneCall, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useQuery } from "@tanstack/react-query";
import { toggleScenario, getScenarioStatus } from "@/lib/make-api";

interface ScenarioSettings {
  clientId: string;
  serviceId: string;
  scenarioId: string;
  status: string;
}

export default function CollectionsDashboardPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [scenarioStatus, setScenarioStatus] = useState<string>("");
  const { toast } = useToast();

  const { data: scenarioSettings, refetch } = useQuery<ScenarioSettings>({
    queryKey: ["scenarioSettings"],
    queryFn: async () => {
      const docRef = doc(db, "scenarios", "0");
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        throw new Error("Scenario settings not found");
      }
      return docSnap.data() as ScenarioSettings;
    }
  });

  const handleToggleService = async (checked: boolean) => {
    if (!scenarioSettings?.scenarioId) {
      toast({
        title: "Error",
        description: "No scenario ID found",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      // Toggle the scenario in Make.com
      await toggleScenario(scenarioSettings.scenarioId, checked);

      // Update status in Firebase
      await updateDoc(doc(db, "scenarios", "0"), {
        status: checked ? "active" : "inactive"
      });

      // Wait 3 seconds and check status
      setTimeout(async () => {
        try {
          const status = await getScenarioStatus(scenarioSettings.scenarioId);
          setScenarioStatus(status.status);

          await refetch(); // Refresh the data

          toast({
            title: checked ? "Service Resumed" : "Service Paused",
            description: checked 
              ? "AI calling agent is now active" 
              : "AI calling agent has been paused"
          });
        } catch (error) {
          console.error("Error checking scenario status:", error);
        } finally {
          setIsLoading(false);
        }
      }, 3000);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update service status",
        variant: "destructive"
      });
      setIsLoading(false);
    }
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
              <span className={`text-sm ${scenarioSettings?.status !== 'active' ? "text-muted-foreground" : ""}`}>
                {scenarioSettings?.status === 'active' ? "ACTIVE" : "PAUSED"}
              </span>
              <Switch
                checked={scenarioSettings?.status === 'active'}
                onCheckedChange={handleToggleService}
                className="scale-125"
                disabled={isLoading}
              />
            </div>
            <p className="text-sm text-muted-foreground text-center max-w-md">
              Toggle this switch to pause or resume the AI calling agent. 
              When paused, no new calls will be initiated.
            </p>
            {scenarioStatus && (
              <p className="text-sm text-muted-foreground">
                Current scenario status: {scenarioStatus}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}