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
import CollectionsDashboardPage from "@/pages/collections-dashboard";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={LoginPage} />
      <Route path="/dashboard" component={DashboardPage} />
      <Route path="/users" component={UsersPage} />
      <Route path="/subscriptions" component={SubscriptionsPage} />
      <Route path="/config/collections" component={CollectionsConfigPage} />
      <Route path="/collections-dashboard" component={CollectionsDashboardPage} />
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
        setIsInitializing(false);
      } catch (error: any) {
        console.error("Error initializing Firebase:", error);
        toast({
          title: "Error",
          description: "Failed to initialize application. Please refresh the page.",
          variant: "destructive"
        });
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