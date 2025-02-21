import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useState, useEffect } from "react";
import { PhoneCall, Clock, Loader2, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { doc, updateDoc, collection, query, where, getDocs } from "firebase/firestore";
import { useQuery } from "@tanstack/react-query";
import { toggleScenario } from "@/lib/make-api";
import { getCurrentClientId } from "@/lib/auth";
import { useLocation } from "wouter";

interface ScenarioSettings {
  clientId: string;
  serviceId: string;
  scenarioId: string;
  status: string;
  name?: string;
  nextExec?: string;
}

async function getScenarioStatus(scenarioId: string): Promise<{scenario: {status: string, name: string, nextExec: string}}> {
  // Replace with your actual API call to get scenario status
  // This is a placeholder, adapt to your actual API
  const response = await fetch(`/api/scenario/${scenarioId}/status`);
  if (!response.ok) {
    throw new Error(`Make.com API request failed with status ${response.status}`);
  }
  return response.json();
}

function isValidScenarioId(id: string): boolean {
  return /^\d+$/.test(id);
}

export default function CollectionsDashboardPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { toast } = useToast();
  const [_, setLocation] = useLocation();

  const { data: scenarioSettings, refetch, isError, error } = useQuery<ScenarioSettings>({
    queryKey: ["scenarioSettings"],
    queryFn: async () => {
      console.log("[Dashboard] Fetching scenario settings...");

      const clientId = getCurrentClientId();
      if (!clientId) {
        console.error("[Dashboard] No client ID found in session");
        setLocation("/login");
        throw new Error("Please log in again");
      }

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
      const scenarioData = scenarioDoc.data();
      console.log("[Dashboard] Fetched scenario data:", scenarioData);

      if (!scenarioData.scenarioId || !scenarioData.serviceId || !scenarioData.clientId) {
        console.error("[Dashboard] Missing required fields in scenario data:", scenarioData);
        throw new Error("Invalid scenario configuration");
      }

      // Get current status from Make.com API
      try {
        const makeStatus = await getScenarioStatus(scenarioData.scenarioId);
        console.log("[Dashboard] Make.com status:", makeStatus);

        // Update status if it doesn't match
        if (makeStatus.scenario.status === 'active' && scenarioData.status !== 'active' ||
            makeStatus.scenario.status !== 'active' && scenarioData.status === 'active') {
          const newStatus = makeStatus.scenario.status === 'active' ? 'active' : 'inactive';
          console.log(`[Dashboard] Updating Firebase status to match Make.com: ${newStatus}`);
          await updateDoc(doc(db, "scenarios", scenarioDoc.id), {
            status: newStatus
          });
          scenarioData.status = newStatus;
        }

        // Include additional Make.com data
        scenarioData.name = makeStatus.scenario.name;
        scenarioData.nextExec = makeStatus.scenario.nextExec;
      } catch (error) {
        console.error("[Dashboard] Error fetching Make.com status:", error);
        // Continue with Firebase data if Make.com API fails
      }

      return scenarioData as ScenarioSettings;
    },
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  const handleRefreshStatus = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
      toast({
        title: "Status Updated",
        description: "Scenario status has been refreshed"
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to refresh status";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleToggleService = async (checked: boolean) => {
    if (!scenarioSettings?.scenarioId) {
      console.error("[Dashboard] No scenario ID found. Current settings:", scenarioSettings);
      toast({
        title: "Configuration Error",
        description: "No scenario ID found. Please check your Make.com configuration.",
        variant: "destructive"
      });
      return;
    }

    if (!isValidScenarioId(scenarioSettings.scenarioId)) {
      console.error("[Dashboard] Invalid scenario ID format:", scenarioSettings.scenarioId);
      toast({
        title: "Configuration Error",
        description: "Invalid scenario ID format. Please verify your Make.com scenario ID.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      console.log(`[Dashboard] Attempting to ${checked ? 'activate' : 'deactivate'} scenario ${scenarioSettings.scenarioId}`);

      const success = await toggleScenario(scenarioSettings.scenarioId, checked);
      console.log('[Dashboard] Toggle scenario result:', success);

      if (success) {
        // Update Firebase status
        const scenarioQuery = query(
          collection(db, "scenarios"),
          where("clientId", "==", scenarioSettings.clientId),
          where("serviceId", "==", "CollectionReminders")
        );
        const scenarioSnapshot = await getDocs(scenarioQuery);

        if (!scenarioSnapshot.empty) {
          const newStatus = checked ? 'active' : 'inactive';
          console.log(`[Dashboard] Updating Firebase status to: ${newStatus}`);

          await updateDoc(doc(db, "scenarios", scenarioSnapshot.docs[0].id), {
            status: newStatus
          });
        }

        toast({
          title: checked ? "Service Resumed" : "Service Paused",
          description: checked
            ? "AI calling agent is now active"
            : "AI calling agent has been paused"
        });
      }
    } catch (error) {
      console.error("[Dashboard] Error toggling service:", error);
      const errorMessage = error instanceof Error
        ? error.message
        : "Network error while updating service. Please check your connection and try again.";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

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

  if (isError) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <h1 className="text-2xl font-bold text-red-600">Error Loading Dashboard</h1>
          <p className="mt-2 text-gray-600">
            {error instanceof Error && error.message.includes("API token")
              ? "Unable to connect to Make.com. Please check your API token configuration."
              : "Unable to load scenario settings. Please try refreshing the page."}
          </p>
          <p className="mt-4 text-sm text-muted-foreground">
            If this issue persists, please contact support with the following error details:
            <br />
            {error instanceof Error ? error.message : "Unknown error"}
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
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-semibold">
                {scenarioSettings?.name || "AI Calling Agent"}
              </h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleRefreshStatus}
                disabled={isRefreshing}
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </Button>
            </div>
            <div className="flex items-center space-x-4">
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">
                    Updating status...
                  </span>
                </>
              ) : (
                <>
                  <span className={`text-sm ${scenarioSettings?.status !== 'active' ? "text-muted-foreground" : ""}`}>
                    {scenarioSettings?.status === 'active' ? "ACTIVE" : "PAUSED"}
                  </span>
                  <Switch
                    checked={scenarioSettings?.status === 'active'}
                    onCheckedChange={handleToggleService}
                    className="scale-125"
                    disabled={isLoading}
                  />
                </>
              )}
            </div>
            <p className="text-sm text-muted-foreground text-center max-w-md">
              Toggle this switch to pause or resume the AI calling agent.
              When paused, no new calls will be initiated.
            </p>
            {scenarioSettings?.nextExec && (
              <p className="text-sm text-muted-foreground">
                Next execution: {new Date(scenarioSettings.nextExec).toLocaleString()}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}