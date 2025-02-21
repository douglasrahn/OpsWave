import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useState, useEffect } from "react";
import { PhoneCall, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { doc, updateDoc, collection, query, where, getDocs } from "firebase/firestore";
import { useQuery } from "@tanstack/react-query";
import { toggleScenario, getScenarioStatus } from "@/lib/make-api";
import { getCurrentClientId } from "@/lib/auth";
import { useLocation } from "wouter";

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
  const [_, setLocation] = useLocation();

  // Query scenario settings
  const { data: scenarioSettings, refetch, isError, error } = useQuery<ScenarioSettings>({
    queryKey: ["scenarioSettings"],
    queryFn: async () => {
      console.log("Fetching scenario settings...");

      const clientId = getCurrentClientId();
      if (!clientId) {
        console.error("No client ID found in session");
        setLocation("/login"); // Redirect to login if no client ID
        throw new Error("Please log in again");
      }

      // Get scenario document using client ID
      const scenarioQuery = query(
        collection(db, "scenarios"),
        where("clientId", "==", clientId),
        where("serviceId", "==", "CollectionReminders")
      );
      const scenarioSnapshot = await getDocs(scenarioQuery);

      if (scenarioSnapshot.empty) {
        throw new Error("No scenario found for this client");
      }

      const scenarioDoc = scenarioSnapshot.docs[0];
      const data = scenarioDoc.data() as ScenarioSettings;
      console.log("Fetched scenario settings:", data);

      // Verify required fields
      if (!data.scenarioId || !data.serviceId || !data.clientId) {
        console.error("Missing required fields in scenario data:", data);
        throw new Error("Invalid scenario configuration");
      }

      return data;
    }
  });

  // Display error toast if query fails
  useEffect(() => {
    if (isError) {
      const errorMessage = error instanceof Error ? error.message : "Failed to load scenario settings";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    }
  }, [isError, error, toast]);

  const handleToggleService = async (checked: boolean) => {
    if (!scenarioSettings?.scenarioId) {
      console.error("No scenario ID found. Current settings:", scenarioSettings);
      toast({
        title: "Error",
        description: "No scenario ID found",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      console.log(`Toggling scenario ${scenarioSettings.scenarioId} to ${checked ? 'active' : 'inactive'}`);

      // Toggle the scenario in Make.com
      const success = await toggleScenario(scenarioSettings.scenarioId, checked);
      console.log('Toggle scenario result:', success);

      if (success) {
        // Update status in Firebase
        const scenarioQuery = query(
          collection(db, "scenarios"),
          where("clientId", "==", scenarioSettings.clientId),
          where("serviceId", "==", "CollectionReminders")
        );
        const scenarioSnapshot = await getDocs(scenarioQuery);

        if (!scenarioSnapshot.empty) {
          await updateDoc(doc(db, "scenarios", scenarioSnapshot.docs[0].id), {
            status: checked ? "active" : "inactive"
          });
        }

        // Check scenario status after a short delay
        setTimeout(async () => {
          try {
            const status = await getScenarioStatus(scenarioSettings.scenarioId);
            console.log("Updated scenario status:", status);
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
            const errorMessage = error instanceof Error ? error.message : "Could not verify scenario status";
            toast({
              title: "Warning",
              description: errorMessage,
              variant: "destructive"
            });
          } finally {
            setIsLoading(false);
          }
        }, 3000);
      }
    } catch (error) {
      console.error("Error toggling service:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to update service status";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
      setIsLoading(false);
    }
  };

  // Log initial scenario settings when component mounts
  useEffect(() => {
    console.log("Initial scenario settings:", scenarioSettings);
  }, [scenarioSettings]);

  if (isError) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <h1 className="text-2xl font-bold text-red-600">Error Loading Dashboard</h1>
          <p className="mt-2 text-gray-600">
            Unable to load scenario settings. Please try refreshing the page.
          </p>
        </div>
      </DashboardLayout>
    );
  }

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