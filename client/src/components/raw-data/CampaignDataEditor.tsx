import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { collection, doc, setDoc, deleteDoc, getDocs, query, where, getDoc } from "firebase/firestore";
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
  campaignId?: string;
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
    console.log("Editing entry:", entry);
    setEditingId(entry.id);
    setEditedData(entry);
  };

  const handleSave = async () => {
    if (!editingId) return;

    setIsLoading(true);
    try {
      // Find the entry we're editing
      console.log("Looking for entry with ID:", editingId);
      console.log("Available entries:", data);

      const entry = data.find(e => e.id === editingId);
      console.log("Found entry:", entry);

      if (!entry?.campaignId) {
        console.error("No campaignId found for entry:", entry);
        throw new Error("Could not find campaign ID for this entry");
      }

      console.log("Starting save operation", {
        editingId,
        campaignId: entry.campaignId,
        clientId,
        editedData
      });

      // Reference to the client's data document within this campaign
      const clientDataRef = doc(db, `campaigndata/${entry.campaignId}/clientdata`, clientId);
      const docSnap = await getDoc(clientDataRef);

      // Get current entries array or initialize empty array if none exists
      const currentEntries = docSnap.exists() ? (docSnap.data().entries || []) : [];
      console.log("Current entries in Firestore:", currentEntries);

      // Update or add the entry
      let updated = false;
      const updatedEntries = currentEntries.map((e: CampaignEntry) => {
        if (e.id === editingId) {
          updated = true;
          const updatedEntry = { ...e, ...editedData, campaignId: entry.campaignId };
          console.log("Updating existing entry:", updatedEntry);
          return updatedEntry;
        }
        return e;
      });

      // If entry wasn't found in array, add it
      if (!updated) {
        const newEntry = { ...editedData, id: editingId, campaignId: entry.campaignId };
        console.log("Adding new entry:", newEntry);
        updatedEntries.push(newEntry);
      }

      console.log("Final entries array:", updatedEntries);

      // Save back to Firestore
      await setDoc(clientDataRef, { entries: updatedEntries }, { merge: true });

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
        description: error instanceof Error ? error.message : "Failed to save changes",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditedData({});
  };

  const handleDelete = async (entry: CampaignEntry) => {
    if (!confirm("Are you sure you want to delete this entry?")) return;

    setIsLoading(true);
    try {
      if (!entry.campaignId) {
        throw new Error("No campaign ID found for this entry");
      }

      console.log("Starting delete operation", {
        entryId: entry.id,
        campaignId: entry.campaignId,
        clientId
      });

      const clientDataRef = doc(db, `campaigndata/${entry.campaignId}/clientdata`, clientId);
      const docSnap = await getDoc(clientDataRef);

      if (!docSnap.exists()) {
        throw new Error("No entries found");
      }

      const currentEntries = docSnap.data().entries || [];
      const updatedEntries = currentEntries.filter((e: CampaignEntry) => e.id !== entry.id);

      await setDoc(clientDataRef, { entries: updatedEntries }, { merge: true });

      toast({
        title: "Entry deleted successfully"
      });

      onRefresh();
    } catch (error) {
      console.error("Error deleting entry:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete entry",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdd = async () => {
    setIsLoading(true);
    try {
      // For new entries, use the campaign from existing entries
      let campaignId;
      if (data.length > 0 && data[0].campaignId) {
        campaignId = data[0].campaignId;
      } else {
        throw new Error("No existing campaign found to add entry to");
      }

      console.log("Starting add operation", {
        campaignId,
        clientId
      });

      const clientDataRef = doc(db, `campaigndata/${campaignId}/clientdata`, clientId);
      const docSnap = await getDoc(clientDataRef);
      const currentEntries = docSnap.exists() ? docSnap.data().entries || [] : [];

      // Calculate next ID
      const nextId = currentEntries.length > 0 ? 
        Math.max(...currentEntries.map((e: CampaignEntry) => e.id)) + 1 : 0;

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
        log: "",
        campaignId
      };

      console.log("Adding new entry:", newEntry);

      // Add new entry to existing entries array
      await setDoc(clientDataRef, {
        entries: [...currentEntries, newEntry]
      }, { merge: true });

      toast({
        title: "New entry added successfully"
      });

      onRefresh();
    } catch (error) {
      console.error("Error adding new entry:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add new entry",
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
                      <>
                        <Button
                          onClick={handleSave}
                          disabled={isLoading}
                        >
                          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={handleCancel}
                          disabled={isLoading}
                        >
                          Cancel
                        </Button>
                      </>
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