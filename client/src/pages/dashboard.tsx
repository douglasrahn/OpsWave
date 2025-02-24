import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ProductCard } from "@/components/dashboard/ProductCard";
import { useLocation } from "wouter";

export default function DashboardPage() {
  const [_, setLocation] = useLocation();

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Welcome to OpsWave</h1>
        <p className="text-muted-foreground mt-2">
          Manage your automation tools and settings
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <ProductCard
          title="Collection Reminders"
          description="Automate and manage collection reminders"
          onClick={() => {
            console.log("Navigating to collections dashboard");
            setLocation("/collections-dashboard");
          }}
        />
        <ProductCard
          title="Collection Handling"
          description="Streamline your collection processes"
          isComingSoon
        />
        <ProductCard
          title="Prospect Qualifying"
          description="Automated prospect qualification"
          isComingSoon
        />
      </div>
    </DashboardLayout>
  );
}