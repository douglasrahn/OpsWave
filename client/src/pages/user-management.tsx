import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Edit2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import clientsData from "@/data/clients.json";

interface SearchResult {
  type: 'client' | 'user';
  id: string;
  title: string;
  subtitle: string;
  clientId: string;
}

export default function UserManagementPage() {
  const [clientSearch, setClientSearch] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [, setLocation] = useLocation();

  useEffect(() => {
    const results: SearchResult[] = [];

    if (clientSearch.trim()) {
      const searchTerm = clientSearch.toLowerCase();
      clientsData.clients
        .filter(client => 
          client.clientId.toLowerCase().includes(searchTerm) ||
          client.companyName.toLowerCase().includes(searchTerm)
        )
        .forEach(client => {
          results.push({
            type: 'client',
            id: client.clientId,
            title: client.companyName,
            subtitle: `Client ID: ${client.clientId}`,
            clientId: client.clientId
          });
        });
    }

    if (userSearch.trim()) {
      clientsData.clients.forEach(client => {
        client.users
          .filter(user =>
            user.email.toLowerCase().includes(userSearch.toLowerCase()) ||
            user.uid.toLowerCase().includes(userSearch.toLowerCase()) ||
            client.clientId.toLowerCase().includes(userSearch.toLowerCase())
          )
          .forEach(user => {
            results.push({
              type: 'user',
              id: user.uid,
              title: user.email,
              subtitle: `Role: ${user.role} | Client: ${client.companyName}`,
              clientId: client.clientId
            });
          });
      });
    }

    setSearchResults(results);
  }, [clientSearch, userSearch]);

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">User Management</h1>
        <p className="text-muted-foreground mt-2">
          Search and manage clients and users
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div>
          <label className="text-sm font-medium mb-2 block">
            Search Clients
          </label>
          <Input
            placeholder="Search by client ID or company name..."
            value={clientSearch}
            onChange={(e) => setClientSearch(e.target.value)}
            disabled={userSearch.length > 0}
            className={userSearch.length > 0 ? "opacity-50" : ""}
          />
        </div>
        <div>
          <label className="text-sm font-medium mb-2 block">
            Search Users
          </label>
          <Input
            placeholder="Search by email, UID, or client ID..."
            value={userSearch}
            onChange={(e) => setUserSearch(e.target.value)}
            disabled={clientSearch.length > 0}
            className={clientSearch.length > 0 ? "opacity-50" : ""}
          />
        </div>
      </div>

      <div className="space-y-4">
        {searchResults.map((result) => (
          <Card key={`${result.type}-${result.id}`}>
            <CardContent className="flex items-center justify-between p-6">
              <div>
                <h3 className="text-lg font-semibold">{result.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {result.subtitle}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLocation(`/${result.type}-edit/${result.id}`)}
              >
                <Edit2 className="h-4 w-4 mr-2" />
                Edit
              </Button>
            </CardContent>
          </Card>
        ))}

        {searchResults.length === 0 && (clientSearch || userSearch) && (
          <div className="text-center py-8 text-muted-foreground">
            <p>No results found</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}