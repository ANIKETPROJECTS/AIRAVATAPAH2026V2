import { BarChart3, Users, ClipboardList, IndianRupee, Shield, Megaphone, TrendingUp, Settings, ChevronLeft, ChevronRight, Smartphone, UserPlus } from "lucide-react";
import { useLang } from "@/contexts/LanguageContext";
import { t } from "@/i18n/translations";

const navItems = [
  { key: "dashboard",       labelKey: "nav_dashboard",       icon: BarChart3 },
  { key: "newregistration", labelKey: "nav_newregistration", icon: UserPlus },
  { key: "farmers",         labelKey: "nav_farmers",         icon: Users },
  { key: "applications",    labelKey: "nav_applications",    icon: ClipboardList },
  { key: "subsidies",       labelKey: "nav_subsidies",       icon: IndianRupee },
  { key: "insurance",       labelKey: "nav_insurance",       icon: Shield },
  { key: "grievances",      labelKey: "nav_grievances",      icon: Megaphone },
  { key: "reports",         labelKey: "nav_reports",         icon: TrendingUp },
  { key: "settings",        labelKey: "nav_settings",        icon: Settings },
  { key: "farmerapp",       labelKey: "nav_farmerapp",       icon: Smartphone },
];

interface SidebarProps {
  active: string;
  onNavigate: (key: string) => void;
  collapsed: boolean;
  onToggle: () => void;
}

export default function Sidebar({ active, onNavigate, collapsed, onToggle }: SidebarProps) {
  const { lang } = useLang();

  return (
    <aside
      className={`fixed left-0 top-0 h-screen z-40 flex flex-col transition-all duration-300 ${collapsed ? "w-16" : "w-60"}`}
      style={{ backgroundColor: "#0D2B1E" }}
    >
      <div className="border-b border-sidebar-border overflow-hidden" style={{ padding: "0 10px" }}>
        <img
          src="/krishi-suvidha-logo.png"
          alt="Krishi Suvidha"
          className="w-full h-auto object-contain"
          style={{ marginTop: "-18%", marginBottom: "-18%" }}
        />
      </div>

      <nav className="flex-1 py-3 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = active === item.key;
          const label = t(item.labelKey, lang);
          return (
            <button
              key={item.key}
              onClick={() => onNavigate(item.key)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                isActive
                  ? "bg-secondary/15 text-secondary border-r-2 border-secondary"
                  : "text-sidebar-foreground hover:bg-sidebar-accent"
              } ${collapsed ? "justify-center" : ""}`}
              title={collapsed ? label : undefined}
            >
              <item.icon className="h-4.5 w-4.5 flex-shrink-0" />
              {!collapsed && <span>{label}</span>}
            </button>
          );
        })}
      </nav>

      <button
        onClick={onToggle}
        className="p-3 text-sidebar-foreground hover:text-secondary transition-colors border-t border-sidebar-border"
      >
        {collapsed ? <ChevronRight className="h-4 w-4 mx-auto" /> : <ChevronLeft className="h-4 w-4 mx-auto" />}
      </button>
    </aside>
  );
}
