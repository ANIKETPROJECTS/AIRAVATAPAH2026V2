import { useState, useEffect } from "react";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import Dashboard from "@/components/modules/Dashboard";
import FarmerRegistry from "@/components/modules/FarmerRegistry";
import SchemeApplications from "@/components/modules/SchemeApplications";
import SubsidyManagement from "@/components/modules/SubsidyManagement";
import InsuranceClaims from "@/components/modules/InsuranceClaims";
import GrievanceManagement from "@/components/modules/GrievanceManagement";
import ReportsAnalytics from "@/components/modules/ReportsAnalytics";
import SettingsWorkflow from "@/components/modules/SettingsWorkflow";
import FarmerAppPreview from "@/components/modules/FarmerAppPreview";
import NewRegistration from "@/components/modules/NewRegistration";
import AIAssistant from "@/components/AIAssistant";
import { useLang } from "@/contexts/LanguageContext";
import { t } from "@/i18n/translations";

const pageTitleKeys: Record<string, string> = {
  dashboard:       "page_dashboard",
  newregistration: "page_newregistration",
  farmers:         "page_farmers",
  applications:    "page_applications",
  subsidies:       "page_subsidies",
  insurance:       "page_insurance",
  grievances:      "page_grievances",
  reports:         "page_reports",
  settings:        "page_settings",
  farmerapp:       "page_farmerapp",
};

const modules: Record<string, React.FC> = {
  dashboard:       Dashboard,
  newregistration: NewRegistration,
  farmers:         FarmerRegistry,
  applications:    SchemeApplications,
  subsidies:       SubsidyManagement,
  insurance:       InsuranceClaims,
  grievances:      GrievanceManagement,
  reports:         ReportsAnalytics,
  settings:        SettingsWorkflow,
  farmerapp:       FarmerAppPreview,
};

export default function Index() {
  const [active, setActive] = useState("dashboard");
  const [collapsed, setCollapsed] = useState(false);
  const [loading, setLoading] = useState(false);
  const { lang } = useLang();

  useEffect(() => {
    const check = () => setCollapsed(window.innerWidth < 1280);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const navigate = (key: string) => {
    if (key === active) return;
    setLoading(true);
    setTimeout(() => {
      setActive(key);
      setLoading(false);
    }, 200);
  };

  const ActiveModule = modules[active];

  return (
    <div className="min-h-screen bg-background">
      <Sidebar active={active} onNavigate={navigate} collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} />

      <div className={`transition-all duration-300 ${collapsed ? "ml-16" : "ml-60"}`}>
        <Header />

        <main className="p-6">
          <h1 className="font-heading text-2xl mb-6">{t(pageTitleKeys[active], lang)}</h1>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-24 bg-muted/50 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : active === "farmers" ? (
            <FarmerRegistry onNavigate={navigate} />
          ) : (
            <ActiveModule />
          )}
        </main>
      </div>

      <AIAssistant />
    </div>
  );
}
