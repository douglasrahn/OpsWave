import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { TableEditor } from "@/components/raw-data/TableEditor";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Database, FileSpreadsheet, Users, Settings } from "lucide-react";
import { collection, getDocs, query, collectionGroup, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getCurrentClientId } from "@/lib/auth";

// List of available Firebase tables with improved metadata
const TABLES = [
  { 
    id: "campaigns", 
    name: "Campaigns", 
    icon: FileSpreadsheet,
    description: "Campaign configurations and basic info"
  },
  { 
    id: "campaign_entries", 
    name: "Campaign Entries", 
    icon: FileSpreadsheet,
    description: "Individual campaign contact records and status"
  },
  { 
    id: "clients", 
    name: "Clients", 
    icon: Users,
    description: "Client organization information"
  },
  { 
    id: "scenarios", 
    name: "Scenarios", 
    icon: Settings,
    description: "Automation scenario configurations"
  }
];

export default function RawDataPage() {
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [tableData, setTableData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const fetchTableData = async (tableName: string) => {
    setIsLoading(true);
    try {
      const clientId = getCurrentClientId();
      if (!clientId) {
        throw new Error("No client ID found");
      }

      let data: any[] = [];

      if (tableName === 'campaign_entries') {
        // Use collectionGroup to query all entries across all campaigns for this client
        const entriesQuery = query(
          collectionGroup(db, 'entries'),
          where('clientId', '==', clientId)
        );
        const querySnapshot = await getDocs(entriesQuery);
        data = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
      } else {
        const querySnapshot = await getDocs(collection(db, tableName));
        data = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
      }

      setTableData(data);
      setSelectedTable(tableName);
    } catch (error) {
      console.error("Error fetching table data:", error);
      toast({
        title: "Error",
        description: "Failed to fetch table data",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    if (selectedTable) {
      fetchTableData(selectedTable);
    }
  };

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Raw Data Editor</h1>
        <p className="text-muted-foreground mt-2">
          Administrative interface for managing database tables
        </p>
      </div>

      {!selectedTable ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {TABLES.map(table => (
            <Card
              key={table.id}
              className="cursor-pointer hover:bg-accent/50 transition-colors"
              onClick={() => fetchTableData(table.id)}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {table.name}
                </CardTitle>
                <table.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  {table.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold">{
              TABLES.find(t => t.id === selectedTable)?.name
            } Table</h2>
            <div className="flex gap-2">
              <button
                className="text-sm text-muted-foreground hover:text-foreground"
                onClick={() => setSelectedTable(null)}
              >
                ← Back to Tables
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <TableEditor
              tableName={selectedTable}
              data={tableData}
              onRefresh={handleRefresh}
            />
          )}
        </div>
      )}
    </DashboardLayout>
  );
}