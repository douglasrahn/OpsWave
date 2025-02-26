import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Edit2, Save, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getCurrentClientId } from "@/lib/auth";
import { z } from "zod";

interface TableEditorProps {
  tableName: string;
  data: any[];
  onRefresh: () => void;
}

// Validation schemas for different tables
const clientSchema = z.object({
  clientId: z.string(),
  companyName: z.string().min(1, "Company name is required"),
  url: z.string().url("Must be a valid URL"),
  users: z.array(z.object({
    email: z.string().email("Invalid email"),
    role: z.string(),
    uid: z.string()
  }))
});

export function TableEditor({ tableName, data, onRefresh }: TableEditorProps) {
  const [editingRow, setEditingRow] = useState<string | null>(null);
  const [editedData, setEditedData] = useState<Record<string, any> | null>(null);
  const { toast } = useToast();
  const currentClientId = getCurrentClientId();

  // Process data to handle nested objects
  const processValue = (value: any): string => {
    if (Array.isArray(value)) {
      return value.map(item => 
        typeof item === 'object' ? JSON.stringify(item) : item
      ).join(', ');
    }
    if (value && typeof value === 'object') {
      return JSON.stringify(value);
    }
    return value?.toString() ?? '';
  };

  // Handle regular tables
  const headers = data.length > 0 ? Object.keys(data[0]).filter(key => key !== 'id') : [];

  const handleEdit = (row: Record<string, any>) => {
    // Only allow editing if user has permissions
    if (tableName === "clients" && currentClientId !== row.clientId) {
      toast({
        title: "Access Denied",
        description: "You can only edit your own client's data",
        variant: "destructive"
      });
      return;
    }

    setEditingRow(row.id);
    setEditedData({ ...row });
  };

  const handleCancel = () => {
    setEditingRow(null);
    setEditedData(null);
  };

  const validateData = () => {
    if (!editedData) return false;

    try {
      if (tableName === "clients") {
        // Parse JSON strings back to objects for validation
        const processedData = {
          ...editedData,
          users: typeof editedData.users === 'string' 
            ? JSON.parse(editedData.users)
            : editedData.users
        };
        clientSchema.parse(processedData);
      }
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const issues = error.issues.map(issue => issue.message).join(", ");
        toast({
          title: "Validation Error",
          description: issues,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Error",
          description: "Invalid JSON format in users field",
          variant: "destructive"
        });
      }
      return false;
    }
  };

  const handleSave = async (id: string) => {
    if (!validateData()) return;

    try {
      // Parse JSON strings back to objects before sending
      const processedData = {
        ...editedData,
        users: typeof editedData?.users === 'string'
          ? JSON.parse(editedData.users)
          : editedData?.users
      };

      const response = await fetch(`/api/${tableName}/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(processedData),
      });

      if (!response.ok) {
        throw new Error('Failed to update record');
      }

      toast({
        title: "Success",
        description: "Record updated successfully"
      });

      setEditingRow(null);
      setEditedData(null);
      onRefresh(); // Refresh the data
    } catch (error) {
      console.error("Error updating record:", error);
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
                      value={editedData?.[header] ? processValue(editedData[header]) : ''}
                      onChange={(e) => handleInputChange(header, e.target.value)}
                    />
                  ) : (
                    processValue(row[header])
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