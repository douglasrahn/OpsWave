import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { SubscriptionTable } from "@/components/subscriptions/SubscriptionTable";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import clientsData from "@/data/clients.json";

interface Client {
  id: string;
  companyName: string;
  url: string;
  collections: boolean;
  salesQualifier: boolean;
  survey: boolean;
}

export default function SubscriptionsPage() {
  const { toast } = useToast();

  const { data: clients, isLoading } = useQuery<Client[]>({
    queryKey: ["clients"],
    queryFn: async () => {
      // Transform local data to match the interface
      return clientsData.clients.map(client => ({
        id: client.clientId,
        companyName: client.companyName,
        url: client.url,
        collections: false,
        salesQualifier: false,
        survey: false
      }));
    }
  });

  const handleToggleSubscription = async (clientId: string, service: string, value: boolean) => {
    try {
      // For now, just show a toast since we're using local storage
      toast({
        title: "Note",
        description: "Subscription updates will be implemented in the next phase"
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      toast({
        title: "Error updating subscription",
        description: errorMessage,
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Subscription Management</h1>
        <p className="text-muted-foreground mt-2">
          Manage client subscriptions and services
        </p>
      </div>

      <SubscriptionTable 
        clients={clients ?? []}
        onToggleSubscription={handleToggleSubscription}
      />
    </DashboardLayout>
  );
}