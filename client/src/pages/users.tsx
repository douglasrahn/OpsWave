import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { UserTable } from "@/components/users/UserTable";
import { AddUserDialog } from "@/components/users/AddUserDialog";
import { useQuery } from "@tanstack/react-query";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

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
      const querySnapshot = await getDocs(collection(db, "users"));
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data() as Omit<User, 'id'>
      }));
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