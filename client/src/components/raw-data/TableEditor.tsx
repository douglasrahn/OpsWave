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

  // Define the order of fields for campaign entries based on the screenshot
  const campaignEntryFields = [
    'CompanyCity',
    'CompanyName',
    'CompanyPhone',
    'CompanyState',
    'CompanyZip',
    'ContactFirstName',
    'ContactLastName',
    'ContactPhone',
    'ID',
    'Log',
    'PastDueAmount',
    'PreviousNotes',
    'Status'
  ];

  // Get header fields based on the table type
  const headers = tableName === 'campaign_entries' 
    ? campaignEntryFields
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
      const docRef = doc(db, 'campaigns', id);

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