import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Edit2, Save, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface TableEditorProps {
  tableName: string;
  data: any[];
  onRefresh: () => void;
}

export function TableEditor({ tableName, data, onRefresh }: TableEditorProps) {
  const [editingRow, setEditingRow] = useState<string | null>(null);
  const [editedData, setEditedData] = useState<Record<string, any> | null>(null);
  const { toast } = useToast();

  // Define the order of fields for campaign entries
  const campaignEntryFields = [
    'id',
    'campaignId',
    'status',
    'contactFirstName',
    'contactLastName',
    'contactPhone',
    'companyName',
    'companyAddress1',
    'companyAddress2',
    'companyCity',
    'companyState',
    'companyZip',
    'companyPhone',
    'pastDueAmount',
    'previousNotes',
    'log'
  ];

  // Get header fields from the first row of data, excluding internal fields
  const headers = tableName === 'campaign_entries' 
    ? campaignEntryFields.filter(field => field !== 'id')
    : (data.length > 0 ? Object.keys(data[0]).filter(key => !['id'].includes(key)) : []);

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
      // For campaign entries, update directly in the campaigns collection
      const docRef = doc(db, tableName === 'campaign_entries' ? 'campaigns' : tableName, id);

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
      onRefresh(); // Refresh the data
    } catch (error) {
      console.error("Error updating document:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update record",
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

  // Format field value for display
  const formatFieldValue = (value: any) => {
    if (value === null || value === undefined) return 'Not Set';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (typeof value === 'number') return value.toString();
    return value;
  };

  return (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">Actions</TableHead>
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
                      className="min-w-[120px]"
                    />
                  ) : (
                    formatFieldValue(row[header])
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