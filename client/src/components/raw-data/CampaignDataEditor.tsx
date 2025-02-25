import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { collection, doc, setDoc, getDoc } from "firebase/firestore";
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
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editedData, setEditedData] = useState<Partial<CampaignEntry>>({});
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleEdit = (entry: CampaignEntry) => {
    setEditingId(entry.id);
    setEditedData(entry);
  };

  const handleSave = async () => {
    if (!editingId) return;

    setIsLoading(true);
    try {
      // Get the entry we're editing with its campaignId
      const entry = data.find(e => e.id === editingId);
      if (!entry?.campaignId) {
        throw new Error("Could not find campaign ID for this entry");
      }

      // Reference to the client's data document
      const clientDataRef = doc(db, `campaigndata/${entry.campaignId}/clientdata`, clientId);
      const docSnap = await getDoc(clientDataRef);

      // Get current entries
      const currentEntries = docSnap.exists() ? docSnap.data().entries || [] : [];

      // Update the specific entry
      const updatedEntries = currentEntries.map((e: CampaignEntry) =>
        e.id === editingId ? { ...e, ...editedData } : e
      );

      // Save back to Firestore
      await setDoc(clientDataRef, { entries: updatedEntries }, { merge: true });

      toast({ title: "Changes saved successfully" });
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

  const handleInputChange = (field: keyof CampaignEntry, value: string | number | null) => {
    // For pastDueAmount, ensure it's a valid number or null
    if (field === 'pastDueAmount') {
      const num = value === '' || value === null ? null : Number(value);
      if (num !== null && isNaN(num)) {
        toast({
          title: "Invalid input",
          description: "Past due amount must be a number",
          variant: "destructive"
        });
        return;
      }
      setEditedData(prev => ({ ...prev, [field]: num }));
      return;
    }

    // For all other fields, allow any string value including empty
    setEditedData(prev => ({ ...prev, [field]: value }));
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


  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Contact Info</TableHead>
            <TableHead>Company Info</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Notes</TableHead>
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
                      placeholder="First Name"
                      value={editedData.contactFirstName || ""}
                      onChange={(e) => handleInputChange("contactFirstName", e.target.value)}
                    />
                    <Input
                      placeholder="Last Name"
                      value={editedData.contactLastName || ""}
                      onChange={(e) => handleInputChange("contactLastName", e.target.value)}
                    />
                    <Input
                      placeholder="Phone"
                      value={editedData.contactPhone || ""}
                      onChange={(e) => handleInputChange("contactPhone", e.target.value)}
                    />
                  </div>
                ) : (
                  <div>
                    <div>
                      {entry.contactFirstName || entry.contactLastName ? 
                        `${entry.contactFirstName || ""} ${entry.contactLastName || ""}`.trim() : 
                        "Not Set"}
                    </div>
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
                      placeholder="Company Name"
                      value={editedData.companyName || ""}
                      onChange={(e) => handleInputChange("companyName", e.target.value)}
                    />
                    <Input
                      placeholder="Address Line 1"
                      value={editedData.companyAddress1 || ""}
                      onChange={(e) => handleInputChange("companyAddress1", e.target.value)}
                    />
                    <Input
                      placeholder="Address Line 2"
                      value={editedData.companyAddress2 || ""}
                      onChange={(e) => handleInputChange("companyAddress2", e.target.value)}
                    />
                    <div className="grid grid-cols-3 gap-2">
                      <Input
                        placeholder="City"
                        value={editedData.companyCity || ""}
                        onChange={(e) => handleInputChange("companyCity", e.target.value)}
                      />
                      <Input
                        placeholder="State"
                        value={editedData.companyState || ""}
                        onChange={(e) => handleInputChange("companyState", e.target.value)}
                      />
                      <Input
                        placeholder="ZIP"
                        value={editedData.companyZip || ""}
                        onChange={(e) => handleInputChange("companyZip", e.target.value)}
                      />
                    </div>
                    <Input
                      placeholder="Phone"
                      value={editedData.companyPhone || ""}
                      onChange={(e) => handleInputChange("companyPhone", e.target.value)}
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
                          {entry.companyCity && entry.companyState && entry.companyZip && 
                            `${entry.companyCity}, ${entry.companyState} ${entry.companyZip}`}
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
                    onChange={(e) => handleInputChange("pastDueAmount", e.target.value)}
                    placeholder="Past Due Amount"
                  />
                ) : (
                  entry.pastDueAmount != null ? `$${entry.pastDueAmount.toFixed(2)}` : "Not Set"
                )}
              </TableCell>
              <TableCell>
                {editingId === entry.id ? (
                  <div className="space-y-2">
                    <Input
                      placeholder="Previous Notes"
                      value={editedData.previousNotes || ""}
                      onChange={(e) => handleInputChange("previousNotes", e.target.value)}
                    />
                    <Input
                      placeholder="Log"
                      value={editedData.log || ""}
                      onChange={(e) => handleInputChange("log", e.target.value)}
                    />
                  </div>
                ) : (
                  <div>
                    <div>{entry.previousNotes || "No Previous Notes"}</div>
                    <div className="text-sm text-muted-foreground">
                      {entry.log || "No Log"}
                    </div>
                  </div>
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
  );
}