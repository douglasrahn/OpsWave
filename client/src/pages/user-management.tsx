import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Edit2, Plus } from "lucide-react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface SearchResults {
  clients: Array<{
    id: string;
    companyName: string;
    url: string;
  }>;
  users: Array<{
    id: string;
    email: string;
    role: string;
    clientName: string;
  }>;
}

export default function UserManagementPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [, setLocation] = useLocation();

  // Fetch clients data from API
  const { data: clientsData, isLoading } = useQuery({
    queryKey: ['/api/clients'],
    queryFn: async () => {
      const response = await fetch('/api/clients');
      if (!response.ok) {
        throw new Error('Failed to fetch clients');
      }
      return response.json();
    }
  });

  // Filter data based on search term
  const searchResults: SearchResults = {
    clients: [],
    users: []
  };

  if (clientsData && searchTerm.trim()) {
    const term = searchTerm.toLowerCase();

    // Search clients
    searchResults.clients = clientsData.clients.filter(client => 
      client.clientId.toLowerCase().includes(term) ||
      client.companyName.toLowerCase().includes(term)
    ).map(client => ({
      id: client.clientId,
      companyName: client.companyName,
      url: client.url
    }));

    // Search users
    clientsData.clients.forEach(client => {
      client.users.forEach(user => {
        if (
          user.email.toLowerCase().includes(term) ||
          user.role.toLowerCase().includes(term)
        ) {
          searchResults.users.push({
            id: user.uid,
            email: user.email,
            role: user.role,
            clientName: client.companyName
          });
        }
      });
    });
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div>Loading...</div>
      </DashboardLayout>
    );
  }

  const handleCreateClient = () => {
    if (!clientsData) return;
    const newClientId = (Math.max(...clientsData.clients.map(c => parseInt(c.clientId))) + 1).toString();
    setLocation(`/client-edit/${newClientId}`);
  };

  const handleCreateUser = () => {
    // Redirect to user creation page with a new UID
    const newUid = `new-user-${Date.now()}`;
    setLocation(`/user-edit/${newUid}`);
  };

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">User Management</h1>
        <p className="text-muted-foreground mt-2">
          Search and manage clients and users
        </p>
      </div>

      <div className="mb-8">
        <div className="flex justify-between items-center mb-2">
          <div></div> {/* Placeholder to maintain similar structure */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCreateClient}
            >
              <Plus className="h-4 w-4 mr-1" />
              New Client
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCreateUser}
            >
              <Plus className="h-4 w-4 mr-1" />
              New User
            </Button>
          </div>
        </div>
        <Input
          placeholder="Search clients and users..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-xl"
        />
      </div>

      {searchResults.clients.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Clients</h2>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Company Name</TableHead>
                <TableHead>URL</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {searchResults.clients.map((client) => (
                <TableRow key={client.id}>
                  <TableCell>{client.companyName}</TableCell>
                  <TableCell>{client.url}</TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setLocation(`/client-edit/${client.id}`)}
                    >
                      <Edit2 className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {searchResults.users.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Users</h2>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Client</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {searchResults.users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.role}</TableCell>
                  <TableCell>{user.clientName}</TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setLocation(`/user-edit/${user.id}`)}
                    >
                      <Edit2 className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {searchTerm && !searchResults.clients.length && !searchResults.users.length && (
        <div className="text-center py-8 text-muted-foreground">
          <p>No results found</p>
        </div>
      )}
    </DashboardLayout>
  );
}