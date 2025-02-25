import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { collection, doc, setDoc, deleteDoc, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Trash2 } from "lucide-react";

interface CampaignEntry {
  id: number;
  status: string;
  contactFirstName: string;
  contactLastName: string;
  contactPhone: string;
  companyName: string;
  companyAddress1: string;
  companyAddress2: string;
  companyCity: string;
  companyState: string;
  companyZip: string;
  companyPhone: string;
  pastDueAmount: number | null;
  previousNotes: string;
  log: string;
}

interface Props {
  clientId: string;
  data: CampaignEntry[];
  onRefresh: () => void;
}

export function CampaignDataEditor({ clientId, data, onRefresh }: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editedData, setEditedData] = useState<Partial<CampaignEntry>>({});
  const { toast } = useToast();

  // First, get all campaigns for this client
  const fetchCampaignsForClient = async () => {
    const campaignsRef = collection(db, "campaigns");
    const q = query(campaignsRef, where("clientID", "==", clientId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  };

  const handleEdit = (entry: CampaignEntry) => {
    setEditingId(entry.id);
    setEditedData(entry);
  };

  const handleSave = async () => {
    if (!editingId) return;

    setIsLoading(true);
    try {
      // Get campaigns for this client
      const campaigns = await fetchCampaignsForClient();

      // For now, we'll use the first campaign (you might want to add campaign selection)
      if (campaigns.length === 0) {
        throw new Error("No campaigns found for this client");
      }

      const campaignId = campaigns[0].id;
      const clientDataRef = doc(db, `campaigndata/${campaignId}/clientdata`, clientId);

      await setDoc(clientDataRef, {
        ...editedData,
        id: editingId // Preserve the original ID
      });

      toast({
        title: "Changes saved successfully"
      });

      setEditingId(null);
      setEditedData({});
      onRefresh();
    } catch (error) {
      console.error("Error saving changes:", error);
      toast({
        title: "Error",
        description: "Failed to save changes",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (entry: CampaignEntry) => {
    if (!confirm("Are you sure you want to delete this entry?")) return;

    setIsLoading(true);
    try {
      const campaigns = await fetchCampaignsForClient();
      if (campaigns.length === 0) {
        throw new Error("No campaigns found for this client");
      }

      const campaignId = campaigns[0].id;
      const clientDataRef = doc(db, `campaigndata/${campaignId}/clientdata`, clientId);
      await deleteDoc(clientDataRef);

      toast({
        title: "Entry deleted successfully"
      });

      onRefresh();
    } catch (error) {
      console.error("Error deleting entry:", error);
      toast({
        title: "Error",
        description: "Failed to delete entry",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdd = async () => {
    setIsLoading(true);
    try {
      const campaigns = await fetchCampaignsForClient();
      if (campaigns.length === 0) {
        throw new Error("No campaigns found for this client");
      }

      const campaignId = campaigns[0].id;
      const clientDataRef = collection(db, `campaigndata/${campaignId}/clientdata`);

      // Calculate next ID based on existing entries
      const nextId = data.length > 0 ? Math.max(...data.map(entry => entry.id)) + 1 : 0;

      const newEntry: CampaignEntry = {
        id: nextId,
        status: "new",
        contactFirstName: "",
        contactLastName: "",
        contactPhone: "",
        companyName: "",
        companyAddress1: "",
        companyAddress2: "",
        companyCity: "",
        companyState: "",
        companyZip: "",
        companyPhone: "",
        pastDueAmount: null,
        previousNotes: "",
        log: ""
      };

      await setDoc(doc(clientDataRef, clientId), newEntry);

      toast({
        title: "New entry added successfully"
      });

      onRefresh();
    } catch (error) {
      console.error("Error adding new entry:", error);
      toast({
        title: "Error",
        description: "Failed to add new entry",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof CampaignEntry, value: string | number | null) => {
    setEditedData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Campaign Entries for Client {clientId}</h3>
        <Button onClick={handleAdd} disabled={isLoading}>
          <Plus className="h-4 w-4 mr-2" />
          Add Entry
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Contact Info</TableHead>
              <TableHead>Company Info</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((entry) => (
              <TableRow key={entry.id}>
                <TableCell>{entry.id}</TableCell>
                <TableCell>
                  {editingId === entry.id ? (
                    <Input
                      value={editedData.status || ""}
                      onChange={(e) => handleInputChange("status", e.target.value)}
                    />
                  ) : (
                    entry.status || "Not Set"
                  )}
                </TableCell>
                <TableCell>
                  {editingId === entry.id ? (
                    <div className="space-y-2">
                      <Input
                        value={editedData.contactFirstName || ""}
                        onChange={(e) => handleInputChange("contactFirstName", e.target.value)}
                        placeholder="First Name"
                      />
                      <Input
                        value={editedData.contactLastName || ""}
                        onChange={(e) => handleInputChange("contactLastName", e.target.value)}
                        placeholder="Last Name"
                      />
                      <Input
                        value={editedData.contactPhone || ""}
                        onChange={(e) => handleInputChange("contactPhone", e.target.value)}
                        placeholder="Phone"
                      />
                    </div>
                  ) : (
                    <div>
                      <div>{entry.contactFirstName && entry.contactLastName ? 
                        `${entry.contactFirstName} ${entry.contactLastName}`.trim() : 
                        "Not Set"}</div>
                      <div className="text-sm text-muted-foreground">
                        {entry.contactPhone || "No Phone"}
                      </div>
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  {editingId === entry.id ? (
                    <div className="space-y-2">
                      <Input
                        value={editedData.companyName || ""}
                        onChange={(e) => handleInputChange("companyName", e.target.value)}
                        placeholder="Company Name"
                      />
                      <Input
                        value={editedData.companyAddress1 || ""}
                        onChange={(e) => handleInputChange("companyAddress1", e.target.value)}
                        placeholder="Address 1"
                      />
                      <Input
                        value={editedData.companyAddress2 || ""}
                        onChange={(e) => handleInputChange("companyAddress2", e.target.value)}
                        placeholder="Address 2"
                      />
                      <div className="grid grid-cols-3 gap-2">
                        <Input
                          value={editedData.companyCity || ""}
                          onChange={(e) => handleInputChange("companyCity", e.target.value)}
                          placeholder="City"
                        />
                        <Input
                          value={editedData.companyState || ""}
                          onChange={(e) => handleInputChange("companyState", e.target.value)}
                          placeholder="State"
                        />
                        <Input
                          value={editedData.companyZip || ""}
                          onChange={(e) => handleInputChange("companyZip", e.target.value)}
                          placeholder="ZIP"
                        />
                      </div>
                      <Input
                        value={editedData.companyPhone || ""}
                        onChange={(e) => handleInputChange("companyPhone", e.target.value)}
                        placeholder="Phone"
                      />
                    </div>
                  ) : (
                    <div>
                      <div>{entry.companyName || "Not Set"}</div>
                      <div className="text-sm text-muted-foreground">
                        {entry.companyAddress1 ? (
                          <>
                            {entry.companyAddress1}
                            {entry.companyAddress2 && <>, {entry.companyAddress2}</>}
                            <br />
                            {entry.companyCity}, {entry.companyState} {entry.companyZip}
                            <br />
                            {entry.companyPhone || "No Phone"}
                          </>
                        ) : (
                          "No Address"
                        )}
                      </div>
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  {editingId === entry.id ? (
                    <Input
                      type="number"
                      value={editedData.pastDueAmount ?? ""}
                      onChange={(e) => handleInputChange("pastDueAmount", e.target.value ? parseFloat(e.target.value) : null)}
                    />
                  ) : (
                    entry.pastDueAmount != null ? `$${entry.pastDueAmount.toFixed(2)}` : "Not Set"
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    {editingId === entry.id ? (
                      <Button 
                        onClick={handleSave}
                        disabled={isLoading}
                      >
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        onClick={() => handleEdit(entry)}
                        disabled={isLoading}
                      >
                        Edit
                      </Button>
                    )}
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => handleDelete(entry)}
                      disabled={isLoading}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}