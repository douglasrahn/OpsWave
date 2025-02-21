import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useState, useEffect } from "react";
import { PhoneCall, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useQuery } from "@tanstack/react-query";

interface ClientSettings {
  collectionsEnabled: boolean;
  collectionsScenarioId: string;
}

export default function CollectionsDashboardPage() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Fetch client settings
  const { data: clientSettings, refetch } = useQuery<ClientSettings>({
    queryKey: ["clientSettings"],
    queryFn: async () => {
      // For now, we're using the default client ID "0"
      const docRef = doc(db, "clients", "0");
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        throw new Error("Client settings not found");
      }
      return docSnap.data() as ClientSettings;
    }
  });

  const handleToggleService = async (checked: boolean) => {
    setIsLoading(true);
    try {
      await updateDoc(doc(db, "clients", "0"), {
        collectionsEnabled: checked
      });

      await refetch(); // Refresh the data

      toast({
        title: checked ? "Service Resumed" : "Service Paused",
        description: checked 
          ? "AI calling agent is now active" 
          : "AI calling agent has been paused"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update service status",
        variant: "destructive"
      });
    } finally {
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
              <span className={`text-sm ${!clientSettings?.collectionsEnabled ? "text-muted-foreground" : ""}`}>
                {clientSettings?.collectionsEnabled ? "ACTIVE" : "PAUSED"}
              </span>
              <Switch
                checked={clientSettings?.collectionsEnabled ?? false}
                onCheckedChange={handleToggleService}
                className="scale-125"
                disabled={isLoading}
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