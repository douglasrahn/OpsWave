import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { doc, setDoc, deleteDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Trash2 } from "lucide-react";

interface CampaignEntry {
  id: number;
  clientId: string; // Added clientId field
  campaignId: string;
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
  pastDueAmount: number;
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

  const handleEdit = (entry: CampaignEntry) => {
    setEditingId(entry.id);
    setEditedData(entry);
  };

  const handleSave = async () => {
    if (!editingId) return;

    setIsLoading(true);
    try {
      const docRef = doc(db, "campaigndata", `${clientId}_${editingId}`);
      await setDoc(docRef, {
        ...editedData,
        clientId // Ensure clientId is included
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
      const docRef = doc(db, "campaigndata", `${clientId}_${entry.id}`);
      await deleteDoc(docRef);

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
      // Find the next available ID
      const campaigndataRef = collection(db, "campaigndata");
      const q = query(campaigndataRef, where("clientId", "==", clientId));
      const querySnapshot = await getDocs(q);
      const nextId = querySnapshot.empty ? 1 : Math.max(...querySnapshot.docs.map(doc => parseInt(doc.id.split('_')[1], 10))) + 1;

      const newEntry: CampaignEntry = {
        id: nextId,
        clientId,
        campaignId: "",
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
        pastDueAmount: 0,
        previousNotes: "",
        log: ""
      };

      const docRef = doc(db, "campaigndata", `${clientId}_${nextId}`);
      await setDoc(docRef, newEntry);

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

  const handleInputChange = (field: keyof CampaignEntry, value: string | number) => {
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
              <TableHead>Campaign ID</TableHead>
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
                      value={editedData.campaignId || ""}
                      onChange={(e) => handleInputChange("campaignId", e.target.value)}
                    />
                  ) : (
                    entry.campaignId
                  )}
                </TableCell>
                <TableCell>
                  {editingId === entry.id ? (
                    <Input
                      value={editedData.status || ""}
                      onChange={(e) => handleInputChange("status", e.target.value)}
                    />
                  ) : (
                    entry.status
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
                      <div>{`${entry.contactFirstName} ${entry.contactLastName}`}</div>
                      <div className="text-sm text-muted-foreground">{entry.contactPhone}</div>
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
                      <div>{entry.companyName}</div>
                      <div className="text-sm text-muted-foreground">
                        {entry.companyAddress1}
                        {entry.companyAddress2 && <>, {entry.companyAddress2}</>}
                        <br />
                        {entry.companyCity}, {entry.companyState} {entry.companyZip}
                        <br />
                        {entry.companyPhone}
                      </div>
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  {editingId === entry.id ? (
                    <Input
                      type="number"
                      value={editedData.pastDueAmount || 0}
                      onChange={(e) => handleInputChange("pastDueAmount", parseFloat(e.target.value))}
                    />
                  ) : (
                    `$${entry.pastDueAmount.toFixed(2)}`
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