import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Edit } from "lucide-react";

interface User {
  id: string;
  email: string;
  accessLevel: string;
  clientId: string;
}

interface UserTableProps {
  users: User[];
  onEdit: (user: User) => void;
}

export function UserTable({ users, onEdit }: UserTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Email</TableHead>
          <TableHead>Access Level</TableHead>
          <TableHead>Client ID</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((user) => (
          <TableRow key={user.id}>
            <TableCell>{user.email}</TableCell>
            <TableCell>{user.accessLevel}</TableCell>
            <TableCell>{user.clientId}</TableCell>
            <TableCell>
              <Button variant="ghost" size="sm" onClick={() => onEdit(user)}>
                <Edit className="h-4 w-4" />
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}