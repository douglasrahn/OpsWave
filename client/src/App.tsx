import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { useEffect, useState } from "react";
import { initializeDatabase } from "./lib/firebase";
import { useToast } from "@/hooks/use-toast";
import LoginPage from "@/pages/login";
import DashboardPage from "@/pages/dashboard";
import UsersPage from "@/pages/users";
import SubscriptionsPage from "@/pages/subscriptions";
import CollectionsConfigPage from "@/pages/config/collections";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={LoginPage} />
      <Route path="/dashboard" component={DashboardPage} />
      <Route path="/users" component={UsersPage} />
      <Route path="/subscriptions" component={SubscriptionsPage} />
      <Route path="/config/collections" component={CollectionsConfigPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const { toast } = useToast();
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const initApp = async () => {
      try {
        await initializeDatabase();
        console.log("Firebase initialized successfully");
      } catch (error: any) {
        // Only show error if it's not a "user already exists" error
        if (error.code !== 'auth/email-already-in-use') {
          console.error("Firebase initialization error:", error);
          toast({
            title: "Error initializing application",
            description: error.message,
            variant: "destructive"
          });
        }
      } finally {
        setIsInitializing(false);
      }
    };

    initApp();
  }, [toast]);

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;