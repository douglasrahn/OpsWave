import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { TableEditor } from "@/components/raw-data/TableEditor";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Database, FileSpreadsheet, Users, Settings, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

// List of available tables with improved metadata
const TABLES = [
  { 
    id: "clients", 
    name: "Clients", 
    icon: Users,
    description: "Client organization information"
  },
  { 
    id: "campaigns", 
    name: "Campaigns", 
    icon: FileSpreadsheet,
    description: "Campaign data and configurations"
  }
];

export default function RawDataPage() {
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [tableData, setTableData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const { data: clientsData } = useQuery({
    queryKey: ['/api/clients'],
    queryFn: async () => {
      const response = await fetch('/api/clients');
      if (!response.ok) {
        throw new Error('Failed to fetch clients');
      }
      return response.json();
    }
  });

  const loadTableData = (tableName: string) => {
    setIsLoading(true);
    try {
      let data: any[] = [];

      // Load data based on table name
      switch (tableName) {
        case "clients":
          if (clientsData) {
            data = clientsData.clients.map(client => ({
              id: client.clientId,
              ...client
            }));
          }
          break;
        case "campaigns":
          // We'll implement this when we add campaigns
          data = [];
          break;
        default:
          console.error("Unknown table:", tableName);
          return;
      }

      setTableData(data);
      setSelectedTable(tableName);
    } catch (error) {
      console.error("Error loading table data:", error);
      toast({
        title: "Error",
        description: "Failed to load table data",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Data Editor</h1>
        <p className="text-muted-foreground mt-2">
          Administrative interface for managing data
        </p>
      </div>

      {!selectedTable ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TABLES.map(table => (
            <Card
              key={table.id}
              className="cursor-pointer hover:bg-accent/50 transition-colors"
              onClick={() => loadTableData(table.id)}
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
              onRefresh={() => loadTableData(selectedTable)}
            />
          )}
        </div>
      )}
    </DashboardLayout>
  );
}