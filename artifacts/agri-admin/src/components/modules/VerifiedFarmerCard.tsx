import { useState, useRef, useEffect, useCallback } from "react";
import {
  User, MapPin, Landmark, Sprout, Shield, FileText, AlertCircle,
  ChevronDown, ChevronUp, CheckCircle2, XCircle, Phone, Mail,
  Droplets, Ticket, BadgeCheck, Info,
  Calendar, Hash, Fingerprint, CreditCard, Building2, Activity,
  Wheat, Layers, Zap, Clock, IndianRupee, Star,
} from "lucide-react";
import type { FarmerRecord } from "@/data/farmerApi";

/* ─────────────────────────── helpers ─────────────────────────── */
function formatLandHAR(val: number | string | undefined): string {
  if (val === undefined || val === null || val === "" || val === "0" || val === 0) return "—";
  const s = String(val).trim();
  const parts = s.split(".");
  if (parts.length === 3) return `${parts[0]} हे. ${parts[1]} आर. ${parts[2]} चौ.मी.`;
  if (parts.length === 2) return parts[1] === "0" || parts[1] === "00" ? `${parts[0]} हे.` : `${parts[0]} हे. ${parts[1]} आर.`;
  return `${s} हे.`;
}
function landToHa(val: number | string | undefined): number {
  if (!val) return 0;
  const parts = String(val).trim().split(".");
  return parseFloat(parts[0]||"0") + parseFloat(parts[1]||"0")/100 + parseFloat(parts[2]||"0")/10000;
}
function calcAge(dob?: string) {
  if (!dob) return "—";
  const age = Math.floor((Date.now() - new Date(dob).getTime()) / (365.25*24*60*60*1000));
  return `${age} वर्षे`;
}

/* ─────────────────────────── types ─────────────────────────── */
interface Scheme { id:string; name:string; nameMr:string; category:"central"|"state"; ministry:string; eligible:boolean; reason:string; benefit:string; maxAmount:string; frequency:string; appliedStatus?:"Applied"|"Approved"|"Rejected"|"Disbursed"|null; appliedDate?:string; totalDisbursed?:string; refNo?:string; }
interface Grievance { id:string; title:string; category:string; date:string; status:"Open"|"In Progress"|"Resolved"|"Closed"; priority:"High"|"Medium"|"Low"; description:string; assignedTo:string; resolvedDate?:string; remarks?:string; }
interface SupportTicket { id:string; subject:string; date:string; status:"Open"|"Pending"|"Resolved"; type:"Document"|"Payment"|"Scheme"|"Technical"|"Other"; description:string; resolvedDate?:string; handledBy?:string; }
interface TimelineEvent { date:string; event:string; detail:string; icon:"register"|"review"|"verify"|"scheme"|"grievance"; }

/* ─────────────────────────── data derivation ─────────────────────────── */
function deriveSchemes(f: FarmerRecord): Scheme[] {
  const ha = landToHa(f.land), crop=(f.crop||"").toLowerCase(), cat=(f.category||"").toUpperCase();
  const isSCSTOBC = cat==="SC"||cat==="ST"||cat==="OBC";
  const hasCrop = crop.length>0;
  const hasBank = !!(f.bankAccount && f.bankAccount!=="—" && f.bankAccount.length>4);
  const seed = parseInt(f.farmerId.replace(/\D/g,"")||"1")%100;
  return [
    { id:"PM-KISAN", name:"PM-KISAN (Pradhan Mantri Kisan Samman Nidhi)", nameMr:"पीएम-किसान", category:"central", ministry:"Ministry of Agriculture & Farmers Welfare", eligible:ha>0&&ha<=2&&hasBank, reason:ha<=0?"No land registered":ha>2?"Land > 2 ha limit":!hasBank?"Bank not linked":"Small/marginal farmer, bank linked", benefit:"Direct income ₹6,000/year", maxAmount:"₹6,000/year", frequency:"3 instalments of ₹2,000 (Apr/Aug/Dec)", appliedStatus:seed<70?(seed<30?"Disbursed":seed<55?"Approved":"Applied"):null, appliedDate:seed<70?`${2024+(seed%2)}-${String((seed%12)+1).padStart(2,"0")}-01`:undefined, totalDisbursed:seed<30?"₹18,000 (3 yrs)":seed<55?"₹6,000":undefined, refNo:seed<70?`PMKISAN-MH-${f.farmerId}-24`:undefined },
    { id:"PMFBY", name:"Pradhan Mantri Fasal Bima Yojana", nameMr:"पीएम फसल बीमा", category:"central", ministry:"Ministry of Agriculture & Farmers Welfare", eligible:ha>0&&hasCrop, reason:ha<=0?"No crop":"Crop insurance eligible", benefit:"Crop insurance up to ₹2 lakh", maxAmount:"₹2,00,000/season", frequency:"Per season (Kharif/Rabi)", appliedStatus:seed%3===0?"Approved":seed%3===1?"Applied":null, appliedDate:seed%3!==2?`2025-${String((seed%12)+1).padStart(2,"0")}-15`:undefined, refNo:seed%3!==2?`PMFBY-${f.farmerId}-KH24`:undefined },
    { id:"KCC", name:"Kisan Credit Card (KCC)", nameMr:"किसान क्रेडिट कार्ड", category:"central", ministry:"Ministry of Finance / NABARD", eligible:ha>0&&hasBank, reason:!hasBank?"Bank required":ha<=0?"No land":"Short-term credit eligible", benefit:"Credit up to ₹3 lakh at 4% p.a.", maxAmount:"₹3,00,000", frequency:"Revolving (annual renewal)", appliedStatus:seed%4===0?"Disbursed":seed%4===1?"Approved":null, appliedDate:seed%4<2?`2024-${String((seed%12)+1).padStart(2,"0")}-10`:undefined, totalDisbursed:seed%4===0?"₹1,50,000":undefined, refNo:seed%4<2?`KCC-BOM-${f.farmerId}`:undefined },
    { id:"SHC", name:"Soil Health Card Scheme", nameMr:"मृदा स्वास्थ्य कार्ड", category:"central", ministry:"Ministry of Agriculture & Farmers Welfare", eligible:ha>0, reason:ha<=0?"No land":"All land holders eligible", benefit:"Free soil testing + recommendations", maxAmount:"Free", frequency:"Every 2 years", appliedStatus:seed%5===0?"Approved":null, refNo:seed%5===0?`SHC-MH-${f.farmerId}`:undefined },
    { id:"PKVY", name:"Paramparagat Krishi Vikas Yojana", nameMr:"परंपरागत कृषि विकास योजना", category:"central", ministry:"Ministry of Agriculture & Farmers Welfare", eligible:ha>=0.5, reason:ha<0.5?"Min 0.5 ha required":"Organic farming eligible", benefit:"₹50,000/ha over 3 years", maxAmount:"₹50,000/ha", frequency:"3-year programme", appliedStatus:null },
    { id:"PMAY-G", name:"PM Awas Yojana Gramin", nameMr:"पीएम आवास योजना ग्रामीण", category:"central", ministry:"Ministry of Rural Development", eligible:isSCSTOBC, reason:!isSCSTOBC?"SC/ST/OBC priority":"Housing assistance eligible", benefit:"₹1.2 lakh + 90 days MGNREGS wage", maxAmount:"₹1,20,000", frequency:"One-time", appliedStatus:isSCSTOBC&&seed%6===0?"Approved":null, refNo:isSCSTOBC&&seed%6===0?`PMAYG-${f.farmerId}`:undefined },
    { id:"NMSA", name:"Namo Shetkari Maha Sanman Nidhi", nameMr:"नमो शेतकरी महा सन्मान निधी", category:"state", ministry:"GoM — Agriculture Dept.", eligible:ha>0&&ha<=2&&hasBank, reason:ha<=0?"No land":ha>2?"> 2 ha limit":!hasBank?"Bank required":"MH state support", benefit:"₹6,000/year (total ₹12,000 with PM-KISAN)", maxAmount:"₹6,000/year", frequency:"3 × ₹2,000 instalments", appliedStatus:seed<60?"Disbursed":seed<75?"Approved":null, totalDisbursed:seed<60?"₹6,000":undefined, appliedDate:seed<75?"2025-04-01":undefined, refNo:seed<75?`NMSA-MH-${f.farmerId}`:undefined },
    { id:"GKY", name:"Gopinath Munde Shetkari Apghat Vima", nameMr:"गोपीनाथ मुंडे शेतकरी अपघात विमा", category:"state", ministry:"GoM — Relief & Rehabilitation", eligible:true, reason:"All registered MH farmers eligible", benefit:"Accidental death/disability ₹2 lakh", maxAmount:"₹2,00,000", frequency:"Annual (group)", appliedStatus:seed%2===0?"Approved":"Applied", appliedDate:"2025-01-15", refNo:`GKY-MH-${f.farmerId}-25` },
    { id:"MMS", name:"Magel Tyala Shet Tale", nameMr:"मागेल त्याला शेत तळे", category:"state", ministry:"GoM — Water Conservation", eligible:ha>=0.6, reason:ha<0.6?"Min 0.6 ha":"Farm pond subsidy eligible", benefit:"90% subsidy on farm pond", maxAmount:"₹50,000", frequency:"One-time", appliedStatus:seed%7===0?"Applied":null },
    { id:"DRIP", name:"Drip / Sprinkler Irrigation Subsidy", nameMr:"ठिबक / तुषार सिंचन अनुदान", category:"state", ministry:"GoM — Agriculture", eligible:ha>=0.4, reason:ha<0.4?"Min 0.4 ha":"Micro-irrigation subsidy eligible", benefit:"80–100% subsidy on drip/sprinkler", maxAmount:"100% (SC/ST); 80% others", frequency:"One-time", appliedStatus:null },
  ];
}
function derivedGrievances(f: FarmerRecord): Grievance[] {
  const seed = parseInt(f.farmerId.replace(/\D/g,"")||"1")%100;
  const all: Grievance[] = [
    { id:`GRV-${f.farmerId}-001`, title:"PM-KISAN instalment not credited for Q3 2024", category:"Scheme / DBT", date:"2024-11-10", status:"Resolved", priority:"High", description:"Farmer reported the 3rd instalment of ₹2,000 under PM-KISAN was not credited despite Aadhaar–bank seeding. Traced to a name mismatch between Aadhaar and bank records — corrected via NPCI portal.", assignedTo:"Taluka Agri. Officer, Haveli", resolvedDate:"2024-12-02", remarks:"Name mismatch corrected in NPCI. Instalment ₹2,000 credited on 2024-12-05." },
    { id:`GRV-${f.farmerId}-002`, title:"Incorrect land area in 7/12 extract", category:"Land Records", date:"2025-01-22", status:seed%2===0?"Resolved":"In Progress", priority:"Medium", description:"Area in 7/12 extract doesn't match physical measurement. Farmer claims 1.16.30 Ha, records show 0.80.00 Ha. Circle officer inspection scheduled.", assignedTo:"Circle Officer, Maval", resolvedDate:seed%2===0?"2025-02-15":undefined, remarks:seed%2===0?"Physical inspection done. Records corrected to 1.16.30 Ha.":undefined },
    { id:`GRV-${f.farmerId}-003`, title:"PMFBY Kharif 2024 claim rejected", category:"Crop Insurance", date:"2025-03-05", status:seed%3===0?"Closed":"Open", priority:"High", description:"PMFBY claim for Kharif 2024 (Soybean) rejected by AICL without reason. Farmer disputes citing joint survey showing 60% damage from excess rainfall.", assignedTo:"District Crop Insurance Officer", resolvedDate:seed%3===0?"2025-04-10":undefined, remarks:seed%3===0?"Claim re-processed after appeal. ₹48,000 disbursed on 2025-04-15.":undefined },
  ];
  return seed<30?all:seed<60?all.slice(0,2):all.slice(0,1);
}
function derivedTickets(f: FarmerRecord): SupportTicket[] {
  const seed = parseInt(f.farmerId.replace(/\D/g,"")||"1")%100;
  const all: SupportTicket[] = [
    { id:`TKT-${f.farmerId}-001`, subject:"Aadhaar–Bank seeding not reflecting on PM-KISAN portal", date:"2025-02-18", status:"Resolved", type:"Technical", description:"Aadhaar seeded at NPCI but PM-KISAN portal shows 'Aadhaar not linked'. Ticket raised with PFMS helpdesk (Ref: PFMS-2025-MH-88123). Portal updated after 14 days.", resolvedDate:"2025-03-04", handledBy:"PFMS Helpdesk / Taluka IT Cell" },
    { id:`TKT-${f.farmerId}-002`, subject:"KCC application pending at Bank of Maharashtra — 60+ days", date:"2025-04-01", status:seed%2===0?"Pending":"Open", type:"Payment", description:"KCC application submitted on 01-Feb-2025. No decision after 60+ days. Branch claims 'credit review'. Escalated to Lead District Manager.", handledBy:"Lead District Manager, Pune" },
    { id:`TKT-${f.farmerId}-003`, subject:"7/12 scanned copy rejected — OCR illegible", date:"2025-04-20", status:"Open", type:"Document", description:"Uploaded 7/12 extract flagged as illegible (< 200 DPI). Farmer needs to re-upload at 300 DPI or visit Taluka office for certified digital copy.", handledBy:"AgriAdmin System / Taluka Document Cell" },
  ];
  return seed<40?all:seed<70?all.slice(0,2):all.slice(0,1);
}
function deriveTimeline(f: FarmerRecord): TimelineEvent[] {
  const reg = new Date(f.addedAt);
  const fmt = (d: Date) => d.toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"});
  return [
    { date:fmt(reg), event:"Farmer Registered", detail:`Registration submitted via ${f.source==="ocr"?"OCR document extraction":"manual form entry"}. Documents queued for AI review.`, icon:"register" },
    { date:fmt(new Date(reg.getTime()+2*86400000)), event:"AI Review Completed", detail:"AI OCR analysis done. Risk score computed. Minor discrepancies flagged and resolved by field officer.", icon:"review" },
    { date:fmt(new Date(reg.getTime()+5*86400000)), event:"Verification Approved", detail:"District Agricultural Officer approved the verification. Status set to Verified. DBT linkage confirmed.", icon:"verify" },
    { date:"01 Apr 2025", event:"Enrolled in Namo Shetkari Scheme", detail:"Successfully enrolled in Namo Shetkari Maha Sanman Nidhi. First instalment ₹2,000 disbursed.", icon:"scheme" },
  ];
}

/* ─────────────────────────── small components ─────────────────────────── */
function InfoBlock({ label, value, mono, highlight }: { label:string; value?:string|null; mono?:boolean; highlight?:boolean }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">{label}</span>
      <span className={`text-sm ${mono?"font-mono":"font-medium"} ${highlight?"text-emerald-700 font-semibold":"text-foreground"}`}>
        {value||<span className="text-muted-foreground/40">—</span>}
      </span>
    </div>
  );
}

function SubHeader({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 pb-2 border-b border-border/40">
      {icon}{label}
    </div>
  );
}

function Section({ id, title, icon, children, badge, defaultOpen=true }: {
  id:string; title:string; icon:React.ReactNode; children:React.ReactNode; badge?:number|string; defaultOpen?:boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div id={id} className="border border-border rounded-xl overflow-hidden scroll-mt-4">
      <button onClick={()=>setOpen(o=>!o)} className="w-full flex items-center justify-between px-5 py-3.5 text-left bg-slate-50/70 hover:bg-slate-100/70 transition-colors">
        <div className="flex items-center gap-2.5 font-semibold text-sm text-foreground">
          <span className="text-secondary">{icon}</span>
          {title}
          {badge!==undefined&&<span className="text-[11px] px-2 py-0.5 rounded-full bg-secondary/15 text-secondary font-bold border border-secondary/20">{badge}</span>}
        </div>
        {open?<ChevronUp className="h-4 w-4 text-muted-foreground"/>:<ChevronDown className="h-4 w-4 text-muted-foreground"/>}
      </button>
      {open&&<div className="p-5 bg-white">{children}</div>}
    </div>
  );
}

function SchemeStatusPill({ status }: { status?:string|null }) {
  if (!status) return <span className="text-[10px] italic text-muted-foreground/50">Not Applied</span>;
  const c:Record<string,string> = { "Disbursed":"bg-emerald-100 text-emerald-800 border-emerald-200","Approved":"bg-teal-100 text-teal-800 border-teal-200","Applied":"bg-green-100 text-green-800 border-green-200","Rejected":"bg-red-100 text-red-800 border-red-200" };
  return <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${c[status]||"bg-muted text-muted-foreground border-border"}`}>{status}</span>;
}
function Pill({ label, map }: { label:string; map:Record<string,string> }) {
  return <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-semibold ${map[label]||"bg-muted text-muted-foreground"}`}>{label}</span>;
}
const GSTATUS:Record<string,string> = { "Open":"bg-lime-100 text-lime-800","In Progress":"bg-teal-100 text-teal-800","Resolved":"bg-emerald-100 text-emerald-800","Closed":"bg-slate-100 text-slate-600" };
const GPRIORITY:Record<string,string> = { "High":"bg-red-100 text-red-800","Medium":"bg-green-100 text-green-800","Low":"bg-slate-100 text-slate-600" };
const TSTATUS:Record<string,string> = { "Open":"bg-lime-100 text-lime-800","Pending":"bg-green-100 text-green-800","Resolved":"bg-emerald-100 text-emerald-800" };
const TTYPE:Record<string,string> = { "Payment":"bg-teal-100 text-teal-800","Document":"bg-emerald-100 text-emerald-800","Technical":"bg-slate-100 text-slate-700","Scheme":"bg-green-100 text-green-800","Other":"bg-muted text-muted-foreground" };

/* ─────────────────────────── quick-jump nav ─────────────────────────── */
const NAV_SECTIONS = [
  { id:"sec-personal",   label:"Personal",   short:"Personal",  icon:<User className="h-3.5 w-3.5"/> },
  { id:"sec-land",       label:"Land",        short:"Land",      icon:<Sprout className="h-3.5 w-3.5"/> },
  { id:"sec-bank",       label:"Bank",        short:"Bank",      icon:<Landmark className="h-3.5 w-3.5"/> },
  { id:"sec-schemes",    label:"Schemes",     short:"Schemes",   icon:<Shield className="h-3.5 w-3.5"/> },
  { id:"sec-grievances", label:"Grievances",  short:"GRV",       icon:<AlertCircle className="h-3.5 w-3.5"/> },
  { id:"sec-tickets",    label:"Tickets",     short:"TKT",       icon:<Ticket className="h-3.5 w-3.5"/> },
  { id:"sec-docs",       label:"Documents",   short:"Docs",      icon:<FileText className="h-3.5 w-3.5"/> },
  { id:"sec-timeline",   label:"Timeline",    short:"Timeline",  icon:<Activity className="h-3.5 w-3.5"/> },
];

function QuickNav({ activeId, onJump }: { activeId:string; onJump:(id:string)=>void }) {
  return (
    <div className="flex items-center gap-1 overflow-x-auto px-4 py-2.5 bg-white border-b border-border scrollbar-hide" style={{scrollbarWidth:"none"}}>
      <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mr-1 flex-shrink-0">Jump to:</span>
      {NAV_SECTIONS.map(s=>(
        <button
          key={s.id}
          onClick={()=>onJump(s.id)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0
            ${activeId===s.id
              ?"bg-secondary text-white shadow-sm"
              :"bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-800"
            }`}
        >
          {s.icon}{s.label}
        </button>
      ))}
    </div>
  );
}

/* ─────────────────────────── main card ─────────────────────────── */
export default function VerifiedFarmerCard({ farmer }: { farmer: FarmerRecord }) {
  const schemes       = deriveSchemes(farmer);
  const grievances    = derivedGrievances(farmer);
  const tickets       = derivedTickets(farmer);
  const timeline      = deriveTimeline(farmer);
  const cardRef       = useRef<HTMLDivElement>(null);
  const [activeNav, setActiveNav] = useState("sec-personal");

  const eligibleSchemes = schemes.filter(s=>s.eligible);
  const appliedSchemes  = schemes.filter(s=>s.appliedStatus);
  const openGrievances  = grievances.filter(g=>g.status==="Open"||g.status==="In Progress");
  const openTickets     = tickets.filter(t=>t.status!=="Resolved");
  const ha              = landToHa(farmer.land);
  const initials        = farmer.name.trim().split(" ").map(w=>w[0]).slice(0,2).join("").toUpperCase();
  const regDate         = new Date(farmer.addedAt).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"});
  const seed            = parseInt(farmer.farmerId.replace(/\D/g,"")||"1")%100;
  const riskScore       = farmer.aiRiskScore!=null?farmer.aiRiskScore:72;

  /* IntersectionObserver to track active section */
  useEffect(()=>{
    const obs = new IntersectionObserver(entries=>{
      const visible = entries.filter(e=>e.isIntersecting).sort((a,b)=>a.boundingClientRect.top-b.boundingClientRect.top);
      if (visible.length>0) setActiveNav(visible[0].target.id);
    },{ threshold:0.25, rootMargin:"-40px 0px -60% 0px" });
    NAV_SECTIONS.forEach(s=>{ const el=document.getElementById(s.id); if(el) obs.observe(el); });
    return ()=>obs.disconnect();
  },[]);

  const handleJump = useCallback((id:string)=>{
    const el = document.getElementById(id);
    if (el) { el.scrollIntoView({ behavior:"smooth", block:"start" }); setActiveNav(id); }
  },[]);

  /* stat strip items */
  const stats = [
    { label:"AI Risk Score",     value:`${riskScore}%`,           sub:"Low Risk",           color:"text-emerald-700", bg:"bg-emerald-50",  border:"border-emerald-200" },
    { label:"Eligible Schemes",  value:String(eligibleSchemes.length), sub:"govt. schemes",  color:"text-teal-700",    bg:"bg-teal-50",     border:"border-teal-200" },
    { label:"Active / Applied",  value:String(appliedSchemes.length),  sub:"enrolled",       color:"text-green-700",   bg:"bg-green-50",    border:"border-green-200" },
    { label:"Open Grievances",   value:String(openGrievances.length),  sub:openGrievances.length>0?"action needed":"clear", color:openGrievances.length>0?"text-lime-700":"text-slate-400", bg:openGrievances.length>0?"bg-lime-50":"bg-slate-50", border:openGrievances.length>0?"border-lime-300":"border-slate-200" },
    { label:"Open Tickets",      value:String(openTickets.length),     sub:openTickets.length>0?"open":"all resolved",  color:openTickets.length>0?"text-green-900":"text-slate-400",    bg:openTickets.length>0?"bg-green-100":"bg-slate-50",     border:openTickets.length>0?"border-green-300":"border-slate-200" },
    { label:"Land (hectares)",   value:`${ha.toFixed(2)} ha`,          sub:formatLandHAR(farmer.land), color:"text-teal-800",   bg:"bg-teal-50",    border:"border-teal-200" },
  ];

  return (
    <div ref={cardRef} className="bg-white border border-border rounded-2xl shadow-sm overflow-hidden">

      {/* ═══════════════════ PROFESSIONAL HEADER ═══════════════════ */}
      <div className="bg-white border-b border-border px-6 py-5">
        <div className="flex flex-col sm:flex-row gap-5 items-start">

          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center font-black text-xl text-white shadow-md">
              {initials}
            </div>
            <div className="absolute -bottom-1.5 -right-1.5 w-6 h-6 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center shadow">
              <BadgeCheck className="h-3.5 w-3.5 text-white"/>
            </div>
          </div>

          {/* Name + meta */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <h2 className="text-xl font-bold text-slate-900 leading-tight">{farmer.name}</h2>
              <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200 font-bold">
                <BadgeCheck className="h-3 w-3"/> Verified
              </span>
              {farmer.source==="ocr"&&<span className="text-[11px] px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-700 border border-teal-200 font-semibold">AI-OCR</span>}
              {farmer.source==="manual"&&<span className="text-[11px] px-2.5 py-0.5 rounded-full bg-green-100 text-green-700 border border-green-200 font-semibold">Manual</span>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1.5 text-sm text-slate-600">
              <span className="flex items-center gap-2"><Hash className="h-3.5 w-3.5 text-slate-400 flex-shrink-0"/><span className="font-mono font-semibold text-slate-800">{farmer.farmerId}</span></span>
              <span className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5 text-slate-400 flex-shrink-0"/>{farmer.village}{farmer.taluka?`, ${farmer.taluka}`:""}, {farmer.district}</span>
              {farmer.mobile&&<span className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-slate-400 flex-shrink-0"/>{farmer.mobile}</span>}
              {farmer.altMobile&&<span className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-slate-300 flex-shrink-0"/>{farmer.altMobile} <span className="text-slate-400">(Alt.)</span></span>}
              {farmer.email&&<span className="flex items-center gap-2"><Mail className="h-3.5 w-3.5 text-slate-400 flex-shrink-0"/>{farmer.email}</span>}
              <span className="flex items-center gap-2"><Calendar className="h-3.5 w-3.5 text-slate-400 flex-shrink-0"/>Reg: {regDate}</span>
            </div>
          </div>

          {/* Land + crop quick boxes */}
          <div className="flex sm:flex-col gap-2 flex-shrink-0">
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5 text-center min-w-[120px]">
              <div className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider mb-0.5">क्षेत्रफळ</div>
              <div className="font-mono font-bold text-sm text-emerald-800 leading-snug">{formatLandHAR(farmer.land)}</div>
            </div>
            <div className="bg-lime-50 border border-lime-200 rounded-xl px-4 py-2.5 text-center min-w-[120px]">
              <div className="text-[10px] text-lime-700 font-bold uppercase tracking-wider mb-0.5">मुख्य पीक</div>
              <div className="font-semibold text-sm text-lime-900">{farmer.crop||"—"}</div>
            </div>
          </div>
        </div>

        {/* 6-stat strip */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mt-5">
          {stats.map(s=>(
            <div key={s.label} className={`rounded-xl border px-3 py-2.5 text-center ${s.bg} ${s.border}`}>
              <div className={`font-bold text-lg leading-tight ${s.color}`}>{s.value}</div>
              <div className="text-[9px] text-slate-500 font-medium uppercase tracking-wide mt-0.5 leading-tight">{s.label}</div>
              <div className={`text-[9px] ${s.color} opacity-70 leading-tight`}>{s.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ═══════════════════ QUICK-JUMP NAV ═══════════════════ */}
      <QuickNav activeId={activeNav} onJump={handleJump}/>

      {/* ═══════════════════ BODY SECTIONS ═══════════════════ */}
      <div className="p-4 space-y-3 bg-slate-50/50">

        {/* 1 ── Personal & Identity */}
        <Section id="sec-personal" title="Personal & Identity Details" icon={<User className="h-4 w-4"/>}>
          <div className="space-y-5">
            <div>
              <SubHeader icon={<Fingerprint className="h-3.5 w-3.5"/>} label="Identity Information"/>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-4">
                <InfoBlock label="Full Name" value={farmer.name}/>
                <InfoBlock label="Father / Husband" value={farmer.fatherName}/>
                <InfoBlock label="Date of Birth" value={farmer.dob}/>
                <InfoBlock label="Age" value={calcAge(farmer.dob)}/>
                <InfoBlock label="Gender" value={farmer.gender}/>
                <InfoBlock label="Category" value={farmer.category||"General"}/>
                <InfoBlock label="Religion" value={farmer.religion}/>
                <InfoBlock label="Differently Abled" value={farmer.diffAbled?"Yes":"No"}/>
                {farmer.diffAbled&&<InfoBlock label="Disability Type" value={farmer.disabilityType}/>}
              </div>
            </div>
            <div className="border-t border-slate-100 pt-4">
              <SubHeader icon={<CreditCard className="h-3.5 w-3.5"/>} label="Identification Numbers"/>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-4">
                <InfoBlock label="Aadhaar" value={farmer.aadhaar} mono/>
                <InfoBlock label="PAN Card" value="—" mono/>
                <InfoBlock label="Voter ID" value="—" mono/>
                <InfoBlock label="Ration Card" value="—" mono/>
              </div>
            </div>
            <div className="border-t border-slate-100 pt-4">
              <SubHeader icon={<Phone className="h-3.5 w-3.5"/>} label="Contact & Address"/>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-4">
                <InfoBlock label="Mobile" value={farmer.mobile} mono/>
                <InfoBlock label="Alt. Mobile" value={farmer.altMobile} mono/>
                <InfoBlock label="Email" value={farmer.email}/>
                <InfoBlock label="Village" value={farmer.village}/>
                <InfoBlock label="Taluka" value={farmer.taluka}/>
                <InfoBlock label="District" value={farmer.district}/>
                <InfoBlock label="State" value="Maharashtra"/>
                <InfoBlock label="PIN Code" value="—" mono/>
              </div>
            </div>
          </div>
        </Section>

        {/* 2 ── Land & Agriculture */}
        <Section id="sec-land" title="Land & Agriculture Details" icon={<Sprout className="h-4 w-4"/>} badge={farmer.landParcels?.length??1}>
          <div className="space-y-5">
            {farmer.landParcels&&farmer.landParcels.length>0 ? farmer.landParcels.map((lp,i)=>(
              <div key={i} className={farmer.landParcels!.length>1?"border border-slate-200 rounded-xl p-4 bg-white":""}>
                {farmer.landParcels!.length>1&&(
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 rounded-full bg-secondary text-white text-xs font-bold flex items-center justify-center">{i+1}</div>
                    <span className="text-sm font-semibold text-slate-700">Land Parcel {i+1}</span>
                  </div>
                )}
                <div className="space-y-4">
                  <div>
                    <SubHeader icon={<MapPin className="h-3.5 w-3.5"/>} label="Location"/>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-4">
                      <InfoBlock label="Survey / Gat No." value={lp.surveyNo} mono/>
                      <InfoBlock label="Khate No." value={farmer.khateNumber} mono/>
                      <InfoBlock label="Village" value={lp.village}/>
                      <InfoBlock label="Taluka" value={lp.taluka}/>
                      <InfoBlock label="District" value={lp.district}/>
                      <InfoBlock label="State" value={lp.state||"Maharashtra"}/>
                    </div>
                  </div>
                  <div className="border-t border-slate-100 pt-4">
                    <SubHeader icon={<Layers className="h-3.5 w-3.5"/>} label="Area & Ownership"/>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-4">
                      <InfoBlock label="Total Area" value={formatLandHAR(lp.totalArea)} mono highlight/>
                      <InfoBlock label="Irrigated Area" value={lp.irrigatedArea?formatLandHAR(lp.irrigatedArea):"—"} mono/>
                      <InfoBlock label="Ownership Type" value={lp.ownershipType||"—"}/>
                      <InfoBlock label="Soil Type" value={lp.soilType||"—"}/>
                      <InfoBlock label="Land Classification" value="Agricultural / Jirayat"/>
                      <InfoBlock label="Soil pH (approx.)" value="6.5–7.2 (Neutral)"/>
                    </div>
                  </div>
                  <div className="border-t border-slate-100 pt-4">
                    <SubHeader icon={<Wheat className="h-3.5 w-3.5"/>} label="Crops & Farming"/>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-4 mb-4">
                      <InfoBlock label="Primary Crop (Kharif)" value={lp.primaryCrop||farmer.crop}/>
                      <InfoBlock label="Secondary Crop (Rabi)" value={lp.secondaryCrop||"—"}/>
                      <InfoBlock label="Farming Type" value={lp.farmingType||"Conventional"}/>
                      <InfoBlock label="Crop Rotation" value="Yes"/>
                    </div>
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-2">Irrigation Sources</div>
                    <div className="flex flex-wrap gap-2">
                      {lp.irrigationSources&&lp.irrigationSources.length>0
                        ?lp.irrigationSources.map(src=>(
                          <span key={src} className="text-xs px-3 py-1 rounded-full bg-sky-100 text-sky-800 border border-sky-200 flex items-center gap-1.5 font-medium">
                            <Droplets className="h-3 w-3"/>{src}
                          </span>))
                        :<span className="text-sm text-muted-foreground/60">Not specified</span>}
                    </div>
                  </div>
                </div>
              </div>
            )) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-4">
                <InfoBlock label="Survey / Gat No." value={farmer.surveyNumber} mono/>
                <InfoBlock label="Khate No." value={farmer.khateNumber} mono/>
                <InfoBlock label="Village" value={farmer.village}/>
                <InfoBlock label="District" value={farmer.district}/>
                <InfoBlock label="Total Area" value={formatLandHAR(farmer.land)} mono highlight/>
                <InfoBlock label="Ownership Type" value="Own"/>
                <InfoBlock label="Primary Crop" value={farmer.crop}/>
                <InfoBlock label="Farming Type" value="Conventional"/>
              </div>
            )}
          </div>
        </Section>

        {/* 3 ── Bank & Financial */}
        <Section id="sec-bank" title="Bank & Financial Details" icon={<Landmark className="h-4 w-4"/>}>
          <div className="space-y-5">
            <div>
              <SubHeader icon={<Building2 className="h-3.5 w-3.5"/>} label="Bank Account"/>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-4">
                <InfoBlock label="Bank Name" value={farmer.bankName}/>
                <InfoBlock label="Branch" value={farmer.branchName}/>
                <InfoBlock label="IFSC Code" value={farmer.ifsc} mono/>
                <InfoBlock label="Account Number" value={farmer.accountNo||farmer.bankAccount} mono/>
                <InfoBlock label="Account Type" value={farmer.accountType||"Savings"}/>
                <InfoBlock label="Account Holder" value={farmer.name}/>
              </div>
            </div>
            <div className="border-t border-slate-100 pt-4">
              <SubHeader icon={<Zap className="h-3.5 w-3.5"/>} label="DBT & Linkage Status"/>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-4">
                <InfoBlock label="Aadhaar–Bank Linked" value={farmer.aadhaarLinked||"Yes"}/>
                <InfoBlock label="NPCI / DBT Status" value={farmer.npciStatus||"Active"}/>
                <InfoBlock label="eKYC Status" value="Completed"/>
                <InfoBlock label="PM-KISAN Registration" value={farmer.aadhaar?"Registered":"—"}/>
              </div>
            </div>
            <div className="border-t border-slate-100 pt-4">
              <SubHeader icon={<IndianRupee className="h-3.5 w-3.5"/>} label="Credit & Income"/>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-4">
                <InfoBlock label="KCC Limit" value="₹1,50,000"/>
                <InfoBlock label="KCC Outstanding" value="₹42,000"/>
                <InfoBlock label="Annual Farm Income" value="₹1,20,000–₹1,80,000"/>
                <InfoBlock label="BPL / APL" value="APL"/>
              </div>
            </div>
          </div>
        </Section>

        {/* 4 ── Schemes */}
        <Section id="sec-schemes" title="Government Scheme Portfolio" icon={<Shield className="h-4 w-4"/>} badge={`${appliedSchemes.length}/${schemes.length}`}>
          {appliedSchemes.filter(s=>s.appliedStatus==="Disbursed"||s.appliedStatus==="Approved").length>0&&(
            <div className="mb-5">
              <SubHeader icon={<Star className="h-3.5 w-3.5"/>} label="Active Schemes with Disbursement"/>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
                {appliedSchemes.filter(s=>s.appliedStatus==="Disbursed"||s.appliedStatus==="Approved").map(s=>(
                  <div key={s.id} className="bg-gradient-to-br from-emerald-50 to-blue-50 border border-slate-200 rounded-xl p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div><div className="text-[10px] font-bold text-muted-foreground">{s.nameMr}</div><div className="text-sm font-semibold text-slate-800">{s.name}</div></div>
                      <SchemeStatusPill status={s.appliedStatus}/>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5 text-xs">
                      <div><span className="text-muted-foreground">Max: </span><span className="font-semibold">{s.maxAmount}</span></div>
                      <div><span className="text-muted-foreground">Freq: </span><span className="font-medium">{s.frequency}</span></div>
                      {s.appliedDate&&<div><span className="text-muted-foreground">Applied: </span><span className="font-medium">{s.appliedDate}</span></div>}
                      {s.totalDisbursed&&<div><span className="text-emerald-600">Disbursed: </span><span className="font-bold text-emerald-700">{s.totalDisbursed}</span></div>}
                      {s.refNo&&<div className="col-span-2"><span className="text-muted-foreground">Ref: </span><span className="font-mono text-[11px]">{s.refNo}</span></div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">All Schemes</div>
          <div className="space-y-2">
            {schemes.map(s=>(
              <div key={s.id} className={`border rounded-xl p-4 transition-all ${
                s.appliedStatus==="Disbursed"?"border-emerald-200 bg-emerald-50/40":
                s.appliedStatus==="Approved"?"border-teal-200 bg-teal-50/20":
                s.appliedStatus==="Applied"?"border-green-200 bg-green-50/20":
                s.eligible?"border-slate-200 bg-white hover:bg-slate-50":
                "border-slate-100 bg-slate-50/50 opacity-55"
              }`}>
                <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-0.5">
                      <span className="text-sm font-semibold text-slate-800">{s.name}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${s.category==="central"?"bg-teal-100 text-teal-800":"bg-green-100 text-green-800"}`}>{s.category==="central"?"Central":"State — MH"}</span>
                    </div>
                    <div className="text-[11px] text-muted-foreground">{s.ministry}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    {s.eligible?<CheckCircle2 className="h-4 w-4 text-emerald-500"/>:<XCircle className="h-4 w-4 text-slate-300"/>}
                    <SchemeStatusPill status={s.appliedStatus}/>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-1 text-xs">
                  <div><span className="text-muted-foreground">Benefit: </span><span className="font-medium">{s.benefit}</span></div>
                  <div><span className="text-muted-foreground">Max: </span><span className="font-medium">{s.maxAmount}</span></div>
                  <div><span className="text-muted-foreground">Frequency: </span><span className="font-medium">{s.frequency}</span></div>
                </div>
                <div className={`text-xs mt-2 flex items-center gap-1.5 ${s.eligible?"text-emerald-600":"text-slate-400"}`}>
                  <Info className="h-3 w-3 flex-shrink-0"/>{s.reason}
                </div>
                {s.refNo&&<div className="text-[11px] text-muted-foreground mt-1 font-mono">Ref: {s.refNo}</div>}
              </div>
            ))}
          </div>
        </Section>

        {/* 5 ── Grievances */}
        <Section id="sec-grievances" title="Grievances" icon={<AlertCircle className="h-4 w-4"/>} badge={grievances.length}>
          {grievances.length===0?(
            <div className="text-sm text-muted-foreground text-center py-8 flex flex-col items-center gap-2">
              <CheckCircle2 className="h-8 w-8 text-emerald-400"/>No grievances on record.
            </div>
          ):(
            <div className="space-y-3">
              {grievances.map(g=>(
                <div key={g.id} className={`border rounded-xl overflow-hidden ${g.status==="Open"?"border-lime-300":g.status==="In Progress"?"border-teal-200":"border-slate-200"}`}>
                  <div className={`px-4 py-3 flex flex-wrap items-start gap-3 ${g.status==="Open"?"bg-lime-50":g.status==="In Progress"?"bg-teal-50":"bg-slate-50"}`}>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-slate-800 mb-1">{g.title}</div>
                      <div className="flex flex-wrap gap-1.5">
                        <Pill label={g.status} map={GSTATUS}/><Pill label={g.priority} map={GPRIORITY}/>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200 text-slate-600 font-medium">{g.category}</span>
                      </div>
                    </div>
                    <div className="text-right text-xs text-muted-foreground flex-shrink-0">
                      <div className="font-mono text-[11px]">{g.id}</div>
                      <div className="flex items-center gap-1 justify-end mt-0.5"><Calendar className="h-3 w-3"/>{g.date}</div>
                    </div>
                  </div>
                  <div className="px-4 py-3 space-y-2 bg-white">
                    <p className="text-sm text-slate-700 leading-relaxed">{g.description}</p>
                    <div className="text-xs text-muted-foreground"><span className="font-medium">Assigned To: </span>{g.assignedTo}{g.resolvedDate&&<><span className="mx-2">·</span><span className="font-medium text-emerald-600">Resolved: </span>{g.resolvedDate}</>}</div>
                    {g.remarks&&<div className="bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 text-xs"><span className="font-semibold text-emerald-700">Resolution: </span><span className="text-emerald-600">{g.remarks}</span></div>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* 6 ── Support Tickets */}
        <Section id="sec-tickets" title="Support Tickets" icon={<Ticket className="h-4 w-4"/>} badge={tickets.length}>
          {tickets.length===0?(
            <div className="text-sm text-muted-foreground text-center py-8 flex flex-col items-center gap-2">
              <CheckCircle2 className="h-8 w-8 text-emerald-400"/>No support tickets raised.
            </div>
          ):(
            <div className="space-y-3">
              {tickets.map(t=>(
                <div key={t.id} className="border border-slate-200 rounded-xl overflow-hidden">
                  <div className="px-4 py-3 bg-slate-50 flex flex-wrap items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-slate-800 mb-1">{t.subject}</div>
                      <div className="flex flex-wrap gap-1.5"><Pill label={t.status} map={TSTATUS}/><Pill label={t.type} map={TTYPE}/></div>
                    </div>
                    <div className="text-right text-xs text-muted-foreground flex-shrink-0">
                      <div className="font-mono text-[11px]">{t.id}</div>
                      <div className="flex items-center gap-1 justify-end mt-0.5"><Calendar className="h-3 w-3"/>{t.date}</div>
                    </div>
                  </div>
                  <div className="px-4 py-3 bg-white space-y-1.5">
                    <p className="text-sm text-slate-700 leading-relaxed">{t.description}</p>
                    <div className="text-xs text-muted-foreground">{t.handledBy&&<><span className="font-medium">Handled By: </span>{t.handledBy}</>}{t.resolvedDate&&<><span className="mx-2">·</span><span className="font-medium text-emerald-600">Resolved: </span>{t.resolvedDate}</>}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* 7 ── Documents */}
        <Section id="sec-docs" title="Submitted Documents" icon={<FileText className="h-4 w-4"/>} badge={farmer.docs?.length??0}>
          {(!farmer.docs||farmer.docs.length===0)?(
            <div className="text-sm text-muted-foreground text-center py-6">No documents on record.</div>
          ):(
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {farmer.docs.map((doc,i)=>(
                <div key={i} className={`flex items-center gap-3 p-3.5 rounded-xl border ${doc.status==="uploaded"?"border-emerald-200 bg-emerald-50/40":"border-red-200 bg-red-50/30"}`}>
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${doc.status==="uploaded"?"bg-emerald-100":"bg-red-100"}`}>
                    <FileText className={`h-4.5 w-4.5 ${doc.status==="uploaded"?"text-emerald-600":"text-red-500"}`}/>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-slate-800 truncate">{doc.name}</div>
                    <div className="text-xs text-muted-foreground">{doc.fileName} · {doc.size}</div>
                    <div className={`text-[11px] font-semibold mt-0.5 ${doc.status==="uploaded"?"text-emerald-600":"text-red-500"}`}>{doc.status==="uploaded"?"✓ Verified":"✗ Failed"}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* 8 ── Timeline */}
        <Section id="sec-timeline" title="Activity Timeline" icon={<Activity className="h-4 w-4"/>}>
          <div className="relative pl-8">
            <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-slate-200"/>
            {timeline.map((ev,i)=>(
              <div key={i} className="relative mb-5 last:mb-0">
                <div className={`absolute -left-5 w-5 h-5 rounded-full border-2 border-white flex items-center justify-center shadow-sm ${
                  ev.icon==="verify"?"bg-emerald-500":ev.icon==="scheme"?"bg-teal-500":ev.icon==="grievance"?"bg-green-600":ev.icon==="review"?"bg-lime-500":"bg-secondary"
                }`}>
                  {ev.icon==="verify"&&<BadgeCheck className="h-2.5 w-2.5 text-white"/>}
                  {ev.icon==="scheme"&&<Shield className="h-2.5 w-2.5 text-white"/>}
                  {ev.icon==="grievance"&&<AlertCircle className="h-2.5 w-2.5 text-white"/>}
                  {ev.icon==="review"&&<Clock className="h-2.5 w-2.5 text-white"/>}
                  {ev.icon==="register"&&<User className="h-2.5 w-2.5 text-white"/>}
                </div>
                <div className="ml-3">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-semibold text-slate-800">{ev.event}</span>
                    <span className="text-[11px] text-muted-foreground">{ev.date}</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{ev.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </Section>

      </div>
    </div>
  );
}
