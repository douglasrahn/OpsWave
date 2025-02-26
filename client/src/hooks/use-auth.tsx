import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import clientsData from "@/data/clients.json";

interface AuthUser extends User {
  accessLevel?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Find user in local JSON data
        const clientWithUser = clientsData.clients.find(client => 
          client.users.some(u => u.uid === firebaseUser.uid)
        );

        if (clientWithUser) {
          const userData = clientWithUser.users.find(u => u.uid === firebaseUser.uid);

          // Extend the user object with custom claims
          const extendedUser: AuthUser = {
            ...firebaseUser,
            accessLevel: userData?.role || 'user'
          };

          setUser(extendedUser);
        } else {
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}