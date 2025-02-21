import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  Users, 
  Settings,
  FileSpreadsheet,
  UserCheck,
  HeadsetIcon,
  ChevronDown,
  ChevronRight
} from "lucide-react";
import { useState } from "react";

const configMenuItems = [
  { icon: FileSpreadsheet, label: "Collection Reminders", href: "/config/collections" },
  { icon: UserCheck, label: "Prospect Qualifying", href: "/config/prospects" },
  { icon: HeadsetIcon, label: "Customer Service", href: "/config/customer-service" }
];

const mainMenuItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: Users, label: "Users", href: "/users" },
  { icon: Settings, label: "Subscriptions", href: "/subscriptions" }
];

export function Sidebar() {
  const [location] = useLocation();
  const [isConfigExpanded, setIsConfigExpanded] = useState(false);

  return (
    <aside className="w-64 border-r bg-white">
      <nav className="p-4 space-y-2">
        {mainMenuItems.map((item) => (
          <Link 
            key={item.href} 
            href={item.href}
            className={cn(
              "flex items-center space-x-3 px-3 py-2 rounded-md transition-colors",
              location === item.href 
                ? "bg-primary text-primary-foreground" 
                : "hover:bg-muted"
            )}
          >
            <item.icon className="h-5 w-5" />
            <span>{item.label}</span>
          </Link>
        ))}

        {/* Configuration Section */}
        <div>
          <button
            onClick={() => setIsConfigExpanded(!isConfigExpanded)}
            className="w-full flex items-center space-x-3 px-3 py-2 rounded-md hover:bg-muted"
          >
            <Settings className="h-5 w-5" />
            <span>Configuration</span>
            {isConfigExpanded ? (
              <ChevronDown className="h-4 w-4 ml-auto" />
            ) : (
              <ChevronRight className="h-4 w-4 ml-auto" />
            )}
          </button>

          {isConfigExpanded && (
            <div className="ml-4 mt-1 space-y-1">
              {configMenuItems.map((item) => (
                <Link 
                  key={item.href} 
                  href={item.href}
                  className={cn(
                    "flex items-center space-x-3 px-3 py-2 rounded-md transition-colors",
                    location === item.href 
                      ? "bg-primary text-primary-foreground" 
                      : "hover:bg-muted"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </nav>
    </aside>
  );
}