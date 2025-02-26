import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { UserTable } from "@/components/users/UserTable";
import { AddUserDialog } from "@/components/users/AddUserDialog";
import { useQuery } from "@tanstack/react-query";
import clientsData from "@/data/clients.json";

interface User {
  id: string;
  email: string;
  accessLevel: string;
  clientId: string;
}

export default function UsersPage() {
  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ["users"],
    queryFn: async () => {
      // Transform client user data to match the interface
      return clientsData.clients.flatMap(client => 
        client.users.map(user => ({
          id: user.uid,
          email: user.email,
          accessLevel: user.role,
          clientId: client.clientId
        }))
      );
    }
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <DashboardLayout>
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage user access and permissions
          </p>
        </div>
        <AddUserDialog />
      </div>

      <UserTable 
        users={users ?? []}
        onEdit={(user) => {
          // Handle edit user
        }}
      />
    </DashboardLayout>
  );
}