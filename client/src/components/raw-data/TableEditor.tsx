import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Edit2, Save, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { doc, updateDoc, getDocs, collection, query, where } from "firebase/firestore";
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

    // Get all campaigns for this client and their associated data
    const fetchClientCampaignData = async () => {
      // First get all campaigns for this client
      const campaignsRef = collection(db, "campaigns");
      const q = query(campaignsRef, where("clientID", "==", clientId));
      const campaignsSnapshot = await getDocs(q);

      let allEntries = [];
      // For each campaign, get its client data
      for (const campaignDoc of campaignsSnapshot.docs) {
        const campaignId = campaignDoc.id;
        const clientDataRef = collection(db, `campaigndata/${campaignId}/clientdata`);
        const clientDataSnapshot = await getDocs(clientDataRef);

        // Get the client's data for this campaign
        const clientData = clientDataSnapshot.docs
          .find(doc => doc.id === clientId);

        if (clientData) {
          allEntries.push(clientData.data());
        }
      }

      return allEntries;
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
    setEditedData({ ...row });
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
      onRefresh(); // Refresh the data
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