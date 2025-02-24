import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { NewCampaignDialog } from "@/components/campaigns/NewCampaignDialog";
import { CampaignTable } from "@/components/campaigns/CampaignTable";

interface FirebaseCampaign {
  id: string;
  clientId: string;
  campaignName: string;
  contactFirstName: string | null;
  contactLastName: string | null;
  contactPhone: string | null;
  companyName: string;
  companyAddress1: string | null;
  companyAddress2: string | null;
  companyCity: string | null;
  companyState: string | null;
  companyZip: string | null;
  companyPhone: string | null;
  pastDueAmount: number;
  previousNotes: string | null;
  log: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function CampaignsPage() {
  const { data: campaigns, isLoading } = useQuery<FirebaseCampaign[]>({
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
    return <div>Loading...</div>;
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