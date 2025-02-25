import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Edit2, Save, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { doc, updateDoc, getDocs, collection, query, where, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { CampaignDataEditor } from "./CampaignDataEditor";
import { getCurrentClientId } from "@/lib/auth";

interface TableEditorProps {
  tableName: string;
  data: any[];
  onRefresh: () => void;
}

export function TableEditor({ tableName, data, onRefresh }: TableEditorProps) {
  const [editingRow, setEditingRow] = useState<string | null>(null);
  const [editedData, setEditedData] = useState<Record<string, any> | null>(null);
  const { toast } = useToast();

  // Special handling for campaigndata table
  if (tableName === 'campaigndata') {
    const clientId = getCurrentClientId();
    if (!clientId) {
      return (
        <div className="text-center py-8 text-destructive">
          Error: No client ID found. Please ensure you are logged in.
        </div>
      );
    }

    // For each campaign associated with this client, get the client data
    const fetchClientData = async () => {
      try {
        console.log("Looking up client:", clientId);

        // Query campaigns for this client
        const campaignsRef = collection(db, "campaigns");
        const q = query(campaignsRef, where("clientId", "==", clientId));
        const campaignSnapshot = await getDocs(q);

        if (campaignSnapshot.empty) {
          console.log("No campaigns found for client:", clientId);
          return [];
        }

        const allEntries = [];
        // For each campaign, get its client data
        for (const campaignDoc of campaignSnapshot.docs) {
          const campaignId = campaignDoc.id;
          console.log("Processing campaign:", campaignId);

          const clientDataRef = doc(db, `campaigndata/${campaignId}/clientdata`, clientId);
          const clientDataSnap = await getDoc(clientDataRef);

          if (clientDataSnap.exists()) {
            const entries = clientDataSnap.data().entries || [];
            // Add campaignId to each entry
            const entriesWithCampaignId = entries.map((entry: any) => ({
              ...entry,
              campaignId
            }));
            allEntries.push(...entriesWithCampaignId);
          }
        }

        console.log("Total entries found:", allEntries.length);
        return allEntries;
      } catch (error) {
        console.error("Error fetching client data:", error);
        throw error;
      }
    };

    return (
      <CampaignDataEditor
        clientId={clientId}
        data={data}
        onRefresh={onRefresh}
      />
    );
  }

  // Handle regular tables
  const headers = data.length > 0 ? Object.keys(data[0]).filter(key => key !== 'id') : [];

  const handleEdit = (row: Record<string, any>) => {
    setEditingRow(row.id);
    setEditedData(row);
  };

  const handleCancel = () => {
    setEditingRow(null);
    setEditedData(null);
  };

  const handleSave = async (id: string) => {
    try {
      const docRef = doc(db, tableName, id);
      const updateData = { ...editedData };
      delete updateData.id; // Remove id from update data

      await updateDoc(docRef, updateData);

      toast({
        title: "Success",
        description: "Record updated successfully"
      });

      setEditingRow(null);
      setEditedData(null);
      onRefresh();
    } catch (error) {
      console.error("Error updating document:", error);
      toast({
        title: "Error",
        description: "Failed to update record",
        variant: "destructive"
      });
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setEditedData((prev: Record<string, any> | null) => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]">Actions</TableHead>
            {headers.map(header => (
              <TableHead key={header}>{header}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map(row => (
            <TableRow key={row.id}>
              <TableCell>
                {editingRow === row.id ? (
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleSave(row.id)}
                    >
                      <Save className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleCancel}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(row)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                )}
              </TableCell>
              {headers.map(header => (
                <TableCell key={`${row.id}-${header}`}>
                  {editingRow === row.id ? (
                    <Input
                      value={editedData?.[header] ?? ''}
                      onChange={(e) => handleInputChange(header, e.target.value)}
                    />
                  ) : (
                    row[header]
                  )}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}