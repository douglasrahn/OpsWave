import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { logoutUser } from "@/lib/auth";
import { LogOut } from "lucide-react";

export function Header() {
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await logoutUser();
      toast({
        title: "Logged out successfully"
      });
    } catch (error) {
      toast({
        title: "Error logging out",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  return (
    <header className="h-16 border-b bg-white flex items-center px-6 justify-between">
      <div className="flex items-center space-x-4">
        <h1 className="text-2xl font-bold text-royal-blue">OpWave</h1>
      </div>
      <Button variant="ghost" onClick={handleLogout}>
        <LogOut className="h-5 w-5 mr-2" />
        Logout
      </Button>
    </header>
  );
}
