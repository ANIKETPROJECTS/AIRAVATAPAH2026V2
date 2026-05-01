import { BarChart3, Users, ClipboardList, IndianRupee, Shield, Megaphone, TrendingUp, Settings, Wheat, ChevronLeft, ChevronRight, Smartphone } from "lucide-react";

const navItems = [
  { key: "dashboard", label: "Dashboard", icon: BarChart3 },
  { key: "farmers", label: "Farmer Registry", icon: Users },
  { key: "applications", label: "Scheme Applications", icon: ClipboardList },
  { key: "subsidies", label: "Subsidy Management", icon: IndianRupee },
  { key: "insurance", label: "Insurance Claims", icon: Shield },
  { key: "grievances", label: "Grievance Management", icon: Megaphone },
  { key: "reports", label: "Reports & Analytics", icon: TrendingUp },
  { key: "settings", label: "Settings & Workflow", icon: Settings },
  { key: "farmerapp", label: "Farmer App Preview", icon: Smartphone },
];

interface SidebarProps {
  active: string;
  onNavigate: (key: string) => void;
  collapsed: boolean;
  onToggle: () => void;
}

export default function Sidebar({ active, onNavigate, collapsed, onToggle }: SidebarProps) {
  return (
    <aside
      className={`fixed left-0 top-0 h-screen z-40 flex flex-col transition-all duration-300 ${collapsed ? "w-16" : "w-60"}`}
      style={{ backgroundColor: "#0D2B1E" }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 py-5 border-b border-sidebar-border">
        <Wheat className="h-7 w-7 text-secondary flex-shrink-0" />
        {!collapsed && <span className="font-heading text-lg text-secondary tracking-wide">AgriAdmin AI</span>}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = active === item.key;
          return (
            <button
              key={item.key}
              onClick={() => onNavigate(item.key)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                isActive
                  ? "bg-secondary/15 text-secondary border-r-2 border-secondary"
                  : "text-sidebar-foreground hover:bg-sidebar-accent"
              } ${collapsed ? "justify-center" : ""}`}
              title={collapsed ? item.label : undefined}
            >
              <item.icon className="h-4.5 w-4.5 flex-shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <button
        onClick={onToggle}
        className="p-3 text-sidebar-foreground hover:text-secondary transition-colors border-t border-sidebar-border"
      >
        {collapsed ? <ChevronRight className="h-4 w-4 mx-auto" /> : <ChevronLeft className="h-4 w-4 mx-auto" />}
      </button>
    </aside>
  );
}
