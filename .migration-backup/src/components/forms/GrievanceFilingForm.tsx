import { useState, useMemo } from "react";
import { X, Check, Lock, ArrowLeft } from "lucide-react";
import { farmers, officers } from "@/data/dummyData";

const modes = ["In-Person", "Phone Call", "Email", "Portal", "Mobile App", "Post"];
const categories = ["Subsidy Delay", "Wrong Beneficiary", "Document Rejection", "Officer Misconduct", "Technical Error", "Scheme Eligibility Dispute", "Insurance Claim Rejection", "Other"];
const subCategories: Record<string, string[]> = {
  "Subsidy Delay": ["PM-KISAN Delay", "PMFBY Premium Refund", "KCC Disbursement"],
  "Wrong Beneficiary": ["Duplicate Entry", "Wrong Account", "Identity Mismatch"],
  "Document Rejection": ["Aadhaar Mismatch", "Land Record Issue", "Bank Document"],
  "Officer Misconduct": ["Bribery Allegation", "Negligence", "Rude Behavior"],
  "Technical Error": ["Portal Error", "Payment Gateway", "OTP Issue"],
  "Scheme Eligibility Dispute": ["Eligibility Criteria", "Disqualification"],
  "Insurance Claim Rejection": ["Claim Amount Dispute", "Coverage Issue", "Timeline Dispute"],
  "Other": ["General Query", "Feedback", "Other"],
};
const resolutionModes = ["Call Back", "Written Response", "In-person Meeting", "Portal Update"];

const officerWorkload: Record<string, number> = { "Priya Desai": 4, "Ravi Kulkarni": 7, "Amit Jadhav": 2 };

interface Props {
  onClose: () => void;
  onSuccess: (msg: string) => void;
}

export default function GrievanceFilingForm({ onClose, onSuccess }: Props) {
  const [farmerSearch, setFarmerSearch] = useState("");
  const [selectedFarmer, setSelectedFarmer] = useState<typeof farmers[0] | null>(null);
  const [mode, setMode] = useState("");
  const [grCategory, setGrCategory] = useState("");
  const [subCat, setSubCat] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [grDate, setGrDate] = useState("");
  const [prevRef, setPrevRef] = useState("");
  const [priority, setPriority] = useState("");
  const [aiSuggestedPriority, setAiSuggestedPriority] = useState("");
  const [resolutionMode, setResolutionMode] = useState("");
  const [assignTo, setAssignTo] = useState("");
  const [docUploaded, setDocUploaded] = useState(false);
  const [internalNotes, setInternalNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showResult, setShowResult] = useState(false);

  const suggestions = useMemo(() => {
    if (!farmerSearch) return [];
    return farmers.filter(f => f.name.toLowerCase().includes(farmerSearch.toLowerCase()) || f.id.includes(farmerSearch));
  }, [farmerSearch]);

  const triggerAiPriority = (desc: string) => {
    setDescription(desc);
    if (desc.length > 20 && !priority) {
      const keywords = ["urgent", "delay", "months", "misconduct", "bribe"];
      const isHigh = keywords.some(k => desc.toLowerCase().includes(k));
      const suggested = isHigh ? "High" : "Medium";
      setAiSuggestedPriority(suggested);
      setPriority(suggested);
    }
  };

  const calcSla = () => {
    if (!grDate || !priority) return "";
    const d = new Date(grDate);
    const days = priority === "High" ? 2 : priority === "Medium" ? 3 : 5;
    d.setDate(d.getDate() + days);
    return `SLA: ${days} working days = ${d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`;
  };

  const handleSubmit = () => {
    setSubmitting(true);
    setTimeout(() => { setSubmitting(false); setShowResult(true); }, 2000);
  };

  const inputCls = "w-full px-3 py-2.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary/50";
  const labelCls = "block text-sm font-medium mb-1";

  if (showResult) {
    const grId = `GR-${String(Math.floor(Math.random() * 9000) + 1000).padStart(4, "0")}`;
    return (
      <div className="fixed inset-0 z-50 bg-background overflow-y-auto">
        <div className="max-w-2xl mx-auto p-6 md:p-10">
          <div className="text-center mb-4">
            <div className="w-20 h-20 mx-auto bg-success/10 rounded-full flex items-center justify-center mb-4 animate-scale-in"><Check className="h-10 w-10 text-success" /></div>
            <h2 className="font-heading text-2xl">Grievance Filed</h2>
          </div>
          <div className="space-y-2 text-sm mb-4">
            <div><strong>Grievance ID:</strong> {grId}</div>
            <div><strong>Category:</strong> {grCategory}</div>
            <div><strong>Assigned To:</strong> {assignTo || "Unassigned"}</div>
            <div><strong>SLA:</strong> {calcSla()}</div>
          </div>
          <button onClick={() => { onClose(); onSuccess(`✅ Grievance ${grId} filed — SLA timer started`); }} className="w-full text-sm py-2.5 rounded-lg bg-secondary text-secondary-foreground">Close</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-background overflow-y-auto">
      <div className="max-w-4xl mx-auto p-6 md:p-10">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h2 className="font-heading text-2xl">File Grievance</h2>
        </div>

        <div className="space-y-4">
          {/* Farmer search */}
          <div className="relative">
            <label className={labelCls}>Farmer ID or Name <span className="text-destructive">*</span></label>
            {selectedFarmer ? (
              <div className="flex items-center gap-2 bg-muted/30 rounded-lg px-3 py-2.5 text-sm">
                <strong>{selectedFarmer.name}</strong> ({selectedFarmer.id}) — {selectedFarmer.district}
                <button onClick={() => { setSelectedFarmer(null); setFarmerSearch(""); }} className="ml-auto text-xs text-destructive">×</button>
              </div>
            ) : (
              <>
                <input value={farmerSearch} onChange={e => setFarmerSearch(e.target.value)} className={inputCls} placeholder="Type to search..." />
                {suggestions.length > 0 && farmerSearch && (
                  <div className="absolute z-10 w-full bg-card border border-border rounded-lg mt-1 shadow-lg max-h-40 overflow-y-auto">
                    {suggestions.map(f => (
                      <button key={f.id} onClick={() => { setSelectedFarmer(f); setFarmerSearch(""); }}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-muted">{f.name} ({f.id})</button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Mode of Receipt</label>
              <select value={mode} onChange={e => setMode(e.target.value)} className={inputCls}>
                <option value="">Select Mode</option>
                {modes.map(m => <option key={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Grievance Category <span className="text-destructive">*</span></label>
              <select value={grCategory} onChange={e => { setGrCategory(e.target.value); setSubCat(""); }} className={inputCls}>
                <option value="">Select Category</option>
                {categories.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            {grCategory && subCategories[grCategory] && (
              <div>
                <label className={labelCls}>Sub-Category</label>
                <select value={subCat} onChange={e => setSubCat(e.target.value)} className={inputCls}>
                  <option value="">Select Sub-Category</option>
                  {subCategories[grCategory].map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
            )}
            <div>
              <label className={labelCls}>Date of Occurrence</label>
              <input type="date" value={grDate} onChange={e => setGrDate(e.target.value)} className={inputCls} />
            </div>
          </div>

          <div>
            <label className={labelCls}>Subject Line</label>
            <input value={subject} onChange={e => setSubject(e.target.value.slice(0, 100))} className={inputCls} placeholder="Brief subject" />
            <p className="text-xs text-muted-foreground text-right">{subject.length}/100</p>
          </div>

          <div>
            <label className={labelCls}>Detailed Description <span className="text-destructive">*</span></label>
            <textarea value={description} onChange={e => triggerAiPriority(e.target.value.slice(0, 1000))} className={`${inputCls} h-28 resize-none`} placeholder="Describe the issue in detail..." />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{description.split(/\s+/).filter(Boolean).length} words</span>
              <span>{description.length}/1000</span>
            </div>
          </div>

          <div>
            <label className={labelCls}>Previous Complaint Reference</label>
            <input value={prevRef} onChange={e => setPrevRef(e.target.value)} className={inputCls} placeholder="e.g. GR-0038 (optional)" />
            {prevRef && prevRef.startsWith("GR-") && (
              <div className="mt-2 bg-muted/30 rounded-lg p-3 text-xs">
                <strong>Linked:</strong> {prevRef} — Subsidy Delay — Resolved May 28, 2024
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Priority</label>
              <select value={priority} onChange={e => setPriority(e.target.value)} className={inputCls}>
                <option value="">Select Priority</option>
                {["High", "Medium", "Low"].map(p => <option key={p}>{p}</option>)}
              </select>
              {aiSuggestedPriority && <p className="text-xs text-warning mt-1">🤖 AI suggests: {aiSuggestedPriority}</p>}
            </div>
            <div>
              <label className={labelCls}>Preferred Resolution</label>
              <select value={resolutionMode} onChange={e => setResolutionMode(e.target.value)} className={inputCls}>
                <option value="">Select Mode</option>
                {resolutionModes.map(r => <option key={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Assign To</label>
              <select value={assignTo} onChange={e => setAssignTo(e.target.value)} className={inputCls}>
                <option value="">Select Officer</option>
                {officers.filter(o => o.role !== "District Officer").map(o => (
                  <option key={o.name}>{o.name} ({officerWorkload[o.name] || 0} cases)</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Expected Resolution Date</label>
              <div className="bg-muted/30 rounded-lg px-3 py-2.5 text-sm">{calcSla() || "Set date & priority"}</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm">Supporting Document:</span>
            <button onClick={() => setDocUploaded(true)} className={`text-xs px-3 py-1.5 rounded-lg ${docUploaded ? "bg-success/10 text-success" : "bg-secondary/10 text-secondary"}`}>
              {docUploaded ? "✅ Uploaded" : "Upload PDF/JPG"}
            </button>
          </div>

          <div>
            <label className={`${labelCls} flex items-center gap-1.5`}><Lock className="h-3 w-3" /> Internal Notes (officer only)</label>
            <textarea value={internalNotes} onChange={e => setInternalNotes(e.target.value)} className={`${inputCls} h-16 resize-none`} placeholder="Notes visible only to officers..." />
          </div>
        </div>

        <div className="flex justify-between mt-8 pt-4 border-t border-border">
          <button onClick={onClose} className="text-sm px-4 py-2.5 rounded-lg bg-muted hover:bg-muted/80">Cancel</button>
          <button onClick={handleSubmit} disabled={!selectedFarmer || !grCategory || !description}
            className="text-sm px-6 py-2.5 rounded-lg bg-secondary text-secondary-foreground hover:opacity-90 disabled:opacity-50">
            {submitting ? <div className="w-4 h-4 border-2 border-secondary-foreground border-t-transparent rounded-full animate-spin mx-auto" /> : "File Grievance"}
          </button>
        </div>
      </div>
    </div>
  );
}
