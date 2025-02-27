import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { useEffect, useState } from "react";
import { initializeAuth } from "./lib/firebase";
import { useToast } from "@/hooks/use-toast";
import LoginPage from "@/pages/login";
import DashboardPage from "@/pages/dashboard";
import UsersPage from "@/pages/users";
import SubscriptionsPage from "@/pages/subscriptions";
import CollectionsConfigPage from "@/pages/config/collections";
import CollectionsDashboardPage from "@/pages/collections-dashboard";
import RawDataPage from "@/pages/raw-data";
import CampaignsPage from "@/pages/campaigns";
import UserManagementPage from "@/pages/user-management";
import ClientEditPage from "@/pages/client-edit";
import UserEditPage from "@/pages/user-edit";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={LoginPage} />
      <Route path="/dashboard" component={DashboardPage} />
      <Route path="/users" component={UsersPage} />
      <Route path="/subscriptions" component={SubscriptionsPage} />
      <Route path="/campaigns" component={CampaignsPage} />
      <Route path="/config/collections" component={CollectionsConfigPage} />
      <Route path="/collections-dashboard" component={CollectionsDashboardPage} />
      <Route path="/raw-data" component={RawDataPage} />
      <Route path="/user-management" component={UserManagementPage} />
      <Route path="/client-edit/:id" component={ClientEditPage} />
      <Route path="/user-edit/:id" component={UserEditPage} />
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
        await initializeAuth();
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