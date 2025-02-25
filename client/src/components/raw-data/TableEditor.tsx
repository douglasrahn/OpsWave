import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Edit2, Save, X, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { doc, updateDoc, collection, getDocs, addDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getCurrentClientId } from "@/lib/auth";

interface TableEditorProps {
  tableName: string;
  data: any[];
  onRefresh: () => void;
}

export function TableEditor({ tableName, data, onRefresh }: TableEditorProps) {
  const [editingRow, setEditingRow] = useState<string | number | null>(null);
  const [editedData, setEditedData] = useState<Record<string, any> | null>(null);
  const { toast } = useToast();

  // Get header fields from the first row of data, excluding internal fields
  const headers = data.length > 0 
    ? Object.keys(data[0]).filter(key => !['clientId'].includes(key))
    : [];

  const handleEdit = (row: Record<string, any>) => {
    setEditingRow(row.id);
    setEditedData({ ...row });
  };

  const handleCancel = () => {
    setEditingRow(null);
    setEditedData(null);
  };

  const handleDelete = async (row: Record<string, any>) => {
    try {
      const clientId = getCurrentClientId();
      if (!clientId) throw new Error("No client ID found");

      if (tableName === 'campaigndata') {
        await deleteDoc(doc(db, `campaigndata/${clientId}/entries/${row.id}`));
      } else {
        await deleteDoc(doc(db, tableName, row.id));
      }

      toast({
        title: "Success",
        description: "Record deleted successfully"
      });

      onRefresh();
    } catch (error) {
      console.error("Error deleting document:", error);
      toast({
        title: "Error",
        description: "Failed to delete record",
        variant: "destructive"
      });
    }
  };

  const handleAdd = async () => {
    try {
      const clientId = getCurrentClientId();
      if (!clientId) throw new Error("No client ID found");

      if (tableName === 'campaigndata') {
        // Get current highest ID
        const nextId = data.length > 0 
          ? Math.max(...data.map(entry => entry.id)) + 1 
          : 1;

        // Create new entry with defaults
        const newEntry = {
          id: nextId,
          status: 'pending',
          contactFirstName: null,
          contactLastName: null,
          contactPhone: null,
          companyName: '',
          companyAddress1: null,
          companyAddress2: null,
          companyCity: null,
          companyState: null,
          companyZip: null,
          companyPhone: null,
          pastDueAmount: null,
          previousNotes: null,
          log: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        await addDoc(collection(db, `campaigndata/${clientId}/entries`), newEntry);
      }

      toast({
        title: "Success",
        description: "New record added successfully"
      });

      onRefresh();
    } catch (error) {
      console.error("Error adding document:", error);
      toast({
        title: "Error",
        description: "Failed to add record",
        variant: "destructive"
      });
    }
  };

  const handleSave = async (id: string | number) => {
    try {
      const clientId = getCurrentClientId();
      if (!clientId) throw new Error("No client ID found");

      let docRef;
      if (tableName === 'campaigndata') {
        docRef = doc(db, `campaigndata/${clientId}/entries/${id}`);
      } else {
        docRef = doc(db, tableName, id.toString());
      }

      const updateData = { ...editedData };
      delete updateData.id; // Remove id from update data
      updateData.updatedAt = new Date().toISOString();

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
    setEditedData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Format field names for display
  const formatFieldName = (field: string) => {
    return field
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  };

  return (
    <div>
      {tableName === 'campaigndata' && (
        <Button 
          onClick={handleAdd}
          className="mb-4"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add New Entry
        </Button>
      )}
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[140px]">Actions</TableHead>
              {headers.map(header => (
                <TableHead key={header}>{formatFieldName(header)}</TableHead>
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
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(row)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(row)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </TableCell>
                {headers.map(header => (
                  <TableCell key={`${row.id}-${header}`}>
                    {editingRow === row.id ? (
                      <Input
                        value={editedData?.[header] ?? ''}
                        onChange={(e) => handleInputChange(header, e.target.value)}
                        className="min-w-[120px]"
                      />
                    ) : (
                      row[header] === undefined || row[header] === null ? 'Not Set' : row[header]
                    )}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}