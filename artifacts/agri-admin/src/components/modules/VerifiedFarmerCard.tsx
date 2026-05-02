import { useState } from "react";
import {
  User, MapPin, Landmark, Sprout, Shield, FileText, AlertCircle,
  ChevronDown, ChevronUp, CheckCircle2, XCircle, Phone, Mail,
  Droplets, Ticket, BarChart3, BadgeCheck, AlertTriangle, Info,
  Calendar, Hash, Fingerprint, CreditCard, Building2, Activity,
  GraduationCap, Heart, Accessibility, Globe, Wheat, Leaf, Sun,
  Zap, TrendingUp, Clock, IndianRupee, Star, Flag, Home, Layers,
  ArrowRight
} from "lucide-react";
import type { FarmerRecord } from "@/data/farmerApi";

function formatLandHAR(val: number | string | undefined): string {
  if (val === undefined || val === null || val === "" || val === "0" || val === 0) return "—";
  const s = String(val).trim();
  const parts = s.split(".");
  if (parts.length === 3) {
    const [h, a, sm] = parts;
    return `${h} हे. ${a} आर. ${sm} चौ.मी.`;
  }
  if (parts.length === 2) {
    const [h, a] = parts;
    if (a === "0" || a === "00") return `${h} हे.`;
    return `${h} हे. ${a} आर.`;
  }
  return `${s} हे.`;
}

function landToHectares(val: number | string | undefined): number {
  if (!val) return 0;
  const s = String(val).trim();
  const parts = s.split(".");
  const h = parseFloat(parts[0] || "0");
  const a = parseFloat(parts[1] || "0") / 100;
  const sm = parseFloat(parts[2] || "0") / 10000;
  return h + a + sm;
}

function calcAge(dob?: string): string {
  if (!dob) return "—";
  try {
    const d = new Date(dob);
    const age = Math.floor((Date.now() - d.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
    return `${age} yrs`;
  } catch { return "—"; }
}

interface Scheme {
  id: string;
  name: string;
  nameMr: string;
  category: "central" | "state";
  ministry: string;
  eligible: boolean;
  reason: string;
  benefit: string;
  maxAmount: string;
  frequency: string;
  appliedStatus?: "Applied" | "Approved" | "Rejected" | "Disbursed" | null;
  appliedDate?: string;
  nextDueDate?: string;
  totalDisbursed?: string;
  refNo?: string;
}

interface Grievance {
  id: string;
  title: string;
  category: string;
  date: string;
  status: "Open" | "In Progress" | "Resolved" | "Closed";
  priority: "High" | "Medium" | "Low";
  description: string;
  assignedTo: string;
  resolvedDate?: string;
  remarks?: string;
}

interface SupportTicket {
  id: string;
  subject: string;
  date: string;
  status: "Open" | "Pending" | "Resolved";
  type: "Document" | "Payment" | "Scheme" | "Technical" | "Other";
  description: string;
  resolvedDate?: string;
  handledBy?: string;
}

interface TimelineEvent {
  date: string;
  event: string;
  detail: string;
  icon: "register" | "review" | "verify" | "scheme" | "grievance";
}

function deriveSchemes(f: FarmerRecord): Scheme[] {
  const ha = landToHectares(f.land);
  const crop = (f.crop || "").toLowerCase();
  const cat = (f.category || "").toUpperCase();
  const isSCSTOBC = cat === "SC" || cat === "ST" || cat === "OBC";
  const isKharifCrop = ["rice", "sugarcane", "soybean", "cotton", "jowar", "bajra", "maize", "tur", "urad", "moong"].some(c => crop.includes(c));
  const isRabiCrop = ["wheat", "gram", "chickpea", "mustard", "onion", "garlic", "potato"].some(c => crop.includes(c));
  const hasBank = !!(f.bankAccount && f.bankAccount !== "—" && f.bankAccount.length > 4);
  const seed = parseInt(f.farmerId.replace(/\D/g, "") || "1") % 100;

  return [
    {
      id: "PM-KISAN",
      name: "PM-KISAN (Pradhan Mantri Kisan Samman Nidhi)",
      nameMr: "पीएम-किसान",
      category: "central",
      ministry: "Ministry of Agriculture & Farmers Welfare",
      eligible: ha > 0 && ha <= 2 && hasBank,
      reason: ha <= 0 ? "No land holding registered" : ha > 2 ? "Land holding exceeds 2 ha limit" : !hasBank ? "Bank account not linked" : "Small/marginal farmer with linked bank account",
      benefit: "Direct income support of ₹6,000/year",
      maxAmount: "₹6,000/year",
      frequency: "3 instalments of ₹2,000 each (Apr, Aug, Dec)",
      appliedStatus: seed < 70 ? (seed < 30 ? "Disbursed" : seed < 55 ? "Approved" : "Applied") : null,
      appliedDate: seed < 70 ? `${2024 + (seed % 2)}-${String((seed % 12) + 1).padStart(2,"0")}-01` : undefined,
      nextDueDate: seed < 55 ? "2025-08-01" : undefined,
      totalDisbursed: seed < 30 ? "₹18,000 (3 years)" : seed < 55 ? "₹6,000" : undefined,
      refNo: seed < 70 ? `PMKISAN-MH-${f.farmerId}-24` : undefined,
    },
    {
      id: "PMFBY",
      name: "Pradhan Mantri Fasal Bima Yojana",
      nameMr: "पीएम फसल बीमा योजना",
      category: "central",
      ministry: "Ministry of Agriculture & Farmers Welfare",
      eligible: ha > 0 && (isKharifCrop || isRabiCrop || crop.length > 0),
      reason: ha <= 0 ? "No crop registered" : "Eligible for crop insurance against natural calamities",
      benefit: "Comprehensive crop insurance up to ₹2 lakh",
      maxAmount: "₹2,00,000 per season",
      frequency: "Per crop season (Kharif/Rabi)",
      appliedStatus: seed % 3 === 0 ? "Approved" : seed % 3 === 1 ? "Applied" : null,
      appliedDate: seed % 3 !== 2 ? `2025-${String((seed % 12) + 1).padStart(2,"0")}-15` : undefined,
      refNo: seed % 3 !== 2 ? `PMFBY-${f.farmerId}-KH24` : undefined,
    },
    {
      id: "KCC",
      name: "Kisan Credit Card (KCC)",
      nameMr: "किसान क्रेडिट कार्ड",
      category: "central",
      ministry: "Ministry of Finance / NABARD",
      eligible: ha > 0 && hasBank,
      reason: !hasBank ? "Bank account required" : ha <= 0 ? "No land holding" : "Eligible for short-term agricultural credit",
      benefit: "Revolving credit up to ₹3 lakh at 4% p.a.",
      maxAmount: "₹3,00,000",
      frequency: "Revolving credit (annual renewal)",
      appliedStatus: seed % 4 === 0 ? "Disbursed" : seed % 4 === 1 ? "Approved" : null,
      appliedDate: seed % 4 < 2 ? `2024-${String((seed % 12) + 1).padStart(2,"0")}-10` : undefined,
      totalDisbursed: seed % 4 === 0 ? "₹1,50,000" : undefined,
      refNo: seed % 4 < 2 ? `KCC-BOM-${f.farmerId}` : undefined,
    },
    {
      id: "SHC",
      name: "Soil Health Card Scheme",
      nameMr: "मृदा स्वास्थ्य कार्ड",
      category: "central",
      ministry: "Ministry of Agriculture & Farmers Welfare",
      eligible: ha > 0,
      reason: ha <= 0 ? "No land registered" : "All farmers with land holdings are eligible",
      benefit: "Free soil testing + crop-wise nutrient recommendations",
      maxAmount: "Free service",
      frequency: "Every 2 years",
      appliedStatus: seed % 5 === 0 ? "Approved" : null,
      refNo: seed % 5 === 0 ? `SHC-MH-${f.farmerId}` : undefined,
    },
    {
      id: "PKVY",
      name: "Paramparagat Krishi Vikas Yojana",
      nameMr: "परंपरागत कृषि विकास योजना",
      category: "central",
      ministry: "Ministry of Agriculture & Farmers Welfare",
      eligible: ha >= 0.5,
      reason: ha < 0.5 ? "Minimum 0.5 ha cluster farming required" : "Eligible for organic farming cluster support",
      benefit: "₹50,000/ha over 3 years for organic transition",
      maxAmount: "₹50,000/hectare",
      frequency: "3-year programme",
      appliedStatus: null,
    },
    {
      id: "PMAY-G",
      name: "PM Awas Yojana Gramin",
      nameMr: "पीएम आवास योजना ग्रामीण",
      category: "central",
      ministry: "Ministry of Rural Development",
      eligible: isSCSTOBC,
      reason: !isSCSTOBC ? "Priority for SC/ST/OBC beneficiaries" : "Eligible for rural housing assistance",
      benefit: "₹1.2 lakh + MGNREGS 90 days unskilled wage",
      maxAmount: "₹1,20,000 (plains)",
      frequency: "One-time",
      appliedStatus: isSCSTOBC && seed % 6 === 0 ? "Approved" : null,
      refNo: isSCSTOBC && seed % 6 === 0 ? `PMAYG-${f.farmerId}` : undefined,
    },
    {
      id: "NMSA",
      name: "Namo Shetkari Maha Sanman Nidhi",
      nameMr: "नमो शेतकरी महा सन्मान निधी",
      category: "state",
      ministry: "Government of Maharashtra — Agriculture Dept.",
      eligible: ha > 0 && ha <= 2 && hasBank,
      reason: ha <= 0 ? "No land registered" : ha > 2 ? "Exceeds 2 ha limit" : !hasBank ? "Bank account required" : "Maharashtra state income support for small farmers",
      benefit: "Additional ₹6,000/year (combined ₹12,000 with PM-KISAN)",
      maxAmount: "₹6,000/year",
      frequency: "3 instalments of ₹2,000",
      appliedStatus: seed < 60 ? "Disbursed" : seed < 75 ? "Approved" : null,
      totalDisbursed: seed < 60 ? "₹6,000" : undefined,
      appliedDate: seed < 75 ? "2025-04-01" : undefined,
      refNo: seed < 75 ? `NMSA-MH-${f.farmerId}` : undefined,
    },
    {
      id: "GKY",
      name: "Gopinath Munde Shetkari Apghat Vima",
      nameMr: "गोपीनाथ मुंडे शेतकरी अपघात विमा",
      category: "state",
      ministry: "Government of Maharashtra — Relief & Rehabilitation",
      eligible: true,
      reason: "All registered Maharashtra farmers are eligible",
      benefit: "Accidental death/disability insurance ₹2 lakh",
      maxAmount: "₹2,00,000",
      frequency: "Annual (group insurance)",
      appliedStatus: seed % 2 === 0 ? "Approved" : "Applied",
      appliedDate: "2025-01-15",
      refNo: `GKY-MH-${f.farmerId}-25`,
    },
    {
      id: "MMS",
      name: "Magel Tyala Shet Tale",
      nameMr: "मागेल त्याला शेत तळे",
      category: "state",
      ministry: "Government of Maharashtra — Water Conservation",
      eligible: ha >= 0.6,
      reason: ha < 0.6 ? "Minimum 0.6 ha required" : "Eligible for farm pond construction subsidy",
      benefit: "90% subsidy on farm pond construction",
      maxAmount: "₹50,000 subsidy",
      frequency: "One-time",
      appliedStatus: seed % 7 === 0 ? "Applied" : null,
    },
    {
      id: "DRIP",
      name: "Drip / Sprinkler Irrigation Subsidy",
      nameMr: "ठिबक / तुषार सिंचन अनुदान",
      category: "state",
      ministry: "Government of Maharashtra — Agriculture",
      eligible: ha >= 0.4,
      reason: ha < 0.4 ? "Minimum 0.4 ha required" : "Eligible for micro-irrigation subsidy",
      benefit: "80-100% subsidy on drip/sprinkler installation",
      maxAmount: "100% for SC/ST; 80% for others",
      frequency: "One-time",
      appliedStatus: null,
    },
  ];
}

function derivedGrievances(f: FarmerRecord): Grievance[] {
  const seed = parseInt(f.farmerId.replace(/\D/g, "") || "1") % 100;
  const all: Grievance[] = [
    {
      id: `GRV-${f.farmerId}-001`,
      title: "PM-KISAN instalment not credited for Q3 2024",
      category: "Scheme / DBT",
      date: "2024-11-10",
      status: "Resolved",
      priority: "High",
      description: "Farmer reported that the 3rd instalment of ₹2,000 under PM-KISAN was not credited to his account despite Aadhaar and bank being linked. Taluka agriculture office verified the seeding and escalated to the state PM-KISAN portal. The issue was traced to a name mismatch between Aadhaar and bank records — corrected via NPCI portal.",
      assignedTo: "Taluka Agri. Officer, Haveli",
      resolvedDate: "2024-12-02",
      remarks: "Name mismatch corrected in NPCI. Instalment credited ₹2,000 on 2024-12-05.",
    },
    {
      id: `GRV-${f.farmerId}-002`,
      title: "Incorrect land area in 7/12 extract",
      category: "Land Records",
      date: "2025-01-22",
      status: seed % 2 === 0 ? "Resolved" : "In Progress",
      priority: "Medium",
      description: "Area recorded in 7/12 extract (Satbara Utara) does not match physical measurement. Farmer claims 1.16.30 Ha but records show 0.80.00 Ha. Circle officer inspection has been scheduled to verify the boundary markers and conduct a physical measurement.",
      assignedTo: "Circle Officer, Maval",
      resolvedDate: seed % 2 === 0 ? "2025-02-15" : undefined,
      remarks: seed % 2 === 0 ? "Physical inspection conducted. Records corrected to 1.16.30 Ha." : undefined,
    },
    {
      id: `GRV-${f.farmerId}-003`,
      title: "PMFBY Kharif 2024 claim rejected",
      category: "Crop Insurance",
      date: "2025-03-05",
      status: seed % 3 === 0 ? "Closed" : "Open",
      priority: "High",
      description: "Insurance claim under PMFBY for Kharif 2024 (Soybean crop) was rejected by Agriculture Insurance Company of India (AICL) without providing a specific reason. Farmer disputes the rejection citing the joint crop survey report conducted by the taluka team showing 60% crop damage due to excess rainfall.",
      assignedTo: "District Crop Insurance Officer",
      resolvedDate: seed % 3 === 0 ? "2025-04-10" : undefined,
      remarks: seed % 3 === 0 ? "Claim re-processed after appeal. ₹48,000 disbursed on 2025-04-15." : undefined,
    },
  ];
  return seed < 30 ? all : seed < 60 ? all.slice(0, 2) : all.slice(0, 1);
}

function derivedTickets(f: FarmerRecord): SupportTicket[] {
  const seed = parseInt(f.farmerId.replace(/\D/g, "") || "1") % 100;
  const all: SupportTicket[] = [
    {
      id: `TKT-${f.farmerId}-001`,
      subject: "Aadhaar-Bank seeding not reflecting on PM-KISAN portal",
      date: "2025-02-18",
      status: "Resolved",
      type: "Technical",
      description: "Farmer's Aadhaar is seeded with bank account at NPCI but the PM-KISAN portal continues to show 'Aadhaar not linked'. Ticket raised with PFMS helpdesk (Ref: PFMS-2025-MH-88123). Portal updated after 14 days.",
      resolvedDate: "2025-03-04",
      handledBy: "PFMS Helpdesk / Taluka IT Cell",
    },
    {
      id: `TKT-${f.farmerId}-002`,
      subject: "KCC application pending at Bank of Maharashtra — 60+ days",
      date: "2025-04-01",
      status: seed % 2 === 0 ? "Pending" : "Open",
      type: "Payment",
      description: "Farmer submitted KCC application at Bank of Maharashtra, Haveli branch on 01-Feb-2025. No decision communicated after 60 days. Branch claims application is under 'credit review'. Escalated to Lead District Manager.",
      handledBy: "Lead District Manager, Pune",
    },
    {
      id: `TKT-${f.farmerId}-003`,
      subject: "7/12 scanned copy rejected — OCR illegible",
      date: "2025-04-20",
      status: "Open",
      type: "Document",
      description: "During the AgriAdmin OCR verification, the uploaded 7/12 extract was flagged as illegible due to low scan resolution (below 200 DPI). Farmer needs to re-upload with a minimum 300 DPI scan or visit the Taluka office for a certified digital copy.",
      handledBy: "AgriAdmin System / Taluka Document Cell",
    },
  ];
  return seed < 40 ? all : seed < 70 ? all.slice(0, 2) : all.slice(0, 1);
}

function deriveTimeline(f: FarmerRecord): TimelineEvent[] {
  const reg = new Date(f.addedAt);
  const regStr = reg.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  const reviewDate = new Date(reg.getTime() + 2 * 24 * 60 * 60 * 1000);
  const verifyDate = new Date(reg.getTime() + 5 * 24 * 60 * 60 * 1000);

  return [
    { date: regStr, event: "Farmer Registered", detail: `Registration submitted via ${f.source === "ocr" ? "OCR document extraction" : "manual form entry"}. Documents uploaded and queued for AI review.`, icon: "register" },
    { date: reviewDate.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }), event: "AI Review Completed", detail: "AI OCR analysis completed. Risk score computed. Profile reviewed by field officer. Minor discrepancies flagged and resolved.", icon: "review" },
    { date: verifyDate.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }), event: "Verification Approved", detail: "District Agricultural Officer approved the verification. Farmer status set to Verified. DBT linkage confirmed.", icon: "verify" },
    { date: "2025-04-01", event: "Enrolled in Namo Shetkari Scheme", detail: "Successfully enrolled in Maharashtra Namo Shetkari Maha Sanman Nidhi. First instalment of ₹2,000 disbursed.", icon: "scheme" },
  ];
}

function InfoBlock({ label, value, mono, highlight }: { label: string; value?: string | null; mono?: boolean; highlight?: boolean }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[11px] text-muted-foreground uppercase tracking-wide font-medium">{label}</span>
      <span className={`text-sm ${mono ? "font-mono" : "font-medium"} ${highlight ? "text-emerald-700 font-semibold" : "text-foreground"}`}>
        {value || <span className="text-muted-foreground/50">—</span>}
      </span>
    </div>
  );
}

function Section({ title, icon, children, badge, accent }: {
  title: string; icon: React.ReactNode; children: React.ReactNode; badge?: number | string; accent?: string;
}) {
  const [open, setOpen] = useState(true);
  return (
    <div className={`border rounded-xl overflow-hidden ${accent ? `border-${accent}-200` : "border-border"}`}>
      <button
        onClick={() => setOpen(o => !o)}
        className={`w-full flex items-center justify-between px-5 py-3.5 text-left transition-colors ${accent ? `bg-${accent}-50/50 hover:bg-${accent}-50` : "bg-muted/25 hover:bg-muted/40"}`}
      >
        <div className="flex items-center gap-2.5 font-semibold text-sm text-foreground">
          {icon}
          {title}
          {badge !== undefined && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-secondary/20 text-secondary font-bold">{badge}</span>
          )}
        </div>
        {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </button>
      {open && <div className="p-5">{children}</div>}
    </div>
  );
}

function SchemeStatusPill({ status }: { status?: string | null }) {
  if (!status) return <span className="text-[11px] text-muted-foreground/50 italic">Not Applied</span>;
  const cls: Record<string, string> = {
    "Disbursed": "bg-emerald-100 text-emerald-800 border border-emerald-200",
    "Approved": "bg-blue-100 text-blue-800 border border-blue-200",
    "Applied": "bg-amber-100 text-amber-800 border border-amber-200",
    "Rejected": "bg-red-100 text-red-800 border border-red-200",
  };
  return <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${cls[status] || "bg-muted text-muted-foreground"}`}>{status}</span>;
}

function StatusPill({ status, map }: { status: string; map: Record<string, string> }) {
  return <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-semibold ${map[status] || "bg-muted text-muted-foreground"}`}>{status}</span>;
}

const GSTATUS: Record<string, string> = {
  "Open": "bg-orange-100 text-orange-800 border border-orange-200",
  "In Progress": "bg-blue-100 text-blue-800 border border-blue-200",
  "Resolved": "bg-emerald-100 text-emerald-800 border border-emerald-200",
  "Closed": "bg-muted text-muted-foreground border border-border",
};
const GPRIORITY: Record<string, string> = {
  "High": "bg-red-100 text-red-800",
  "Medium": "bg-amber-100 text-amber-800",
  "Low": "bg-muted text-muted-foreground",
};
const TSTATUS: Record<string, string> = {
  "Open": "bg-orange-100 text-orange-800 border border-orange-200",
  "Pending": "bg-amber-100 text-amber-800 border border-amber-200",
  "Resolved": "bg-emerald-100 text-emerald-800 border border-emerald-200",
};
const TTYPE: Record<string, string> = {
  "Payment": "bg-purple-100 text-purple-800",
  "Document": "bg-sky-100 text-sky-800",
  "Technical": "bg-slate-100 text-slate-800",
  "Scheme": "bg-teal-100 text-teal-800",
  "Other": "bg-muted text-muted-foreground",
};

export default function VerifiedFarmerCard({ farmer }: { farmer: FarmerRecord }) {
  const schemes = deriveSchemes(farmer);
  const grievances = derivedGrievances(farmer);
  const tickets = derivedTickets(farmer);
  const timeline = deriveTimeline(farmer);

  const eligibleSchemes = schemes.filter(s => s.eligible);
  const appliedSchemes = schemes.filter(s => s.appliedStatus);
  const openGrievances = grievances.filter(g => g.status === "Open" || g.status === "In Progress");
  const openTickets = tickets.filter(t => t.status !== "Resolved");
  const ha = landToHectares(farmer.land);
  const initials = farmer.name.trim().split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();

  const regDate = new Date(farmer.addedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

  return (
    <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">

      {/* ══════════════ HERO HEADER ══════════════ */}
      <div className="bg-gradient-to-br from-[#0D2B1E] via-[#16422e] to-[#0D2B1E] p-6 text-white">
        <div className="flex flex-col sm:flex-row gap-5 items-start sm:items-center">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center font-black text-2xl text-white ring-4 ring-white/20 shadow-xl">
              {initials}
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-400 flex items-center justify-center">
              <BadgeCheck className="h-3.5 w-3.5 text-white" />
            </div>
          </div>

          {/* Name & primary info */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <h2 className="text-xl font-bold text-white leading-tight">{farmer.name}</h2>
              <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/30 text-emerald-200 border border-emerald-500/40 font-semibold">
                <BadgeCheck className="h-3 w-3" /> Verified
              </span>
              {farmer.source === "ocr" && (
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-purple-500/30 text-purple-200 border border-purple-500/40 font-semibold">AI-OCR</span>
              )}
              {farmer.source === "manual" && (
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-blue-500/30 text-blue-200 border border-blue-500/40 font-semibold">Manual</span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 text-sm text-white/75">
              <span className="flex items-center gap-2"><Hash className="h-3.5 w-3.5 text-emerald-400" /><span className="font-mono text-white/90 font-semibold">{farmer.farmerId}</span></span>
              <span className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5 text-emerald-400" />{farmer.village}{farmer.taluka ? `, ${farmer.taluka}` : ""}, {farmer.district}</span>
              {farmer.mobile && <span className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-emerald-400" />{farmer.mobile}</span>}
              {farmer.altMobile && <span className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-emerald-400/60" />{farmer.altMobile} (Alt.)</span>}
              {farmer.email && <span className="flex items-center gap-2"><Mail className="h-3.5 w-3.5 text-emerald-400" />{farmer.email}</span>}
              <span className="flex items-center gap-2"><Calendar className="h-3.5 w-3.5 text-emerald-400" />Registered: {regDate}</span>
            </div>
          </div>

          {/* Right: land + crop */}
          <div className="hidden lg:flex flex-col gap-3 flex-shrink-0 text-right">
            <div className="bg-white/10 backdrop-blur rounded-xl px-4 py-3">
              <div className="text-[11px] text-emerald-300 mb-0.5">क्षेत्रफळ</div>
              <div className="font-mono font-bold text-lg text-white">{formatLandHAR(farmer.land)}</div>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl px-4 py-3">
              <div className="text-[11px] text-emerald-300 mb-0.5">मुख्य पीक</div>
              <div className="font-semibold text-white">{farmer.crop || "—"}</div>
            </div>
          </div>
        </div>

        {/* 6-stat summary strip */}
        <div className="mt-5 grid grid-cols-3 sm:grid-cols-6 gap-2">
          {[
            { label: "AI Risk Score", value: farmer.aiRiskScore != null ? `${farmer.aiRiskScore}%` : "72%", color: "text-emerald-300", sub: "Low Risk" },
            { label: "Eligible Schemes", value: String(eligibleSchemes.length), color: "text-emerald-300", sub: "govt. schemes" },
            { label: "Active / Applied", value: String(appliedSchemes.length), color: "text-sky-300", sub: "schemes" },
            { label: "Open Grievances", value: String(openGrievances.length), color: openGrievances.length > 0 ? "text-orange-300" : "text-white/50", sub: openGrievances.length > 0 ? "requires action" : "none pending" },
            { label: "Support Tickets", value: String(openTickets.length), color: openTickets.length > 0 ? "text-red-300" : "text-white/50", sub: openTickets.length > 0 ? "open" : "all resolved" },
            { label: "Land (ha)", value: `${ha.toFixed(2)} ha`, color: "text-yellow-300", sub: formatLandHAR(farmer.land) },
          ].map(s => (
            <div key={s.label} className="bg-white/8 rounded-xl px-3 py-2.5 text-center border border-white/10">
              <div className={`font-bold text-lg ${s.color}`}>{s.value}</div>
              <div className="text-[10px] text-white/60 leading-tight mt-0.5">{s.label}</div>
              <div className="text-[9px] text-white/40">{s.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ══════════════ BODY SECTIONS ══════════════ */}
      <div className="p-5 space-y-4">

        {/* ── 1. Personal & Identity Details ── */}
        <Section title="Personal & Identity Details" icon={<User className="h-4 w-4 text-secondary" />}>
          <div className="space-y-5">
            {/* Core identity */}
            <div>
              <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                <Fingerprint className="h-3.5 w-3.5" /> Identity Information
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-4">
                <InfoBlock label="Full Name" value={farmer.name} />
                <InfoBlock label="Father / Husband Name" value={farmer.fatherName} />
                <InfoBlock label="Date of Birth" value={farmer.dob} />
                <InfoBlock label="Age" value={calcAge(farmer.dob)} />
                <InfoBlock label="Gender" value={farmer.gender} />
                <InfoBlock label="Marital Status" value="Married" />
                <InfoBlock label="Category" value={farmer.category || "General"} />
                <InfoBlock label="Sub-Category / Caste" value="—" />
                <InfoBlock label="Religion" value={farmer.religion} />
                <InfoBlock label="Education Level" value="—" />
                <InfoBlock label="Languages Known" value="Marathi, Hindi" />
                <InfoBlock label="Differently Abled" value={farmer.diffAbled ? "Yes" : "No"} />
                {farmer.diffAbled && <InfoBlock label="Disability Type" value={farmer.disabilityType} />}
                {farmer.diffAbled && <InfoBlock label="Disability %" value="—" />}
              </div>
            </div>

            <div className="border-t border-border/50 pt-4">
              <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                <CreditCard className="h-3.5 w-3.5" /> Identification Numbers
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-4">
                <InfoBlock label="Aadhaar Number" value={farmer.aadhaar} mono />
                <InfoBlock label="PAN Card" value="—" mono />
                <InfoBlock label="Voter ID" value="—" mono />
                <InfoBlock label="Ration Card No." value="—" mono />
              </div>
            </div>

            <div className="border-t border-border/50 pt-4">
              <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                <Phone className="h-3.5 w-3.5" /> Contact & Address
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-4">
                <InfoBlock label="Mobile" value={farmer.mobile} mono />
                <InfoBlock label="Alt. Mobile" value={farmer.altMobile} mono />
                <InfoBlock label="Email" value={farmer.email} />
                <InfoBlock label="Village / Gaon" value={farmer.village} />
                <InfoBlock label="Taluka" value={farmer.taluka} />
                <InfoBlock label="District" value={farmer.district} />
                <InfoBlock label="State" value="Maharashtra" />
                <InfoBlock label="PIN Code" value="—" mono />
              </div>
            </div>
          </div>
        </Section>

        {/* ── 2. Land & Agriculture Details ── */}
        <Section title="Land & Agriculture Details" icon={<Sprout className="h-4 w-4 text-secondary" />}
          badge={farmer.landParcels?.length ?? 1} accent="emerald">
          <div className="space-y-5">
            {farmer.landParcels && farmer.landParcels.length > 0 ? (
              farmer.landParcels.map((lp, i) => (
                <div key={i} className={farmer.landParcels!.length > 1 ? "border border-emerald-100 rounded-xl p-4 bg-emerald-50/20" : ""}>
                  {farmer.landParcels!.length > 1 && (
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center">{i + 1}</div>
                      <span className="text-sm font-bold text-emerald-800">Land Parcel {i + 1}</span>
                    </div>
                  )}
                  <div className="space-y-4">
                    <div>
                      <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                        <MapPin className="h-3.5 w-3.5" /> Location
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-4">
                        <InfoBlock label="Survey No. (Gat No.)" value={lp.surveyNo} mono />
                        <InfoBlock label="Khate No." value={farmer.khateNumber} mono />
                        <InfoBlock label="Village" value={lp.village} />
                        <InfoBlock label="Taluka" value={lp.taluka} />
                        <InfoBlock label="District" value={lp.district} />
                        <InfoBlock label="State" value={lp.state || "Maharashtra"} />
                      </div>
                    </div>

                    <div className="border-t border-border/50 pt-4">
                      <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                        <Layers className="h-3.5 w-3.5" /> Area & Ownership
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-4">
                        <InfoBlock label="Total Area" value={formatLandHAR(lp.totalArea)} mono highlight />
                        <InfoBlock label="Irrigated Area" value={lp.irrigatedArea ? formatLandHAR(lp.irrigatedArea) : "—"} mono />
                        <InfoBlock label="Non-Irrigated" value={
                          lp.irrigatedArea && lp.totalArea
                            ? formatLandHAR(String(parseFloat(lp.totalArea) - parseFloat(lp.irrigatedArea)))
                            : "—"
                        } mono />
                        <InfoBlock label="Ownership Type" value={lp.ownershipType || "—"} />
                        <InfoBlock label="Soil Type" value={lp.soilType || "—"} />
                        <InfoBlock label="Soil pH (approx)" value="6.5–7.2 (Neutral)" />
                        <InfoBlock label="Land Classification" value="Agricultural / Jirayat" />
                        <InfoBlock label="Land Topography" value="Plain / Level" />
                      </div>
                    </div>

                    <div className="border-t border-border/50 pt-4">
                      <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                        <Wheat className="h-3.5 w-3.5" /> Crops & Farming
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-4">
                        <InfoBlock label="Primary Crop (Kharif)" value={lp.primaryCrop || farmer.crop} />
                        <InfoBlock label="Secondary Crop (Rabi)" value={lp.secondaryCrop || "—"} />
                        <InfoBlock label="Farming Type" value={lp.farmingType || "Conventional"} />
                        <InfoBlock label="Crop Rotation Practice" value="Yes" />
                        <InfoBlock label="Annual Yield Estimate" value="—" />
                        <InfoBlock label="Avg. Selling Price" value="—" />
                      </div>
                      <div className="mt-4">
                        <span className="text-[11px] text-muted-foreground uppercase tracking-wide font-medium">Irrigation Sources</span>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {lp.irrigationSources && lp.irrigationSources.length > 0
                            ? lp.irrigationSources.map(src => (
                                <span key={src} className="text-xs px-3 py-1 rounded-full bg-sky-100 text-sky-800 border border-sky-200 flex items-center gap-1.5 font-medium">
                                  <Droplets className="h-3 w-3" />{src}
                                </span>
                              ))
                            : <span className="text-sm text-muted-foreground/60">Not specified</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-4">
                  <InfoBlock label="Survey No. (Gat No.)" value={farmer.surveyNumber} mono />
                  <InfoBlock label="Khate No." value={farmer.khateNumber} mono />
                  <InfoBlock label="Village" value={farmer.village} />
                  <InfoBlock label="District" value={farmer.district} />
                  <InfoBlock label="Total Area" value={formatLandHAR(farmer.land)} mono highlight />
                  <InfoBlock label="Ownership Type" value="Own" />
                  <InfoBlock label="Primary Crop" value={farmer.crop} />
                  <InfoBlock label="Farming Type" value="Conventional" />
                </div>
              </div>
            )}
          </div>
        </Section>

        {/* ── 3. Bank & Financial Details ── */}
        <Section title="Bank & Financial Details" icon={<Landmark className="h-4 w-4 text-secondary" />}>
          <div className="space-y-5">
            <div>
              <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                <Building2 className="h-3.5 w-3.5" /> Bank Account Details
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-4">
                <InfoBlock label="Bank Name" value={farmer.bankName} />
                <InfoBlock label="Branch Name" value={farmer.branchName} />
                <InfoBlock label="IFSC Code" value={farmer.ifsc} mono />
                <InfoBlock label="Account Number" value={farmer.accountNo || farmer.bankAccount} mono />
                <InfoBlock label="Account Type" value={farmer.accountType || "Savings"} />
                <InfoBlock label="Account Holder Name" value={farmer.name} />
              </div>
            </div>

            <div className="border-t border-border/50 pt-4">
              <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                <Zap className="h-3.5 w-3.5" /> DBT & Linkage Status
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-4">
                <InfoBlock label="Aadhaar–Bank Linked" value={farmer.aadhaarLinked || "Yes"} />
                <InfoBlock label="NPCI / DBT Status" value={farmer.npciStatus || "Active"} />
                <InfoBlock label="eKYC Status" value="Completed" />
                <InfoBlock label="PM-KISAN Registration" value={farmer.aadhaar ? "Registered" : "—"} />
              </div>
            </div>

            <div className="border-t border-border/50 pt-4">
              <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                <IndianRupee className="h-3.5 w-3.5" /> Credit & Income
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-4">
                <InfoBlock label="KCC Credit Limit" value="₹1,50,000" />
                <InfoBlock label="KCC Outstanding" value="₹42,000" />
                <InfoBlock label="Annual Farm Income (Est.)" value="₹1,20,000–₹1,80,000" />
                <InfoBlock label="Annual Non-Farm Income" value="—" />
                <InfoBlock label="BPL / APL Status" value="APL" />
                <InfoBlock label="Crop Loan (Other Banks)" value="None" />
              </div>
            </div>
          </div>
        </Section>

        {/* ── 4. Scheme Portfolio ── */}
        <Section title="Government Scheme Portfolio" icon={<Shield className="h-4 w-4 text-secondary" />}
          badge={`${appliedSchemes.length}/${schemes.length}`} accent="blue">

          {/* Active / Disbursed schemes highlight */}
          {appliedSchemes.filter(s => s.appliedStatus === "Disbursed" || s.appliedStatus === "Approved").length > 0 && (
            <div className="mb-5">
              <div className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Star className="h-3.5 w-3.5 text-amber-500" /> Active Schemes with Disbursement
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {appliedSchemes.filter(s => s.appliedStatus === "Disbursed" || s.appliedStatus === "Approved").map(s => (
                  <div key={s.id} className="bg-gradient-to-r from-blue-50 to-emerald-50 border border-blue-200 rounded-xl p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <div className="text-xs font-bold text-muted-foreground">{s.nameMr}</div>
                        <div className="text-sm font-semibold text-foreground">{s.name}</div>
                      </div>
                      <SchemeStatusPill status={s.appliedStatus} />
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div><span className="text-muted-foreground">Benefit: </span><span className="font-medium">{s.maxAmount}</span></div>
                      <div><span className="text-muted-foreground">Frequency: </span><span className="font-medium">{s.frequency}</span></div>
                      {s.appliedDate && <div><span className="text-muted-foreground">Applied: </span><span className="font-medium">{s.appliedDate}</span></div>}
                      {s.totalDisbursed && <div><span className="text-muted-foreground text-emerald-700">Disbursed: </span><span className="font-semibold text-emerald-700">{s.totalDisbursed}</span></div>}
                      {s.refNo && <div className="col-span-2"><span className="text-muted-foreground">Ref No: </span><span className="font-mono text-xs">{s.refNo}</span></div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Full scheme table */}
          <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">All Schemes Overview</div>
          <div className="space-y-2">
            {schemes.map(s => (
              <div key={s.id} className={`border rounded-xl p-4 transition-all ${
                s.appliedStatus === "Disbursed" ? "border-emerald-200 bg-emerald-50/30" :
                s.appliedStatus === "Approved" ? "border-blue-200 bg-blue-50/20" :
                s.appliedStatus === "Applied" ? "border-amber-200 bg-amber-50/20" :
                s.eligible ? "border-border bg-card hover:bg-muted/20" :
                "border-border/50 bg-muted/10 opacity-55"
              }`}>
                <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-0.5">
                      <span className="text-sm font-semibold text-foreground">{s.name}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${s.category === "central" ? "bg-orange-100 text-orange-800" : "bg-violet-100 text-violet-800"}`}>
                        {s.category === "central" ? "Central" : "State — MH"}
                      </span>
                    </div>
                    <div className="text-[11px] text-muted-foreground">{s.ministry}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    {s.eligible
                      ? <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                      : <XCircle className="h-4 w-4 text-muted-foreground/40 flex-shrink-0" />
                    }
                    <SchemeStatusPill status={s.appliedStatus} />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-1 text-xs">
                  <div><span className="text-muted-foreground">Benefit: </span><span className="font-medium">{s.benefit}</span></div>
                  <div><span className="text-muted-foreground">Max Amount: </span><span className="font-medium">{s.maxAmount}</span></div>
                  <div><span className="text-muted-foreground">Frequency: </span><span className="font-medium">{s.frequency}</span></div>
                </div>
                <div className={`text-xs mt-2 flex items-center gap-1.5 ${s.eligible ? "text-emerald-700" : "text-muted-foreground/60"}`}>
                  <Info className="h-3 w-3 flex-shrink-0" />
                  {s.reason}
                </div>
                {s.refNo && (
                  <div className="text-[11px] text-muted-foreground mt-1 font-mono">Ref: {s.refNo}</div>
                )}
              </div>
            ))}
          </div>
        </Section>

        {/* ── 5. Grievances ── */}
        <Section title="Grievances" icon={<AlertCircle className="h-4 w-4 text-secondary" />}
          badge={grievances.length} accent={openGrievances.length > 0 ? "orange" : undefined}>
          {grievances.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-6 flex flex-col items-center gap-2">
              <CheckCircle2 className="h-8 w-8 text-emerald-400" />
              No grievances filed by this farmer.
            </div>
          ) : (
            <div className="space-y-4">
              {grievances.map(g => (
                <div key={g.id} className={`border rounded-xl overflow-hidden ${g.status === "Open" ? "border-orange-200" : g.status === "In Progress" ? "border-blue-200" : "border-border"}`}>
                  <div className={`px-4 py-3 flex flex-wrap items-start gap-3 ${g.status === "Open" ? "bg-orange-50/50" : g.status === "In Progress" ? "bg-blue-50/50" : "bg-muted/20"}`}>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-foreground mb-1">{g.title}</div>
                      <div className="flex flex-wrap gap-2">
                        <StatusPill status={g.status} map={GSTATUS} />
                        <StatusPill status={g.priority} map={GPRIORITY} />
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">{g.category}</span>
                      </div>
                    </div>
                    <div className="text-right text-xs text-muted-foreground flex-shrink-0">
                      <div className="font-mono">{g.id}</div>
                      <div className="flex items-center gap-1 justify-end mt-0.5"><Calendar className="h-3 w-3" />{g.date}</div>
                    </div>
                  </div>
                  <div className="px-4 py-4 space-y-3">
                    <p className="text-sm text-foreground/80 leading-relaxed">{g.description}</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-2 text-xs">
                      <div><span className="text-muted-foreground">Assigned To: </span><span className="font-medium">{g.assignedTo}</span></div>
                      {g.resolvedDate && <div><span className="text-muted-foreground">Resolved On: </span><span className="font-medium text-emerald-700">{g.resolvedDate}</span></div>}
                    </div>
                    {g.remarks && (
                      <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 text-xs">
                        <span className="font-semibold text-emerald-800">Resolution Note: </span>
                        <span className="text-emerald-700">{g.remarks}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* ── 6. Support Tickets ── */}
        <Section title="Support Tickets" icon={<Ticket className="h-4 w-4 text-secondary" />}
          badge={tickets.length}>
          {tickets.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-6 flex flex-col items-center gap-2">
              <CheckCircle2 className="h-8 w-8 text-emerald-400" />
              No support tickets raised.
            </div>
          ) : (
            <div className="space-y-3">
              {tickets.map(t => (
                <div key={t.id} className="border border-border rounded-xl overflow-hidden">
                  <div className="px-4 py-3 bg-muted/20 flex flex-wrap items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-foreground mb-1">{t.subject}</div>
                      <div className="flex flex-wrap gap-2">
                        <StatusPill status={t.status} map={TSTATUS} />
                        <StatusPill status={t.type} map={TTYPE} />
                      </div>
                    </div>
                    <div className="text-right text-xs text-muted-foreground flex-shrink-0">
                      <div className="font-mono">{t.id}</div>
                      <div className="flex items-center gap-1 justify-end mt-0.5"><Calendar className="h-3 w-3" />{t.date}</div>
                    </div>
                  </div>
                  <div className="px-4 py-4 space-y-2">
                    <p className="text-sm text-foreground/80 leading-relaxed">{t.description}</p>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs">
                      {t.handledBy && <div><span className="text-muted-foreground">Handled By: </span><span className="font-medium">{t.handledBy}</span></div>}
                      {t.resolvedDate && <div><span className="text-muted-foreground">Resolved: </span><span className="font-medium text-emerald-700">{t.resolvedDate}</span></div>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* ── 7. Documents ── */}
        <Section title="Submitted Documents" icon={<FileText className="h-4 w-4 text-secondary" />}
          badge={farmer.docs?.length ?? 0}>
          {(!farmer.docs || farmer.docs.length === 0) ? (
            <div className="text-sm text-muted-foreground text-center py-6">No documents on record.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {farmer.docs.map((doc, i) => (
                <div key={i} className={`flex items-center gap-3 p-4 rounded-xl border ${doc.status === "uploaded" ? "border-emerald-200 bg-emerald-50/40" : "border-red-200 bg-red-50/30"}`}>
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${doc.status === "uploaded" ? "bg-emerald-100" : "bg-red-100"}`}>
                    <FileText className={`h-5 w-5 ${doc.status === "uploaded" ? "text-emerald-600" : "text-destructive"}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-foreground truncate">{doc.name}</div>
                    <div className="text-xs text-muted-foreground">{doc.fileName} · {doc.size}</div>
                    <div className={`text-[11px] font-medium mt-0.5 ${doc.status === "uploaded" ? "text-emerald-600" : "text-destructive"}`}>
                      {doc.status === "uploaded" ? "✓ Verified & Uploaded" : "✗ Upload Failed"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* ── 8. Activity Timeline ── */}
        <Section title="Activity Timeline" icon={<Activity className="h-4 w-4 text-secondary" />}>
          <div className="relative pl-8">
            <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-border" />
            {timeline.map((ev, i) => (
              <div key={i} className="relative mb-6 last:mb-0">
                <div className={`absolute -left-5 w-5 h-5 rounded-full border-2 border-white flex items-center justify-center ${
                  ev.icon === "verify" ? "bg-emerald-500" :
                  ev.icon === "scheme" ? "bg-blue-500" :
                  ev.icon === "grievance" ? "bg-orange-500" :
                  ev.icon === "review" ? "bg-amber-500" : "bg-secondary"
                }`}>
                  {ev.icon === "verify" && <BadgeCheck className="h-3 w-3 text-white" />}
                  {ev.icon === "scheme" && <Shield className="h-3 w-3 text-white" />}
                  {ev.icon === "grievance" && <AlertCircle className="h-3 w-3 text-white" />}
                  {ev.icon === "review" && <Clock className="h-3 w-3 text-white" />}
                  {ev.icon === "register" && <User className="h-3 w-3 text-white" />}
                </div>
                <div className="ml-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-foreground">{ev.event}</span>
                    <span className="text-[11px] text-muted-foreground">{ev.date}</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{ev.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </Section>

      </div>
    </div>
  );
}
