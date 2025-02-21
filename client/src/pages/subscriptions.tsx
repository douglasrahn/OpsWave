import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { SubscriptionTable } from "@/components/subscriptions/SubscriptionTable";
import { useQuery } from "@tanstack/react-query";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";

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
      const querySnapshot = await getDocs(collection(db, "clients"));
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data() as Omit<Client, 'id'>
      }));
    }
  });

  const handleToggleSubscription = async (clientId: string, service: string, value: boolean) => {
    try {
      await updateDoc(doc(db, "clients", clientId), {
        [service]: value
      });
      toast({
        title: "Subscription updated successfully"
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