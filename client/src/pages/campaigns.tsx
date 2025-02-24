import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useQuery } from "@tanstack/react-query";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { NewCampaignDialog } from "@/components/campaigns/NewCampaignDialog";
import { CampaignTable } from "@/components/campaigns/CampaignTable";
import { Loader2 } from "lucide-react";

interface FirebaseCampaign {
  id: string;
  campaignName: string;
  companyName?: string;
  contactFirstName?: string | null;
  contactLastName?: string | null;
  contactPhone?: string | null;
  pastDueAmount?: number | null;
  createdAt: string;
}

export default function CampaignsPage() {
  const { data: campaigns, isLoading, error } = useQuery<FirebaseCampaign[]>({
    queryKey: ["campaigns"],
    queryFn: async () => {
      const campaignsQuery = query(
        collection(db, "campaigns"),
        orderBy("createdAt", "desc")
      );
      const querySnapshot = await getDocs(campaignsQuery);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as FirebaseCampaign[];
    }
  });

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[calc(100vh-12rem)]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="p-6 text-center">
          <h2 className="text-2xl font-bold text-destructive">Error Loading Campaigns</h2>
          <p className="mt-2 text-muted-foreground">
            {error instanceof Error ? error.message : "Failed to load campaigns"}
          </p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Campaign Management</h1>
          <p className="text-muted-foreground mt-2">
            Create and manage your collection campaigns
          </p>
        </div>
        <NewCampaignDialog />
      </div>

      <CampaignTable 
        campaigns={campaigns ?? []}
      />
    </DashboardLayout>
  );
}