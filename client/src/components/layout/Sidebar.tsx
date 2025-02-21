import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  Users, 
  Settings
} from "lucide-react";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: Users, label: "Users", href: "/users" },
  { icon: Settings, label: "Subscriptions", href: "/subscriptions" }
];

export function Sidebar() {
  const [location] = useLocation();

  return (
    <aside className="w-64 border-r bg-white">
      <nav className="p-4 space-y-2">
        {menuItems.map((item) => (
          <Link key={item.href} href={item.href}>
            <a className={cn(
              "flex items-center space-x-3 px-3 py-2 rounded-md transition-colors",
              location === item.href 
                ? "bg-primary text-primary-foreground" 
                : "hover:bg-muted"
            )}>
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </a>
          </Link>
        ))}
      </nav>
    </aside>
  );
}
