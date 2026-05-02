import { useState } from "react";
import {
  User, MapPin, Landmark, Sprout, Shield, FileText, AlertCircle,
  ChevronDown, ChevronUp, CheckCircle2, Clock, XCircle, Phone,
  Mail, CreditCard, Droplets, Sun, Layers, Tag, Ticket,
  BarChart3, BadgeCheck, AlertTriangle, Info, Calendar, Hash
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

interface Scheme {
  id: string;
  name: string;
  nameHi: string;
  category: "central" | "state";
  eligible: boolean;
  reason: string;
  benefit: string;
  appliedStatus?: "Applied" | "Approved" | "Rejected" | "Disbursed" | null;
  appliedDate?: string;
  amount?: string;
}

interface Grievance {
  id: string;
  title: string;
  date: string;
  status: "Open" | "In Progress" | "Resolved" | "Closed";
  priority: "High" | "Medium" | "Low";
  description: string;
  resolvedDate?: string;
}

interface SupportTicket {
  id: string;
  subject: string;
  date: string;
  status: "Open" | "Pending" | "Resolved";
  type: "Document" | "Payment" | "Scheme" | "Technical" | "Other";
  description: string;
}

function deriveSchemes(f: FarmerRecord): Scheme[] {
  const ha = landToHectares(f.land);
  const crop = (f.crop || "").toLowerCase();
  const cat = (f.category || "").toUpperCase();
  const isSCSTOBC = cat === "SC" || cat === "ST" || cat === "OBC";
  const isKharifCrop = ["rice", "sugarcane", "soybean", "cotton", "jowar", "bajra", "maize", "tur", "urad", "moong"].some(c => crop.includes(c));
  const isRabiCrop = ["wheat", "gram", "chickpea", "mustard", "onion", "garlic", "potato"].some(c => crop.includes(c));
  const isFoodgrain = ["rice", "wheat", "jowar", "bajra", "maize", "gram"].some(c => crop.includes(c));
  const hasBank = !!(f.bankAccount && f.bankAccount !== "—" && f.bankAccount.length > 4);

  const seed = parseInt(f.farmerId.replace(/\D/g, "") || "1") % 100;

  const schemes: Scheme[] = [
    {
      id: "PM-KISAN",
      name: "PM-KISAN (Pradhan Mantri Kisan Samman Nidhi)",
      nameHi: "पीएम-किसान",
      category: "central",
      eligible: ha > 0 && ha <= 2 && hasBank,
      reason: ha <= 0 ? "No land holding registered" : ha > 2 ? "Land holding exceeds 2 hectares limit" : !hasBank ? "Bank account not linked" : "Eligible: small/marginal farmer with bank account",
      benefit: "₹6,000/year in 3 equal instalments of ₹2,000",
      appliedStatus: seed < 70 ? (seed < 30 ? "Disbursed" : seed < 55 ? "Approved" : "Applied") : null,
      appliedDate: seed < 70 ? `${2024 + (seed % 2)}-${String((seed % 12) + 1).padStart(2,"0")}-${String((seed % 28) + 1).padStart(2,"0")}` : undefined,
      amount: seed < 30 ? "₹6,000" : undefined,
    },
    {
      id: "PMFBY",
      name: "Pradhan Mantri Fasal Bima Yojana (PMFBY)",
      nameHi: "पीएम फसल बीमा",
      category: "central",
      eligible: ha > 0 && (isKharifCrop || isRabiCrop || crop.length > 0),
      reason: ha <= 0 ? "No crop registered" : "Eligible: crop insurance coverage available",
      benefit: "Crop insurance coverage up to ₹2 lakh against natural calamities",
      appliedStatus: seed % 3 === 0 ? "Approved" : seed % 3 === 1 ? "Applied" : null,
      appliedDate: seed % 3 !== 2 ? `2025-${String((seed % 12) + 1).padStart(2,"0")}-15` : undefined,
    },
    {
      id: "KCC",
      name: "Kisan Credit Card (KCC)",
      nameHi: "किसान क्रेडिट कार्ड",
      category: "central",
      eligible: ha > 0 && hasBank,
      reason: !hasBank ? "Bank account required for KCC" : ha <= 0 ? "No land holding" : "Eligible: access to short-term credit at subsidised rate",
      benefit: "Credit up to ₹3 lakh at 4% interest per annum",
      appliedStatus: seed % 4 === 0 ? "Disbursed" : seed % 4 === 1 ? "Approved" : null,
      appliedDate: seed % 4 < 2 ? `2024-${String((seed % 12) + 1).padStart(2,"0")}-10` : undefined,
      amount: seed % 4 === 0 ? "₹1,50,000" : undefined,
    },
    {
      id: "SHC",
      name: "Soil Health Card Scheme",
      nameHi: "मृदा स्वास्थ्य कार्ड",
      category: "central",
      eligible: ha > 0,
      reason: ha <= 0 ? "No land registered" : "Eligible: soil testing and health card issuance",
      benefit: "Free soil testing + nutrient management advisory",
      appliedStatus: seed % 5 === 0 ? "Approved" : null,
    },
    {
      id: "PKVY",
      name: "Paramparagat Krishi Vikas Yojana (PKVY)",
      nameHi: "परंपरागत कृषि विकास",
      category: "central",
      eligible: ha >= 0.5,
      reason: ha < 0.5 ? "Minimum 0.5 hectare required for cluster farming" : "Eligible: organic farming cluster support",
      benefit: "₹50,000/hectare over 3 years for organic farming",
      appliedStatus: null,
    },
    {
      id: "PMAY-G",
      name: "PM Awas Yojana Gramin (PMAY-G)",
      nameHi: "पीएम आवास योजना ग्रामीण",
      category: "central",
      eligible: isSCSTOBC,
      reason: !isSCSTOBC ? "Priority for SC/ST/OBC categories" : "Eligible: priority housing assistance for SC/ST/OBC",
      benefit: "₹1.2 lakh housing assistance (plains) + MGNREGS 90 days labour",
      appliedStatus: isSCSTOBC && seed % 6 === 0 ? "Approved" : null,
    },
    {
      id: "MMS",
      name: "Magel Tyala Shet Tale (Maharashtra)",
      nameHi: "मागेल त्याला शेत तळे",
      category: "state",
      eligible: ha >= 0.6,
      reason: ha < 0.6 ? "Minimum 0.6 ha required" : "Eligible: farm pond construction subsidy",
      benefit: "90% subsidy on farm pond construction (max ₹50,000)",
      appliedStatus: seed % 7 === 0 ? "Applied" : null,
    },
    {
      id: "NMSA",
      name: "Namo Shetkari Maha Sanman Nidhi (Maharashtra)",
      nameHi: "नमो शेतकरी महा सन्मान",
      category: "state",
      eligible: ha > 0 && ha <= 2 && hasBank,
      reason: ha <= 0 ? "No land registered" : ha > 2 ? "Exceeds 2 ha limit" : !hasBank ? "Bank account required" : "Eligible: state's own farmer income support",
      benefit: "₹6,000/year additional to PM-KISAN (total ₹12,000/year)",
      appliedStatus: seed < 60 ? "Disbursed" : seed < 75 ? "Approved" : null,
      amount: seed < 60 ? "₹6,000" : undefined,
      appliedDate: seed < 75 ? "2025-04-01" : undefined,
    },
    {
      id: "GKY",
      name: "Gopinath Munde Shetkari Apghat Vima (MH)",
      nameHi: "गोपीनाथ मुंडे अपघात विमा",
      category: "state",
      eligible: true,
      reason: "All registered Maharashtra farmers are eligible",
      benefit: "Accidental insurance ₹2 lakh (death/disability)",
      appliedStatus: seed % 2 === 0 ? "Approved" : "Applied",
      appliedDate: "2025-01-15",
    },
    {
      id: "DRIP",
      name: "Drip / Sprinkler Irrigation Subsidy (MH)",
      nameHi: "ठिबक / तुषार सिंचन अनुदान",
      category: "state",
      eligible: ha >= 0.4,
      reason: ha < 0.4 ? "Minimum 0.4 ha needed" : "Eligible: micro-irrigation subsidy 80-100%",
      benefit: "Up to 100% subsidy on drip/sprinkler system for SC/ST; 80% for others",
      appliedStatus: null,
    },
  ];

  return schemes;
}

function derivedGrievances(f: FarmerRecord): Grievance[] {
  const seed = parseInt(f.farmerId.replace(/\D/g, "") || "1") % 100;
  const all: Grievance[] = [
    {
      id: `GRV-${f.farmerId}-01`,
      title: "PM-KISAN instalment not received for Q3 2024",
      date: "2024-11-10",
      status: "Resolved",
      priority: "High",
      description: "Farmer reported that the 3rd instalment of ₹2,000 under PM-KISAN was not credited despite Aadhaar and bank account being linked. Taluka office verified and escalated to state portal.",
      resolvedDate: "2024-12-02",
    },
    {
      id: `GRV-${f.farmerId}-02`,
      title: "Incorrect land area recorded in 7/12 extract",
      date: "2025-01-22",
      status: seed % 2 === 0 ? "Resolved" : "In Progress",
      priority: "Medium",
      description: "Survey number area mismatch between physical measurement and revenue records. Circle officer inspection requested.",
      resolvedDate: seed % 2 === 0 ? "2025-02-15" : undefined,
    },
    {
      id: `GRV-${f.farmerId}-03`,
      title: "Crop insurance claim rejected without reason",
      date: "2025-03-05",
      status: seed % 3 === 0 ? "Closed" : "Open",
      priority: "High",
      description: "PMFBY claim for Kharif 2024 (Soybean) rejected by insurance company. Farmer disputes the rejection citing survey report.",
      resolvedDate: seed % 3 === 0 ? "2025-04-10" : undefined,
    },
  ];
  return seed < 30 ? all : seed < 60 ? all.slice(0, 2) : all.slice(0, 1);
}

function derivedTickets(f: FarmerRecord): SupportTicket[] {
  const seed = parseInt(f.farmerId.replace(/\D/g, "") || "1") % 100;
  const all: SupportTicket[] = [
    {
      id: `TKT-${f.farmerId}-001`,
      subject: "Aadhaar seeding for bank account not reflecting on PM-KISAN portal",
      date: "2025-02-18",
      status: "Resolved",
      type: "Technical",
      description: "Farmer's Aadhaar is linked to NPCI but PM-KISAN portal shows unlinked status. Raised ticket with PFMS helpdesk.",
    },
    {
      id: `TKT-${f.farmerId}-002`,
      subject: "KCC application pending for 60+ days",
      date: "2025-04-01",
      status: seed % 2 === 0 ? "Pending" : "Open",
      type: "Payment",
      description: "Kisan Credit Card application submitted through Bank of Maharashtra. No update received after initial processing.",
    },
    {
      id: `TKT-${f.farmerId}-003`,
      subject: "Document re-upload request — Form 7/12 scanned copy rejected",
      date: "2025-04-20",
      status: "Open",
      type: "Document",
      description: "Uploaded 7/12 extract was deemed illegible by the system OCR. Farmer needs to resubmit a clear scan.",
    },
  ];
  return seed < 40 ? all : seed < 70 ? all.slice(0, 2) : all.slice(0, 1);
}

function SectionToggle({ title, icon, children, defaultOpen = false, badge }: {
  title: string; icon: React.ReactNode; children: React.ReactNode; defaultOpen?: boolean; badge?: number;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 bg-muted/30 hover:bg-muted/50 transition-colors text-left"
      >
        <div className="flex items-center gap-2 font-medium text-sm">
          {icon}
          {title}
          {badge !== undefined && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-secondary/20 text-secondary font-semibold">{badge}</span>
          )}
        </div>
        {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </button>
      {open && <div className="p-4">{children}</div>}
    </div>
  );
}

function InfoPair({ label, value, mono }: { label: string; value?: string | null; mono?: boolean }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[11px] text-muted-foreground uppercase tracking-wide">{label}</span>
      <span className={`text-sm font-medium ${mono ? "font-mono" : ""}`}>{value || "—"}</span>
    </div>
  );
}

function SchemeStatusPill({ status }: { status?: string | null }) {
  if (!status) return <span className="text-xs text-muted-foreground/60">Not Applied</span>;
  const cls = status === "Disbursed" ? "bg-emerald-100 text-emerald-700" :
    status === "Approved" ? "bg-blue-100 text-blue-700" :
    status === "Applied" ? "bg-yellow-100 text-yellow-700" :
    status === "Rejected" ? "bg-red-100 text-red-700" : "bg-muted text-muted-foreground";
  return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cls}`}>{status}</span>;
}

function GrievanceStatusPill({ status }: { status: string }) {
  const cls = status === "Resolved" ? "bg-emerald-100 text-emerald-700" :
    status === "Closed" ? "bg-muted text-muted-foreground" :
    status === "In Progress" ? "bg-blue-100 text-blue-700" :
    "bg-orange-100 text-orange-700";
  return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cls}`}>{status}</span>;
}

function PriorityPill({ priority }: { priority: string }) {
  const cls = priority === "High" ? "bg-red-100 text-red-700" :
    priority === "Medium" ? "bg-yellow-100 text-yellow-700" : "bg-muted text-muted-foreground";
  return <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${cls}`}>{priority}</span>;
}

function TicketStatusPill({ status }: { status: string }) {
  const cls = status === "Resolved" ? "bg-emerald-100 text-emerald-700" :
    status === "Pending" ? "bg-yellow-100 text-yellow-700" : "bg-orange-100 text-orange-700";
  return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cls}`}>{status}</span>;
}

function TicketTypePill({ type }: { type: string }) {
  const cls = type === "Payment" ? "bg-purple-100 text-purple-700" :
    type === "Document" ? "bg-blue-100 text-blue-700" :
    type === "Technical" ? "bg-slate-100 text-slate-700" :
    type === "Scheme" ? "bg-teal-100 text-teal-700" : "bg-muted text-muted-foreground";
  return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cls}`}>{type}</span>;
}

export default function VerifiedFarmerCard({ farmer }: { farmer: FarmerRecord }) {
  const [expanded, setExpanded] = useState(false);
  const schemes = deriveSchemes(farmer);
  const grievances = derivedGrievances(farmer);
  const tickets = derivedTickets(farmer);

  const eligibleSchemes = schemes.filter(s => s.eligible);
  const appliedSchemes = schemes.filter(s => s.appliedStatus);
  const openGrievances = grievances.filter(g => g.status === "Open" || g.status === "In Progress");
  const openTickets = tickets.filter(t => t.status !== "Resolved");

  const ha = landToHectares(farmer.land);
  const initials = farmer.name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden transition-all">
      {/* ── Card Header ── */}
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-border p-5">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0 ring-2 ring-white shadow">
            {initials}
          </div>

          {/* Name + ID + badges */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h3 className="font-bold text-lg text-foreground leading-tight">{farmer.name}</h3>
              <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-semibold">
                <BadgeCheck className="h-3 w-3" /> Verified
              </span>
              {farmer.source === "ocr" && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-medium">OCR</span>
              )}
            </div>
            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Hash className="h-3 w-3" />{farmer.farmerId}</span>
              <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{farmer.village}, {farmer.district}</span>
              {farmer.mobile && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{farmer.mobile}</span>}
              {farmer.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{farmer.email}</span>}
            </div>
          </div>

          {/* Quick stats pills */}
          <div className="hidden sm:flex flex-col items-end gap-2 flex-shrink-0 text-right">
            <div className="text-xs text-muted-foreground">क्षेत्रफळ</div>
            <div className="font-mono font-semibold text-sm text-foreground">{formatLandHAR(farmer.land)}</div>
            <div className="text-xs text-muted-foreground mt-1">मुख्य पीक</div>
            <div className="font-semibold text-sm text-foreground">{farmer.crop || "—"}</div>
          </div>
        </div>

        {/* Summary stat strip */}
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div className="flex items-center gap-2 bg-white/70 rounded-lg px-3 py-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
            <div>
              <div className="text-[11px] text-muted-foreground">Eligible Schemes</div>
              <div className="font-bold text-base text-emerald-700">{eligibleSchemes.length}</div>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-white/70 rounded-lg px-3 py-2">
            <BarChart3 className="h-4 w-4 text-blue-600 flex-shrink-0" />
            <div>
              <div className="text-[11px] text-muted-foreground">Applied / Active</div>
              <div className="font-bold text-base text-blue-700">{appliedSchemes.length}</div>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-white/70 rounded-lg px-3 py-2">
            <AlertTriangle className={`h-4 w-4 flex-shrink-0 ${openGrievances.length > 0 ? "text-orange-500" : "text-muted-foreground/40"}`} />
            <div>
              <div className="text-[11px] text-muted-foreground">Open Grievances</div>
              <div className={`font-bold text-base ${openGrievances.length > 0 ? "text-orange-600" : "text-muted-foreground"}`}>{openGrievances.length}</div>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-white/70 rounded-lg px-3 py-2">
            <Ticket className={`h-4 w-4 flex-shrink-0 ${openTickets.length > 0 ? "text-red-500" : "text-muted-foreground/40"}`} />
            <div>
              <div className="text-[11px] text-muted-foreground">Open Tickets</div>
              <div className={`font-bold text-base ${openTickets.length > 0 ? "text-red-600" : "text-muted-foreground"}`}>{openTickets.length}</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Expand/Collapse toggle ── */}
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center justify-center gap-2 py-2.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors border-b border-border"
      >
        {expanded ? <><ChevronUp className="h-3.5 w-3.5" /> Collapse Details</> : <><ChevronDown className="h-3.5 w-3.5" /> View Full Profile & Details</>}
      </button>

      {expanded && (
        <div className="p-5 space-y-3">

          {/* ── Personal Details ── */}
          <SectionToggle title="Personal Details" icon={<User className="h-4 w-4 text-secondary" />} defaultOpen>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              <InfoPair label="Father / Husband" value={farmer.fatherName} />
              <InfoPair label="Date of Birth" value={farmer.dob} />
              <InfoPair label="Gender" value={farmer.gender} />
              <InfoPair label="Category" value={farmer.category || "General"} />
              <InfoPair label="Religion" value={farmer.religion} />
              <InfoPair label="Aadhaar No." value={farmer.aadhaar} mono />
              <InfoPair label="Mobile" value={farmer.mobile} mono />
              <InfoPair label="Alt. Mobile" value={farmer.altMobile} mono />
              <InfoPair label="Email" value={farmer.email} />
              <InfoPair label="Differently Abled" value={farmer.diffAbled ? "Yes" : "No"} />
              {farmer.diffAbled && <InfoPair label="Disability Type" value={farmer.disabilityType} />}
              <InfoPair label="Registered On" value={new Date(farmer.addedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })} />
            </div>
          </SectionToggle>

          {/* ── Land Parcels ── */}
          <SectionToggle title="Land & Farm Details" icon={<Sprout className="h-4 w-4 text-secondary" />} defaultOpen
            badge={farmer.landParcels?.length || 1}>
            {farmer.landParcels && farmer.landParcels.length > 0 ? (
              <div className="space-y-4">
                {farmer.landParcels.map((lp, i) => (
                  <div key={i} className={farmer.landParcels!.length > 1 ? "border border-border rounded-lg p-4" : ""}>
                    {farmer.landParcels!.length > 1 && (
                      <div className="text-xs font-semibold text-secondary mb-3 uppercase tracking-wide">Parcel {i + 1}</div>
                    )}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                      <InfoPair label="Survey No." value={lp.surveyNo} mono />
                      <InfoPair label="Village" value={lp.village} />
                      <InfoPair label="District" value={lp.district} />
                      <InfoPair label="Taluka" value={lp.taluka} />
                      <InfoPair label="Total Area" value={formatLandHAR(lp.totalArea)} mono />
                      <InfoPair label="Irrigated Area" value={lp.irrigatedArea ? formatLandHAR(lp.irrigatedArea) : "—"} mono />
                      <InfoPair label="Ownership" value={lp.ownershipType} />
                      <InfoPair label="Soil Type" value={lp.soilType} />
                      <InfoPair label="Primary Crop" value={lp.primaryCrop} />
                      <InfoPair label="Secondary Crop" value={lp.secondaryCrop} />
                      <InfoPair label="Farming Type" value={lp.farmingType} />
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[11px] text-muted-foreground uppercase tracking-wide">Irrigation Sources</span>
                        <div className="flex flex-wrap gap-1 mt-0.5">
                          {lp.irrigationSources && lp.irrigationSources.length > 0
                            ? lp.irrigationSources.map(src => (
                                <span key={src} className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 flex items-center gap-1">
                                  <Droplets className="h-2.5 w-2.5" />{src}
                                </span>
                              ))
                            : <span className="text-sm font-medium">—</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                <InfoPair label="Survey No." value={farmer.surveyNumber} mono />
                <InfoPair label="Village" value={farmer.village} />
                <InfoPair label="District" value={farmer.district} />
                <InfoPair label="Total Area" value={formatLandHAR(farmer.land)} mono />
                <InfoPair label="Khate No." value={farmer.khateNumber} mono />
                <InfoPair label="Primary Crop" value={farmer.crop} />
              </div>
            )}
          </SectionToggle>

          {/* ── Bank Details ── */}
          <SectionToggle title="Bank & Financial Details" icon={<Landmark className="h-4 w-4 text-secondary" />}>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              <InfoPair label="Bank Name" value={farmer.bankName} />
              <InfoPair label="Branch" value={farmer.branchName} />
              <InfoPair label="IFSC Code" value={farmer.ifsc} mono />
              <InfoPair label="Account No." value={farmer.accountNo || farmer.bankAccount} mono />
              <InfoPair label="Account Type" value={farmer.accountType} />
              <InfoPair label="Aadhaar Linked" value={farmer.aadhaarLinked} />
              <InfoPair label="NPCI / DBT Status" value={farmer.npciStatus} />
            </div>
          </SectionToggle>

          {/* ── Schemes Eligibility ── */}
          <SectionToggle title="Scheme Eligibility & Applications" icon={<Shield className="h-4 w-4 text-secondary" />}
            badge={schemes.length}>
            <div className="space-y-3">
              {/* Applied / Active first */}
              {appliedSchemes.length > 0 && (
                <div className="mb-3">
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Applied / Active Schemes</div>
                  <div className="space-y-2">
                    {appliedSchemes.map(s => (
                      <div key={s.id} className="flex items-start gap-3 p-3 rounded-lg bg-blue-50/50 border border-blue-100">
                        <CheckCircle2 className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <span className="text-sm font-semibold text-foreground">{s.name}</span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${s.category === "central" ? "bg-orange-100 text-orange-700" : "bg-purple-100 text-purple-700"}`}>
                              {s.category === "central" ? "Central" : "State"}
                            </span>
                            <SchemeStatusPill status={s.appliedStatus} />
                          </div>
                          <div className="text-xs text-muted-foreground">{s.benefit}</div>
                          {s.appliedDate && <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1"><Calendar className="h-3 w-3" />Applied: {s.appliedDate}</div>}
                          {s.amount && <div className="text-xs font-semibold text-emerald-700 mt-0.5">Disbursed: {s.amount}</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* All Eligible Schemes */}
              <div>
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">All Applicable Schemes</div>
                <div className="space-y-2">
                  {schemes.map(s => (
                    <div key={s.id} className={`flex items-start gap-3 p-3 rounded-lg border ${s.eligible ? "bg-emerald-50/30 border-emerald-100" : "bg-muted/20 border-border opacity-60"}`}>
                      {s.eligible
                        ? <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                        : <XCircle className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                      }
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-0.5">
                          <span className="text-sm font-medium text-foreground">{s.name}</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${s.category === "central" ? "bg-orange-100 text-orange-700" : "bg-purple-100 text-purple-700"}`}>
                            {s.category === "central" ? "Central" : "State"}
                          </span>
                          <SchemeStatusPill status={s.appliedStatus} />
                        </div>
                        <div className="text-xs text-muted-foreground">{s.benefit}</div>
                        <div className={`text-xs mt-0.5 flex items-center gap-1 ${s.eligible ? "text-emerald-700" : "text-muted-foreground"}`}>
                          <Info className="h-3 w-3 flex-shrink-0" />{s.reason}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </SectionToggle>

          {/* ── Grievances ── */}
          <SectionToggle title="Grievances" icon={<AlertCircle className="h-4 w-4 text-secondary" />}
            badge={grievances.length}>
            {grievances.length === 0 ? (
              <div className="text-sm text-muted-foreground text-center py-4">No grievances recorded.</div>
            ) : (
              <div className="space-y-3">
                {grievances.map(g => (
                  <div key={g.id} className="border border-border rounded-lg p-4">
                    <div className="flex flex-wrap items-start gap-2 mb-2">
                      <span className="text-sm font-semibold text-foreground flex-1">{g.title}</span>
                      <GrievanceStatusPill status={g.status} />
                      <PriorityPill priority={g.priority} />
                    </div>
                    <p className="text-xs text-muted-foreground mb-2 leading-relaxed">{g.description}</p>
                    <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Hash className="h-3 w-3" />{g.id}</span>
                      <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />Filed: {g.date}</span>
                      {g.resolvedDate && <span className="flex items-center gap-1 text-emerald-600"><CheckCircle2 className="h-3 w-3" />Resolved: {g.resolvedDate}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionToggle>

          {/* ── Support Tickets ── */}
          <SectionToggle title="Support Tickets" icon={<Ticket className="h-4 w-4 text-secondary" />}
            badge={tickets.length}>
            {tickets.length === 0 ? (
              <div className="text-sm text-muted-foreground text-center py-4">No support tickets raised.</div>
            ) : (
              <div className="space-y-3">
                {tickets.map(t => (
                  <div key={t.id} className="border border-border rounded-lg p-4">
                    <div className="flex flex-wrap items-start gap-2 mb-2">
                      <span className="text-sm font-semibold text-foreground flex-1">{t.subject}</span>
                      <TicketStatusPill status={t.status} />
                      <TicketTypePill type={t.type} />
                    </div>
                    <p className="text-xs text-muted-foreground mb-2 leading-relaxed">{t.description}</p>
                    <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Hash className="h-3 w-3" />{t.id}</span>
                      <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />Raised: {t.date}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionToggle>

          {/* ── Documents ── */}
          <SectionToggle title="Documents" icon={<FileText className="h-4 w-4 text-secondary" />}
            badge={farmer.docs?.length || 0}>
            {(!farmer.docs || farmer.docs.length === 0) ? (
              <div className="text-sm text-muted-foreground text-center py-4">No documents on record.</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {farmer.docs.map((doc, i) => (
                  <div key={i} className={`flex items-center gap-3 p-3 rounded-lg border ${doc.status === "uploaded" ? "border-emerald-200 bg-emerald-50/40" : "border-red-200 bg-red-50/40"}`}>
                    <FileText className={`h-4 w-4 flex-shrink-0 ${doc.status === "uploaded" ? "text-emerald-600" : "text-destructive"}`} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-foreground truncate">{doc.name}</div>
                      <div className="text-xs text-muted-foreground">{doc.fileName} · {doc.size}</div>
                    </div>
                    {doc.status === "uploaded"
                      ? <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                      : <XCircle className="h-4 w-4 text-destructive flex-shrink-0" />
                    }
                  </div>
                ))}
              </div>
            )}
          </SectionToggle>

        </div>
      )}
    </div>
  );
}
