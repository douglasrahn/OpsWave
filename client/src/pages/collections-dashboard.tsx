import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useState, useEffect } from "react";
import { PhoneCall, Clock, Loader2, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { useQuery } from "@tanstack/react-query";
import { toggleScenario, getScenarioStatus, type ScenarioResponse } from "@/lib/make-api";
import { getCurrentClientId } from "@/lib/auth";
import { useLocation } from "wouter";

// Only store configuration, no status
interface ScenarioSettings {
  clientId: string;
  serviceId: string;
  scenarioId: string;
}

function isValidScenarioId(id: string): boolean {
  return /^\d+$/.test(id);
}

export default function CollectionsDashboardPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { toast } = useToast();
  const [_, setLocation] = useLocation();

  const { data: scenarioData, refetch, isError, error } = useQuery<{
    settings: ScenarioSettings;
    status: ScenarioResponse;
  }>({
    queryKey: ["scenarioSettings"],
    queryFn: async () => {
      console.log("[Dashboard] Fetching scenario settings...");

      const clientId = getCurrentClientId();
      if (!clientId) {
        console.error("[Dashboard] No client ID found in session");
        setLocation("/login");
        throw new Error("Please log in again");
      }

      // Only fetch configuration from Firebase
      const scenarioQuery = query(
        collection(db, "scenarios"),
        where("clientId", "==", clientId),
        where("serviceId", "==", "CollectionReminders")
      );
      const scenarioSnapshot = await getDocs(scenarioQuery);

      if (scenarioSnapshot.empty) {
        throw new Error("No scenario found for this client");
      }

      // Extract only the configuration fields
      const settings = {
        clientId,
        serviceId: "CollectionReminders",
        scenarioId: scenarioSnapshot.docs[0].data().scenarioId
      } as ScenarioSettings;

      console.log("[Dashboard] Fetched scenario config:", settings);

      if (!settings.scenarioId) {
        console.error("[Dashboard] Missing scenario ID in config:", settings);
        throw new Error("Invalid scenario configuration");
      }

      // Get live status from Make.com API
      const status = await getScenarioStatus(settings.scenarioId);
      console.log("[Dashboard] Make.com API status:", status);

      return { settings, status };
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
    if (!scenarioData?.settings.scenarioId) {
      console.error("[Dashboard] No scenario ID found. Current settings:", scenarioData);
      toast({
        title: "Configuration Error",
        description: "No scenario ID found. Please check your Make.com configuration.",
        variant: "destructive"
      });
      return;
    }

    if (!isValidScenarioId(scenarioData.settings.scenarioId)) {
      console.error("[Dashboard] Invalid scenario ID format:", scenarioData.settings.scenarioId);
      toast({
        title: "Configuration Error",
        description: "Invalid scenario ID format. Please verify your Make.com scenario ID.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      console.log(`[Dashboard] Attempting to ${checked ? 'activate' : 'deactivate'} scenario ${scenarioData.settings.scenarioId}`);

      await toggleScenario(scenarioData.settings.scenarioId, checked);
      await refetch(); // Refresh the status after toggling

      toast({
        title: checked ? "Service Resumed" : "Service Paused",
        description: checked
          ? "AI calling agent is now active"
          : "AI calling agent has been paused"
      });
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
                {scenarioData?.status.scenario.name || "AI Calling Agent"}
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
                  <span className={`text-sm ${!scenarioData?.status.scenario.isActive ? "text-muted-foreground" : ""}`}>
                    {scenarioData?.status.scenario.isActive ? "ACTIVE" : "PAUSED"}
                  </span>
                  <Switch
                    checked={scenarioData?.status.scenario.isActive}
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
            {scenarioData?.status.scenario.nextExec && (
              <p className="text-sm text-muted-foreground">
                Next execution: {new Date(scenarioData.status.scenario.nextExec).toLocaleString()}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}