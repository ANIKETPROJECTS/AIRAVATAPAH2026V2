import { useState, useMemo, useEffect, useCallback } from "react";
import { useNotifications } from "@/contexts/NotificationContext";
import {
  Search, Filter, ArrowUpDown, Shield, AlertCircle, Ticket,
  FileText, Activity, CheckCircle2, XCircle, Calendar, Info,
  BadgeCheck, Clock, User, Plus, X, Send, ChevronDown,
  AlertTriangle, IndianRupee,
} from "lucide-react";
import type { FarmerRecord } from "@/data/farmerApi";
import {
  deriveSchemes, derivedGrievances, derivedTickets, deriveTimeline,
  SchemeStatusPill, Pill, GSTATUS, GPRIORITY, TSTATUS, TTYPE,
  type Scheme, type Grievance, type SupportTicket,
} from "@/components/modules/VerifiedFarmerCard";

/* ─────────────────────── shared UI components ─────────────────────── */
function SearchBar({ value, onChange, placeholder }: { value:string; onChange:(v:string)=>void; placeholder:string }) {
  return (
    <div className="relative flex-1 min-w-[180px]">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
      <input value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
        className="w-full pl-9 pr-3 py-2 text-sm bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary/40"/>
    </div>
  );
}
function FilterSelect({ value, onChange, options, label }: { value:string; onChange:(v:string)=>void; options:{value:string;label:string}[]; label:string }) {
  return (
    <div className="flex items-center gap-1.5">
      <Filter className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0"/>
      <select value={value} onChange={e=>onChange(e.target.value)} className="text-sm bg-card border border-border rounded-lg px-3 py-2">
        <option value="">{label}</option>
        {options.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}
function SortSelect({ value, onChange, options }: { value:string; onChange:(v:string)=>void; options:{value:string;label:string}[] }) {
  return (
    <div className="flex items-center gap-1.5">
      <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0"/>
      <select value={value} onChange={e=>onChange(e.target.value)} className="text-sm bg-card border border-border rounded-lg px-3 py-2">
        {options.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}
function ResultCount({ shown, total, label }: { shown:number; total:number; label:string }) {
  return <span className="text-xs text-muted-foreground ml-auto">Showing {shown} of {total} {label}</span>;
}
function EmptyState({ icon, message }: { icon:React.ReactNode; message:string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
      <div className="w-14 h-14 rounded-full bg-muted/40 flex items-center justify-center text-muted-foreground/40">{icon}</div>
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
function StatBadge({ label, val, color }: { label:string; val:number|string; color:string }) {
  return (
    <div className={`border rounded-xl px-4 py-2.5 text-center ${color}`}>
      <div className="text-xl font-bold">{val}</div>
      <div className="text-[9px] font-semibold uppercase tracking-wide mt-0.5">{label}</div>
    </div>
  );
}

/* ─────────────────────── Modal ─────────────────────── */
function Modal({ title, onClose, children }: { title:string; onClose:()=>void; children:React.ReactNode }) {
  useEffect(()=>{
    const handler = (e: KeyboardEvent) => { if (e.key==="Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return ()=>document.removeEventListener("keydown", handler);
  },[onClose]);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose}/>
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-border overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-slate-50">
          <h3 className="font-bold text-base text-foreground">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-200 transition-colors"><X className="h-4 w-4 text-muted-foreground"/></button>
        </div>
        <div className="px-6 py-5 max-h-[80vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

/* ─────────────────────── Success banner ─────────────────────── */
function SuccessBanner({ title, sub, onClose }: { title:string; sub:string; onClose:()=>void }) {
  return (
    <div className="flex items-start gap-3 px-4 py-3.5 bg-emerald-50 border border-emerald-300 rounded-xl mb-4">
      <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5"/>
      <div className="flex-1">
        <div className="font-semibold text-emerald-800 text-sm">{title}</div>
        <div className="text-xs text-emerald-600 mt-0.5">{sub}</div>
      </div>
      <button onClick={onClose} className="p-0.5 hover:bg-emerald-100 rounded transition-colors"><X className="h-3.5 w-3.5 text-emerald-500"/></button>
    </div>
  );
}

/* ─────────────────────── Form field components ─────────────────────── */
function FormField({ label, required, children }: { label:string; required?:boolean; children:React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
        {label}{required&&<span className="text-lime-600 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}
const inputCls = "w-full px-3 py-2.5 text-sm bg-white border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary/60";
const selectCls = inputCls + " appearance-none";
const textareaCls = inputCls + " resize-none";

/* ══════════════════════════════════════════════════════
   1. SCHEMES PAGE
══════════════════════════════════════════════════════ */
function SchemeApplyModal({ scheme, farmer, onClose, onApplied }: {
  scheme: Scheme; farmer: FarmerRecord; onClose:()=>void; onApplied:(id:string)=>void;
}) {
  const [step, setStep] = useState<"confirm"|"success">("confirm");
  const refNo = `${scheme.id}-MH-${farmer.farmerId}-${new Date().getFullYear()}`;

  const handleSubmit = () => {
    setStep("success");
    onApplied(scheme.id);
  };

  if (step==="success") return (
    <Modal title="Application Submitted" onClose={onClose}>
      <div className="flex flex-col items-center text-center py-4 gap-4">
        <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
          <CheckCircle2 className="h-9 w-9 text-emerald-600"/>
        </div>
        <div>
          <h4 className="font-bold text-lg text-foreground mb-1">Application Submitted Successfully</h4>
          <p className="text-sm text-muted-foreground">Your application for <span className="font-semibold text-foreground">{scheme.name}</span> has been submitted and is pending review.</p>
        </div>
        <div className="w-full bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-left space-y-2">
          <div className="flex justify-between text-xs"><span className="text-muted-foreground">Reference No.</span><span className="font-mono font-semibold">{refNo}</span></div>
          <div className="flex justify-between text-xs"><span className="text-muted-foreground">Farmer ID</span><span className="font-mono">{farmer.farmerId}</span></div>
          <div className="flex justify-between text-xs"><span className="text-muted-foreground">Submitted On</span><span className="font-medium">{new Date().toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"})}</span></div>
          <div className="flex justify-between text-xs"><span className="text-muted-foreground">Status</span><span className="font-semibold text-teal-700 bg-teal-100 px-2 py-0.5 rounded-full">Applied — Pending Review</span></div>
        </div>
        <button onClick={onClose} className="w-full bg-secondary text-white font-semibold py-2.5 rounded-xl hover:bg-secondary/90 transition-colors">Done</button>
      </div>
    </Modal>
  );

  return (
    <Modal title={`Apply — ${scheme.nameMr}`} onClose={onClose}>
      <div className="space-y-4">
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 space-y-2">
          <h4 className="font-bold text-sm text-emerald-800">{scheme.name}</h4>
          <p className="text-xs text-muted-foreground">{scheme.ministry}</p>
          <div className="grid grid-cols-2 gap-2 text-xs mt-2">
            <div><span className="text-muted-foreground">Benefit: </span><span className="font-medium">{scheme.benefit}</span></div>
            <div><span className="text-muted-foreground">Max: </span><span className="font-semibold text-emerald-700">{scheme.maxAmount}</span></div>
            <div><span className="text-muted-foreground">Frequency: </span><span className="font-medium">{scheme.frequency}</span></div>
            <div><span className="text-muted-foreground">Category: </span><span className={`font-bold ${scheme.category==="central"?"text-teal-700":"text-green-700"}`}>{scheme.category==="central"?"Central Govt.":"State — MH"}</span></div>
          </div>
        </div>

        <div className="border border-border rounded-xl p-4 space-y-2">
          <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Applicant Details</div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div><span className="text-muted-foreground">Name: </span><span className="font-medium">{farmer.name}</span></div>
            <div><span className="text-muted-foreground">Farmer ID: </span><span className="font-mono">{farmer.farmerId}</span></div>
            <div><span className="text-muted-foreground">Aadhaar: </span><span className="font-mono">{farmer.aadhaar}</span></div>
            <div><span className="text-muted-foreground">District: </span><span className="font-medium">{farmer.district}</span></div>
            <div><span className="text-muted-foreground">Bank: </span><span className="font-medium">{farmer.bankName||"Linked"}</span></div>
            <div><span className="text-muted-foreground">DBT Status: </span><span className="font-semibold text-emerald-600">Active</span></div>
          </div>
        </div>

        <div className="bg-teal-50 border border-teal-200 rounded-lg px-3 py-2.5 flex items-start gap-2 text-xs text-teal-700">
          <Info className="h-3.5 w-3.5 flex-shrink-0 mt-0.5"/>
          <span>By submitting, you confirm that the applicant meets the eligibility criteria for this scheme. The application will be forwarded to the concerned department for processing.</span>
        </div>

        <div className="flex gap-3 pt-1">
          <button onClick={onClose} className="flex-1 py-2.5 border border-border rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors">Cancel</button>
          <button onClick={handleSubmit} className="flex-1 py-2.5 bg-secondary text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 hover:bg-secondary/90 transition-colors">
            <Send className="h-4 w-4"/>Submit Application
          </button>
        </div>
      </div>
    </Modal>
  );
}

export function SchemesPage({ farmer }: { farmer: FarmerRecord }) {
  const { addNotification } = useNotifications();
  const baseSchemes = deriveSchemes(farmer);
  const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set());
  const [applyingScheme, setApplyingScheme] = useState<Scheme|null>(null);
  const [successMsg, setSuccessMsg] = useState("");
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [eligFilter, setEligFilter] = useState("");
  const [sort, setSort] = useState("eligible");

  const all = useMemo(()=>baseSchemes.map(s=>
    appliedIds.has(s.id) ? { ...s, appliedStatus: "Applied" as const } : s
  ), [baseSchemes, appliedIds]);

  const filtered = useMemo(()=>{
    let r = all;
    const s = search.toLowerCase();
    if (s) r = r.filter(x=>x.name.toLowerCase().includes(s)||x.nameMr.includes(s)||x.ministry.toLowerCase().includes(s)||x.benefit.toLowerCase().includes(s));
    if (catFilter) r = r.filter(x=>x.category===catFilter);
    if (statusFilter) {
      if (statusFilter==="none") r = r.filter(x=>!x.appliedStatus);
      else r = r.filter(x=>x.appliedStatus===statusFilter);
    }
    if (eligFilter==="eligible") r = r.filter(x=>x.eligible);
    if (eligFilter==="not") r = r.filter(x=>!x.eligible);
    if (sort==="name") r = [...r].sort((a,b)=>a.name.localeCompare(b.name));
    if (sort==="status") r = [...r].sort((a,b)=>{
      const ord=["Disbursed","Approved","Applied","Rejected",""];
      return ord.indexOf(a.appliedStatus||"")-ord.indexOf(b.appliedStatus||"");
    });
    if (sort==="category") r = [...r].sort((a,b)=>a.category.localeCompare(b.category));
    if (sort==="eligible") r = [...r].sort((a,b)=>Number(b.eligible)-Number(a.eligible));
    return r;
  }, [all, search, catFilter, statusFilter, eligFilter, sort]);

  const applied   = all.filter(s=>s.appliedStatus);
  const disbursed = all.filter(s=>s.appliedStatus==="Disbursed");
  const eligible  = all.filter(s=>s.eligible);
  const canApply  = all.filter(s=>s.eligible&&!s.appliedStatus);

  return (
    <div className="space-y-5">
      {applyingScheme&&(
        <SchemeApplyModal
          scheme={applyingScheme}
          farmer={farmer}
          onClose={()=>setApplyingScheme(null)}
          onApplied={id=>{ setAppliedIds(prev=>new Set([...prev,id])); setSuccessMsg(`Application for ${applyingScheme.name} submitted successfully.`); addNotification({ type:"scheme", title:"Scheme Application Submitted", body:`${applyingScheme.name} application submitted for ${farmer.name}.`, farmerName:farmer.name, farmerId:farmer.farmerId }); }}
        />
      )}
      {successMsg&&<SuccessBanner title="Application Submitted!" sub={successMsg} onClose={()=>setSuccessMsg("")}/>}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatBadge label="Total Schemes" val={all.length} color="text-teal-700 bg-teal-50 border-teal-200"/>
        <StatBadge label="Eligible" val={eligible.length} color="text-emerald-700 bg-emerald-50 border-emerald-200"/>
        <StatBadge label="Applied / Active" val={applied.length} color="text-green-700 bg-green-50 border-green-200"/>
        <StatBadge label="Disbursed" val={disbursed.length} color="text-lime-800 bg-lime-50 border-lime-200"/>
      </div>

      {/* Quick apply banner */}
      {canApply.length>0&&(
        <div className="bg-teal-50 border border-teal-200 rounded-xl px-4 py-3 flex items-center gap-3">
          <Shield className="h-5 w-5 text-teal-600 flex-shrink-0"/>
          <div className="flex-1 min-w-0">
            <span className="text-sm font-semibold text-teal-800">{canApply.length} eligible scheme{canApply.length>1?"s":""} not yet applied</span>
            <span className="text-xs text-teal-600 ml-2">Click "Apply" on any scheme below to submit an application.</span>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="flex flex-wrap gap-2 items-center">
        <SearchBar value={search} onChange={setSearch} placeholder="Search schemes, ministry, benefit…"/>
        <FilterSelect value={catFilter} onChange={setCatFilter} label="All Categories" options={[{value:"central",label:"Central Govt."},{value:"state",label:"State — MH"}]}/>
        <FilterSelect value={statusFilter} onChange={setStatusFilter} label="All Statuses" options={[{value:"Applied",label:"Applied"},{value:"Approved",label:"Approved"},{value:"Disbursed",label:"Disbursed"},{value:"Rejected",label:"Rejected"},{value:"none",label:"Not Applied"}]}/>
        <FilterSelect value={eligFilter} onChange={setEligFilter} label="All Eligibility" options={[{value:"eligible",label:"Eligible"},{value:"not",label:"Not Eligible"}]}/>
        <SortSelect value={sort} onChange={setSort} options={[{value:"eligible",label:"Sort: Eligible First"},{value:"name",label:"Sort: Name A–Z"},{value:"status",label:"Sort: Status"},{value:"category",label:"Sort: Category"}]}/>
        <ResultCount shown={filtered.length} total={all.length} label="schemes"/>
      </div>

      {/* List */}
      {filtered.length===0
        ? <EmptyState icon={<Shield className="h-7 w-7"/>} message="No schemes match your filters."/>
        : <div className="space-y-3">
          {filtered.map(s=>{
            const canApplyNow = s.eligible && !s.appliedStatus;
            return (
              <div key={s.id} className={`border rounded-xl overflow-hidden ${
                s.appliedStatus==="Disbursed"?"border-emerald-200 bg-emerald-50/30":
                s.appliedStatus==="Approved"?"border-teal-200 bg-teal-50/20":
                s.appliedStatus==="Applied"?"border-green-200 bg-green-50/20":
                s.eligible?"border-slate-200 bg-white":"border-slate-100 bg-slate-50/50 opacity-60"
              }`}>
                <div className="px-5 py-4 flex flex-wrap items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="font-semibold text-sm text-slate-800">{s.name}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${s.category==="central"?"bg-teal-100 text-teal-800":"bg-green-100 text-green-800"}`}>
                        {s.category==="central"?"Central Govt.":"State — MH"}
                      </span>
                      {s.eligible
                        ? <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 font-semibold flex items-center gap-0.5"><CheckCircle2 className="h-2.5 w-2.5"/>Eligible</span>
                        : <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-500 font-semibold flex items-center gap-0.5"><XCircle className="h-2.5 w-2.5"/>Not Eligible</span>
                      }
                    </div>
                    <div className="text-[11px] text-muted-foreground">{s.nameMr} · {s.ministry}</div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <SchemeStatusPill status={s.appliedStatus}/>
                    {canApplyNow&&(
                      <button
                        onClick={()=>setApplyingScheme(s)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary text-white text-xs font-semibold rounded-lg hover:bg-secondary/90 transition-colors shadow-sm"
                      >
                        <Plus className="h-3 w-3"/>Apply Now
                      </button>
                    )}
                  </div>
                </div>
                <div className="px-5 pb-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-2 text-xs">
                  <div><span className="text-muted-foreground">Benefit: </span><span className="font-medium">{s.benefit}</span></div>
                  <div><span className="text-muted-foreground">Max: </span><span className="font-medium">{s.maxAmount}</span></div>
                  <div><span className="text-muted-foreground">Frequency: </span><span className="font-medium">{s.frequency}</span></div>
                  {s.appliedDate&&<div><span className="text-muted-foreground">Applied: </span><span className="font-medium">{s.appliedDate}</span></div>}
                  {s.totalDisbursed&&<div><span className="text-muted-foreground">Disbursed: </span><span className="font-semibold text-emerald-700">{s.totalDisbursed}</span></div>}
                  {s.refNo&&<div className="sm:col-span-2"><span className="text-muted-foreground">Ref: </span><span className="font-mono">{s.refNo}</span></div>}
                </div>
                <div className={`px-5 py-2 border-t border-slate-100 text-xs flex items-center gap-1.5 ${s.eligible?"text-emerald-600 bg-emerald-50/40":"text-slate-400"}`}>
                  <Info className="h-3 w-3 flex-shrink-0"/>{s.reason}
                </div>
              </div>
            );
          })}
        </div>
      }
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   2. GRIEVANCES PAGE
══════════════════════════════════════════════════════ */
const GRV_CATEGORIES = ["Scheme / DBT","Land Records","Crop Insurance","Bank / NPCI","Subsidy Delay","Document Issue","Other"];

function RaiseGrievanceModal({ farmer, onClose, onSubmitted }: {
  farmer: FarmerRecord; onClose:()=>void; onSubmitted:(g:Grievance)=>void;
}) {
  const [form, setForm] = useState({ title:"", category:"", priority:"Medium" as "High"|"Medium"|"Low", description:"" });
  const [step, setStep] = useState<"form"|"success">("form");
  const [errors, setErrors] = useState<Record<string,string>>({});

  const validate = () => {
    const e: Record<string,string> = {};
    if (!form.title.trim()) e.title = "Title is required";
    if (!form.category) e.category = "Category is required";
    if (!form.description.trim()) e.description = "Description is required";
    if (form.description.trim().length<20) e.description = "Please provide more detail (min 20 chars)";
    setErrors(e);
    return Object.keys(e).length===0;
  };

  const seed = parseInt(farmer.farmerId.replace(/\D/g,"")||"1");
  const newId = `GRV-${farmer.farmerId}-${String(seed%100+10).padStart(3,"0")}`;
  const today = new Date().toISOString().split("T")[0];

  const handleSubmit = () => {
    if (!validate()) return;
    const grv: Grievance = {
      id: newId,
      title: form.title.trim(),
      category: form.category,
      date: today,
      status: "Open",
      priority: form.priority,
      description: form.description.trim(),
      assignedTo: `Taluka Agri. Officer, ${farmer.taluka||farmer.district}`,
    };
    setStep("success");
    onSubmitted(grv);
  };

  if (step==="success") return (
    <Modal title="Grievance Raised" onClose={onClose}>
      <div className="flex flex-col items-center text-center py-4 gap-4">
        <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
          <CheckCircle2 className="h-9 w-9 text-emerald-600"/>
        </div>
        <div>
          <h4 className="font-bold text-lg text-foreground mb-1">Grievance Filed Successfully</h4>
          <p className="text-sm text-muted-foreground">The grievance has been registered and assigned to the Taluka Agricultural Officer for action.</p>
        </div>
        <div className="w-full bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-left space-y-2">
          <div className="flex justify-between text-xs"><span className="text-muted-foreground">Grievance ID</span><span className="font-mono font-semibold">{newId}</span></div>
          <div className="flex justify-between text-xs"><span className="text-muted-foreground">Category</span><span className="font-medium">{form.category}</span></div>
          <div className="flex justify-between text-xs"><span className="text-muted-foreground">Priority</span><Pill label={form.priority} map={GPRIORITY}/></div>
          <div className="flex justify-between text-xs"><span className="text-muted-foreground">Filed On</span><span className="font-medium">{new Date().toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"})}</span></div>
          <div className="flex justify-between text-xs"><span className="text-muted-foreground">Status</span><Pill label="Open" map={GSTATUS}/></div>
        </div>
        <button onClick={onClose} className="w-full bg-secondary text-white font-semibold py-2.5 rounded-xl hover:bg-secondary/90 transition-colors">Done</button>
      </div>
    </Modal>
  );

  const set = (k:string,v:string) => { setForm(p=>({...p,[k]:v})); setErrors(p=>({...p,[k]:""})); };

  return (
    <Modal title="Raise New Grievance" onClose={onClose}>
      <div className="space-y-4">
        <div className="bg-lime-50 border border-lime-200 rounded-lg px-3 py-2 text-xs text-lime-800 flex items-center gap-2">
          <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0"/>
          Filing for: <span className="font-semibold">{farmer.name}</span> · {farmer.farmerId}
        </div>

        <FormField label="Grievance Title" required>
          <input value={form.title} onChange={e=>set("title",e.target.value)} className={inputCls} placeholder="e.g. PM-KISAN instalment not received"/>
          {errors.title&&<p className="text-[11px] text-lime-700">{errors.title}</p>}
        </FormField>

        <div className="grid grid-cols-2 gap-3">
          <FormField label="Category" required>
            <div className="relative">
              <select value={form.category} onChange={e=>set("category",e.target.value)} className={selectCls}>
                <option value="">Select category</option>
                {GRV_CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none"/>
            </div>
            {errors.category&&<p className="text-[11px] text-lime-700">{errors.category}</p>}
          </FormField>

          <FormField label="Priority" required>
            <div className="relative">
              <select value={form.priority} onChange={e=>set("priority",e.target.value as "High"|"Medium"|"Low")} className={selectCls}>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none"/>
            </div>
          </FormField>
        </div>

        <FormField label="Description" required>
          <textarea value={form.description} onChange={e=>set("description",e.target.value)} className={textareaCls} rows={4}
            placeholder="Describe the issue in detail — include dates, amounts, reference numbers if any…"/>
          <div className="flex justify-between">
            {errors.description?<p className="text-[11px] text-lime-700">{errors.description}</p>:<span/>}
            <span className="text-[10px] text-muted-foreground ml-auto">{form.description.length} chars</span>
          </div>
        </FormField>

        <div className="flex gap-3 pt-1">
          <button onClick={onClose} className="flex-1 py-2.5 border border-border rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors">Cancel</button>
          <button onClick={handleSubmit} className="flex-1 py-2.5 bg-secondary text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 hover:bg-secondary/90 transition-colors">
            <Send className="h-4 w-4"/>File Grievance
          </button>
        </div>
      </div>
    </Modal>
  );
}

export function GrievancesPage({ farmer }: { farmer: FarmerRecord }) {
  const { addNotification } = useNotifications();
  const base = derivedGrievances(farmer);
  const [extra, setExtra] = useState<Grievance[]>([]);
  const all = useMemo(()=>[...extra,...base], [base, extra]);
  const [showModal, setShowModal] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [catFilter, setCatFilter] = useState("");
  const [sort, setSort] = useState("date-desc");

  const categories = [...new Set(all.map(g=>g.category))];

  const filtered = useMemo(()=>{
    let r = all;
    const s = search.toLowerCase();
    if (s) r = r.filter(x=>x.title.toLowerCase().includes(s)||x.description.toLowerCase().includes(s)||x.category.toLowerCase().includes(s)||x.id.toLowerCase().includes(s));
    if (statusFilter) r = r.filter(x=>x.status===statusFilter);
    if (priorityFilter) r = r.filter(x=>x.priority===priorityFilter);
    if (catFilter) r = r.filter(x=>x.category===catFilter);
    const priorityOrd: Record<string,number> = { "High":0,"Medium":1,"Low":2 };
    if (sort==="date-desc") r = [...r].sort((a,b)=>b.date.localeCompare(a.date));
    if (sort==="date-asc") r = [...r].sort((a,b)=>a.date.localeCompare(b.date));
    if (sort==="priority") r = [...r].sort((a,b)=>priorityOrd[a.priority]-priorityOrd[b.priority]);
    if (sort==="status") r = [...r].sort((a,b)=>{ const ord=["Open","In Progress","Resolved","Closed"]; return ord.indexOf(a.status)-ord.indexOf(b.status); });
    return r;
  }, [all, search, statusFilter, priorityFilter, catFilter, sort]);

  return (
    <div className="space-y-5">
      {showModal&&<RaiseGrievanceModal farmer={farmer} onClose={()=>setShowModal(false)} onSubmitted={g=>{ setExtra(p=>[g,...p]); setSuccessMsg(`Grievance "${g.title}" filed — ID: ${g.id}`); addNotification({ type:"grievance", title:"New Grievance Filed", body:`"${g.title}" raised for ${farmer.name} · Priority: ${g.priority}`, farmerName:farmer.name, farmerId:farmer.farmerId }); }}/>}
      {successMsg&&<SuccessBanner title="Grievance Filed Successfully!" sub={successMsg} onClose={()=>setSuccessMsg("")}/>}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatBadge label="Total" val={all.length} color="text-teal-700 bg-teal-50 border-teal-200"/>
        <StatBadge label="Open" val={all.filter(g=>g.status==="Open").length} color="text-lime-800 bg-lime-50 border-lime-300"/>
        <StatBadge label="In Progress" val={all.filter(g=>g.status==="In Progress").length} color="text-green-700 bg-green-50 border-green-200"/>
        <StatBadge label="Resolved / Closed" val={all.filter(g=>g.status==="Resolved"||g.status==="Closed").length} color="text-emerald-700 bg-emerald-50 border-emerald-200"/>
      </div>

      {/* Controls + Raise button */}
      <div className="flex flex-wrap gap-2 items-center">
        <button onClick={()=>setShowModal(true)} className="flex items-center gap-2 px-4 py-2 bg-secondary text-white text-sm font-semibold rounded-lg hover:bg-secondary/90 transition-colors shadow-sm flex-shrink-0">
          <Plus className="h-4 w-4"/>Raise Grievance
        </button>
        <SearchBar value={search} onChange={setSearch} placeholder="Search by title, category, ID…"/>
        <FilterSelect value={statusFilter} onChange={setStatusFilter} label="All Statuses" options={["Open","In Progress","Resolved","Closed"].map(v=>({value:v,label:v}))}/>
        <FilterSelect value={priorityFilter} onChange={setPriorityFilter} label="All Priorities" options={["High","Medium","Low"].map(v=>({value:v,label:v}))}/>
        <FilterSelect value={catFilter} onChange={setCatFilter} label="All Categories" options={categories.map(v=>({value:v,label:v}))}/>
        <SortSelect value={sort} onChange={setSort} options={[
          {value:"date-desc",label:"Sort: Newest First"},
          {value:"date-asc",label:"Sort: Oldest First"},
          {value:"priority",label:"Sort: High Priority First"},
          {value:"status",label:"Sort: Status"},
        ]}/>
        <ResultCount shown={filtered.length} total={all.length} label="grievances"/>
      </div>

      {/* List */}
      {filtered.length===0
        ? <EmptyState icon={<AlertCircle className="h-7 w-7"/>} message="No grievances match your filters."/>
        : <div className="space-y-4">
          {filtered.map(g=>(
            <div key={g.id} className={`border rounded-xl overflow-hidden ${g.status==="Open"?"border-lime-300":g.status==="In Progress"?"border-teal-200":"border-slate-200"}`}>
              <div className={`px-5 py-4 ${g.status==="Open"?"bg-lime-50/60":g.status==="In Progress"?"bg-teal-50/60":"bg-slate-50"}`}>
                <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm text-slate-800 mb-1.5">{g.title}</h3>
                    <div className="flex flex-wrap gap-1.5">
                      <Pill label={g.status} map={GSTATUS}/>
                      <Pill label={g.priority} map={GPRIORITY}/>
                      <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-600 font-medium">{g.category}</span>
                    </div>
                  </div>
                  <div className="text-right text-xs text-muted-foreground flex-shrink-0">
                    <div className="font-mono font-semibold text-[11px] text-slate-600">{g.id}</div>
                    <div className="flex items-center gap-1 justify-end mt-0.5"><Calendar className="h-3 w-3"/>{g.date}</div>
                  </div>
                </div>
              </div>
              <div className="px-5 py-4 bg-white space-y-3">
                <p className="text-sm text-slate-700 leading-relaxed">{g.description}</p>
                <div className="text-xs text-muted-foreground">
                  <span className="font-medium">Assigned To: </span>{g.assignedTo}
                  {g.resolvedDate&&<><span className="mx-2 text-slate-300">·</span><span className="font-medium text-emerald-600">Resolved: </span>{g.resolvedDate}</>}
                </div>
                {g.remarks&&(
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3">
                    <div className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider mb-1">Resolution Notes</div>
                    <p className="text-xs text-emerald-700 leading-relaxed">{g.remarks}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      }
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   3. TICKETS PAGE
══════════════════════════════════════════════════════ */
const TKT_TYPES = ["Document","Payment","Scheme","Technical","Other"];

function RaiseTicketModal({ farmer, onClose, onSubmitted }: {
  farmer: FarmerRecord; onClose:()=>void; onSubmitted:(t:SupportTicket)=>void;
}) {
  const [form, setForm] = useState({ subject:"", type:"" as SupportTicket["type"]|"", description:"" });
  const [step, setStep] = useState<"form"|"success">("form");
  const [errors, setErrors] = useState<Record<string,string>>({});

  const validate = () => {
    const e: Record<string,string> = {};
    if (!form.subject.trim()) e.subject = "Subject is required";
    if (!form.type) e.type = "Ticket type is required";
    if (!form.description.trim()) e.description = "Description is required";
    if (form.description.trim().length<20) e.description = "Please provide more detail (min 20 chars)";
    setErrors(e);
    return Object.keys(e).length===0;
  };

  const seed = parseInt(farmer.farmerId.replace(/\D/g,"")||"1");
  const newId = `TKT-${farmer.farmerId}-${String(seed%100+10).padStart(3,"0")}`;
  const today = new Date().toISOString().split("T")[0];

  const handleSubmit = () => {
    if (!validate()) return;
    const tkt: SupportTicket = {
      id: newId,
      subject: form.subject.trim(),
      date: today,
      status: "Open",
      type: form.type as SupportTicket["type"],
      description: form.description.trim(),
      handledBy: `AgriAdmin Support / ${farmer.district} District Cell`,
    };
    setStep("success");
    onSubmitted(tkt);
  };

  if (step==="success") return (
    <Modal title="Ticket Raised" onClose={onClose}>
      <div className="flex flex-col items-center text-center py-4 gap-4">
        <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
          <CheckCircle2 className="h-9 w-9 text-emerald-600"/>
        </div>
        <div>
          <h4 className="font-bold text-lg text-foreground mb-1">Support Ticket Raised Successfully</h4>
          <p className="text-sm text-muted-foreground">The ticket has been logged and routed to the district support cell for handling.</p>
        </div>
        <div className="w-full bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-left space-y-2">
          <div className="flex justify-between text-xs"><span className="text-muted-foreground">Ticket ID</span><span className="font-mono font-semibold">{newId}</span></div>
          <div className="flex justify-between text-xs"><span className="text-muted-foreground">Type</span><Pill label={form.type} map={TTYPE}/></div>
          <div className="flex justify-between text-xs"><span className="text-muted-foreground">Raised On</span><span className="font-medium">{new Date().toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"})}</span></div>
          <div className="flex justify-between text-xs"><span className="text-muted-foreground">Status</span><Pill label="Open" map={TSTATUS}/></div>
        </div>
        <button onClick={onClose} className="w-full bg-secondary text-white font-semibold py-2.5 rounded-xl hover:bg-secondary/90 transition-colors">Done</button>
      </div>
    </Modal>
  );

  const set = (k:string,v:string) => { setForm(p=>({...p,[k]:v})); setErrors(p=>({...p,[k]:""})); };

  return (
    <Modal title="Raise Support Ticket" onClose={onClose}>
      <div className="space-y-4">
        <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-xs text-green-800 flex items-center gap-2">
          <Ticket className="h-3.5 w-3.5 flex-shrink-0"/>
          Ticket for: <span className="font-semibold">{farmer.name}</span> · {farmer.farmerId}
        </div>

        <FormField label="Subject" required>
          <input value={form.subject} onChange={e=>set("subject",e.target.value)} className={inputCls} placeholder="e.g. KCC application pending at bank"/>
          {errors.subject&&<p className="text-[11px] text-lime-700">{errors.subject}</p>}
        </FormField>

        <FormField label="Ticket Type" required>
          <div className="relative">
            <select value={form.type} onChange={e=>set("type",e.target.value)} className={selectCls}>
              <option value="">Select type</option>
              {TKT_TYPES.map(t=><option key={t} value={t}>{t}</option>)}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none"/>
          </div>
          {errors.type&&<p className="text-[11px] text-lime-700">{errors.type}</p>}
        </FormField>

        <FormField label="Description" required>
          <textarea value={form.description} onChange={e=>set("description",e.target.value)} className={textareaCls} rows={4}
            placeholder="Describe the issue in detail — include bank names, portal names, reference numbers if applicable…"/>
          <div className="flex justify-between">
            {errors.description?<p className="text-[11px] text-lime-700">{errors.description}</p>:<span/>}
            <span className="text-[10px] text-muted-foreground ml-auto">{form.description.length} chars</span>
          </div>
        </FormField>

        <div className="flex gap-3 pt-1">
          <button onClick={onClose} className="flex-1 py-2.5 border border-border rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors">Cancel</button>
          <button onClick={handleSubmit} className="flex-1 py-2.5 bg-secondary text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 hover:bg-secondary/90 transition-colors">
            <Send className="h-4 w-4"/>Raise Ticket
          </button>
        </div>
      </div>
    </Modal>
  );
}

export function TicketsPage({ farmer }: { farmer: FarmerRecord }) {
  const { addNotification } = useNotifications();
  const base = derivedTickets(farmer);
  const [extra, setExtra] = useState<SupportTicket[]>([]);
  const all = useMemo(()=>[...extra,...base], [base, extra]);
  const [showModal, setShowModal] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [sort, setSort] = useState("date-desc");

  const filtered = useMemo(()=>{
    let r = all;
    const s = search.toLowerCase();
    if (s) r = r.filter(x=>x.subject.toLowerCase().includes(s)||x.description.toLowerCase().includes(s)||x.id.toLowerCase().includes(s));
    if (statusFilter) r = r.filter(x=>x.status===statusFilter);
    if (typeFilter) r = r.filter(x=>x.type===typeFilter);
    if (sort==="date-desc") r = [...r].sort((a,b)=>b.date.localeCompare(a.date));
    if (sort==="date-asc") r = [...r].sort((a,b)=>a.date.localeCompare(b.date));
    if (sort==="status") r = [...r].sort((a,b)=>{ const ord=["Open","Pending","Resolved"]; return ord.indexOf(a.status)-ord.indexOf(b.status); });
    if (sort==="type") r = [...r].sort((a,b)=>a.type.localeCompare(b.type));
    return r;
  }, [all, search, statusFilter, typeFilter, sort]);

  return (
    <div className="space-y-5">
      {showModal&&<RaiseTicketModal farmer={farmer} onClose={()=>setShowModal(false)} onSubmitted={t=>{ setExtra(p=>[t,...p]); setSuccessMsg(`Ticket "${t.subject}" raised — ID: ${t.id}`); addNotification({ type:"ticket", title:"Support Ticket Raised", body:`"${t.subject}" logged for ${farmer.name} · Type: ${t.type}`, farmerName:farmer.name, farmerId:farmer.farmerId }); }}/>}
      {successMsg&&<SuccessBanner title="Support Ticket Raised!" sub={successMsg} onClose={()=>setSuccessMsg("")}/>}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <StatBadge label="Open" val={all.filter(t=>t.status==="Open").length} color="text-lime-800 bg-lime-50 border-lime-300"/>
        <StatBadge label="Pending" val={all.filter(t=>t.status==="Pending").length} color="text-green-700 bg-green-50 border-green-200"/>
        <StatBadge label="Resolved" val={all.filter(t=>t.status==="Resolved").length} color="text-emerald-700 bg-emerald-50 border-emerald-200"/>
      </div>

      {/* Controls + Raise button */}
      <div className="flex flex-wrap gap-2 items-center">
        <button onClick={()=>setShowModal(true)} className="flex items-center gap-2 px-4 py-2 bg-secondary text-white text-sm font-semibold rounded-lg hover:bg-secondary/90 transition-colors shadow-sm flex-shrink-0">
          <Plus className="h-4 w-4"/>Raise Ticket
        </button>
        <SearchBar value={search} onChange={setSearch} placeholder="Search by subject, description, ID…"/>
        <FilterSelect value={statusFilter} onChange={setStatusFilter} label="All Statuses" options={["Open","Pending","Resolved"].map(v=>({value:v,label:v}))}/>
        <FilterSelect value={typeFilter} onChange={setTypeFilter} label="All Types" options={["Document","Payment","Scheme","Technical","Other"].map(v=>({value:v,label:v}))}/>
        <SortSelect value={sort} onChange={setSort} options={[
          {value:"date-desc",label:"Sort: Newest First"},
          {value:"date-asc",label:"Sort: Oldest First"},
          {value:"status",label:"Sort: Status"},
          {value:"type",label:"Sort: Type"},
        ]}/>
        <ResultCount shown={filtered.length} total={all.length} label="tickets"/>
      </div>

      {/* List */}
      {filtered.length===0
        ? <EmptyState icon={<Ticket className="h-7 w-7"/>} message="No tickets match your filters."/>
        : <div className="space-y-4">
          {filtered.map(t=>(
            <div key={t.id} className={`border rounded-xl overflow-hidden ${t.status==="Open"?"border-lime-300 bg-lime-50/40":t.status==="Pending"?"border-green-200 bg-green-50/30":"border-slate-200 bg-white"}`}>
              <div className="px-5 py-4">
                <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm text-slate-800 mb-1.5">{t.subject}</h3>
                    <div className="flex flex-wrap gap-1.5"><Pill label={t.status} map={TSTATUS}/><Pill label={t.type} map={TTYPE}/></div>
                  </div>
                  <div className="text-right text-xs text-muted-foreground flex-shrink-0">
                    <div className="font-mono font-semibold text-[11px] text-slate-600">{t.id}</div>
                    <div className="flex items-center gap-1 justify-end mt-0.5"><Calendar className="h-3 w-3"/>{t.date}</div>
                  </div>
                </div>
                <p className="text-sm text-slate-700 leading-relaxed mb-2">{t.description}</p>
                <div className="text-xs text-muted-foreground">
                  {t.handledBy&&<><span className="font-medium">Handled By: </span>{t.handledBy}</>}
                  {t.resolvedDate&&<><span className="mx-2 text-slate-300">·</span><span className="font-medium text-emerald-600">Resolved: </span>{t.resolvedDate}</>}
                </div>
              </div>
            </div>
          ))}
        </div>
      }
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   4. DOCUMENTS PAGE
══════════════════════════════════════════════════════ */
export function DocumentsPage({ farmer }: { farmer: FarmerRecord }) {
  const all = farmer.docs ?? [];
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sort, setSort] = useState("name");

  const filtered = useMemo(()=>{
    let r = all;
    const s = search.toLowerCase();
    if (s) r = r.filter(x=>x.name.toLowerCase().includes(s)||x.fileName.toLowerCase().includes(s));
    if (statusFilter) r = r.filter(x=>x.status===statusFilter);
    if (sort==="name") r = [...r].sort((a,b)=>a.name.localeCompare(b.name));
    if (sort==="status") r = [...r].sort((a,b)=>{ const ord=["uploaded","failed","none"]; return ord.indexOf(a.status)-ord.indexOf(b.status); });
    return r;
  }, [all, search, statusFilter, sort]);

  const uploaded = all.filter(d=>d.status==="uploaded").length;
  const failed   = all.filter(d=>d.status==="failed").length;

  if (all.length===0) return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <StatBadge label="Total" val={0} color="text-teal-700 bg-teal-50 border-teal-200"/>
        <StatBadge label="Uploaded" val={0} color="text-emerald-700 bg-emerald-50 border-emerald-200"/>
        <StatBadge label="Failed" val={0} color="text-slate-600 bg-slate-50 border-slate-200"/>
      </div>
      <EmptyState icon={<FileText className="h-7 w-7"/>} message="No documents on record for this farmer."/>
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-3">
        <StatBadge label="Total Documents" val={all.length} color="text-teal-700 bg-teal-50 border-teal-200"/>
        <StatBadge label="Verified / Uploaded" val={uploaded} color="text-emerald-700 bg-emerald-50 border-emerald-200"/>
        <StatBadge label="Failed Upload" val={failed} color="text-slate-600 bg-slate-50 border-slate-200"/>
      </div>
      <div className="flex flex-wrap gap-2 items-center">
        <SearchBar value={search} onChange={setSearch} placeholder="Search document name or file name…"/>
        <FilterSelect value={statusFilter} onChange={setStatusFilter} label="All Statuses" options={[{value:"uploaded",label:"Uploaded / Verified"},{value:"failed",label:"Failed"},{value:"none",label:"Not Submitted"}]}/>
        <SortSelect value={sort} onChange={setSort} options={[{value:"name",label:"Sort: Name A–Z"},{value:"status",label:"Sort: Uploaded First"}]}/>
        <ResultCount shown={filtered.length} total={all.length} label="documents"/>
      </div>
      {filtered.length===0
        ? <EmptyState icon={<FileText className="h-7 w-7"/>} message="No documents match your filters."/>
        : <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filtered.map((doc,i)=>(
            <div key={i} className={`flex items-start gap-4 p-4 rounded-xl border ${doc.status==="uploaded"?"border-emerald-200 bg-emerald-50/40":"border-slate-300 bg-slate-50"}`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${doc.status==="uploaded"?"bg-emerald-100":"bg-slate-200"}`}>
                <FileText className={`h-5 w-5 ${doc.status==="uploaded"?"text-emerald-600":"text-slate-500"}`}/>
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm text-slate-800 truncate mb-0.5">{doc.name}</div>
                <div className="text-xs text-muted-foreground mb-1">{doc.fileName} · {doc.size}</div>
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${doc.status==="uploaded"?"bg-emerald-100 text-emerald-700":doc.status==="failed"?"bg-slate-200 text-slate-600":"bg-slate-100 text-slate-500"}`}>
                  {doc.status==="uploaded"?"✓ Verified & Uploaded":doc.status==="failed"?"✗ Upload Failed":"Not Submitted"}
                </span>
              </div>
            </div>
          ))}
        </div>
      }
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   5. TIMELINE PAGE
══════════════════════════════════════════════════════ */
const ICON_MAP: Record<string,string> = { "verify":"bg-emerald-500","scheme":"bg-teal-500","grievance":"bg-green-600","review":"bg-lime-500","register":"bg-secondary" };

export function TimelinePage({ farmer }: { farmer: FarmerRecord }) {
  const all = deriveTimeline(farmer);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [sort, setSort] = useState("desc");

  const filtered = useMemo(()=>{
    let r = all;
    const s = search.toLowerCase();
    if (s) r = r.filter(x=>x.event.toLowerCase().includes(s)||x.detail.toLowerCase().includes(s)||x.date.toLowerCase().includes(s));
    if (typeFilter) r = r.filter(x=>x.icon===typeFilter);
    if (sort==="desc") r = [...r].reverse();
    return r;
  }, [all, search, typeFilter, sort]);

  const typeLabels: Record<string,string> = { register:"Registration", review:"Review", verify:"Verification", scheme:"Scheme", grievance:"Grievance" };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatBadge label="Total Events" val={all.length} color="text-teal-700 bg-teal-50 border-teal-200"/>
        <StatBadge label="Verifications" val={all.filter(e=>e.icon==="verify").length} color="text-emerald-700 bg-emerald-50 border-emerald-200"/>
        <StatBadge label="Scheme Events" val={all.filter(e=>e.icon==="scheme").length} color="text-green-700 bg-green-50 border-green-200"/>
        <StatBadge label="Reviews / Other" val={all.filter(e=>e.icon==="review"||e.icon==="register").length} color="text-lime-800 bg-lime-50 border-lime-200"/>
      </div>
      <div className="flex flex-wrap gap-2 items-center">
        <SearchBar value={search} onChange={setSearch} placeholder="Search events, details, dates…"/>
        <FilterSelect value={typeFilter} onChange={setTypeFilter} label="All Event Types" options={Object.entries(typeLabels).map(([v,l])=>({value:v,label:l}))}/>
        <SortSelect value={sort} onChange={setSort} options={[{value:"desc",label:"Sort: Newest First"},{value:"asc",label:"Sort: Oldest First"}]}/>
        <ResultCount shown={filtered.length} total={all.length} label="events"/>
      </div>
      {filtered.length===0
        ? <EmptyState icon={<Activity className="h-7 w-7"/>} message="No events match your filters."/>
        : (
          <div className="relative pl-8">
            <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-slate-200"/>
            {filtered.map((ev,i)=>(
              <div key={i} className="relative mb-5 last:mb-0">
                <div className={`absolute -left-5 w-5 h-5 rounded-full border-2 border-white flex items-center justify-center shadow-sm ${ICON_MAP[ev.icon]||"bg-secondary"}`}>
                  {ev.icon==="verify"&&<BadgeCheck className="h-2.5 w-2.5 text-white"/>}
                  {ev.icon==="scheme"&&<Shield className="h-2.5 w-2.5 text-white"/>}
                  {ev.icon==="grievance"&&<AlertCircle className="h-2.5 w-2.5 text-white"/>}
                  {ev.icon==="review"&&<Clock className="h-2.5 w-2.5 text-white"/>}
                  {ev.icon==="register"&&<User className="h-2.5 w-2.5 text-white"/>}
                </div>
                <div className="border border-border rounded-xl bg-white px-5 py-4 ml-3 shadow-sm">
                  <div className="flex flex-wrap items-center gap-3 mb-2">
                    <span className="font-semibold text-sm text-slate-800">{ev.event}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${ev.icon==="verify"?"bg-emerald-100 text-emerald-700":ev.icon==="scheme"?"bg-teal-100 text-teal-700":ev.icon==="review"?"bg-lime-100 text-lime-700":"bg-green-100 text-green-700"}`}>{typeLabels[ev.icon]||ev.icon}</span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1 ml-auto"><Calendar className="h-3 w-3"/>{ev.date}</span>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed">{ev.detail}</p>
                </div>
              </div>
            ))}
          </div>
        )
      }
    </div>
  );
}
