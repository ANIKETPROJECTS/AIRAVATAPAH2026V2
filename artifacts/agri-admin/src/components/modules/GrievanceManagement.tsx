import { useState, useMemo } from "react";
import { grievances } from "@/data/dummyData";
import { X, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import GrievanceFilingForm from "@/components/forms/GrievanceFilingForm";

const categories = ["Subsidy Delay", "Wrong Beneficiary", "Document Issue", "Officer Misconduct", "Technical Error", "Others"];
const categoryCounts: Record<string, number> = { "Subsidy Delay": 42, "Wrong Beneficiary": 31, "Document Issue": 28, "Officer Misconduct": 12, "Technical Error": 19, Others: 39 };

function PriorityBadge({ p }: { p: string }) {
  const cls = p === "High" ? "bg-destructive/10 text-destructive" : p === "Medium" ? "bg-warning/20 text-warning" : "bg-success/10 text-success";
  const icon = p === "High" ? "🔴" : p === "Medium" ? "🟡" : "🟢";
  return <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${cls}`}>{icon} {p}</span>;
}

function GrStatus({ s }: { s: string }) {
  const cls = s === "Resolved" ? "bg-success/10 text-success" : s === "In Progress" ? "bg-info/10 text-info" : s === "Escalated" ? "bg-destructive/10 text-destructive" : "bg-warning/20 text-warning";
  return <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${cls}`}>{s}</span>;
}

export default function GrievanceManagement() {
  const [page, setPage] = useState(0);
  const [viewGr, setViewGr] = useState<typeof grievances[0] | null>(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [toast, setToast] = useState("");
  const [showFileGrievance, setShowFileGrievance] = useState(false);
  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  const filtered = useMemo(() => !statusFilter ? grievances : grievances.filter(g => g.status === statusFilter), [statusFilter]);
  const totalPages = Math.ceil(filtered.length / 10);
  const pageData = filtered.slice(page * 10, (page + 1) * 10);

  const kpis = [
    { label: "Total", value: 171 }, { label: "Open", value: 15 }, { label: "In Progress", value: 38 },
    { label: "Resolved", value: 156 }, { label: "Escalated", value: 7 }, { label: "Avg Resolution", value: "3.2 days" },
  ];

  return (
    <div className="space-y-6 animate-fade-in" style={{ opacity: 0 }}>
      {toast && <div className="fixed top-4 right-4 z-50 bg-primary text-primary-foreground px-4 py-3 rounded-lg shadow-lg text-sm animate-fade-in" style={{ opacity: 0 }}>{toast}</div>}

      {/* KPIs */}
      <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
        {kpis.map(k => (
          <div key={k.label} className="bg-card border border-border rounded-lg p-3 text-center card-hover">
            <div className="text-xl font-heading">{k.value}</div>
            <div className="text-xs text-muted-foreground">{k.label}</div>
          </div>
        ))}
      </div>

      {/* AI Classifier + File button */}
      <div className="flex items-center justify-between">
        <div className="bg-agri-light border border-border rounded-lg p-5 flex-1">
          <h3 className="font-heading text-lg mb-3">🤖 AI Grievance Classifier</h3>
          <div className="flex flex-wrap gap-2">
            {categories.map(c => (
              <button key={c} className="text-xs px-3 py-1.5 rounded-full bg-card border border-border font-medium hover:bg-muted transition-colors">
                {c} ({categoryCounts[c]})
              </button>
            ))}
          </div>
        </div>
        <button onClick={() => setShowFileGrievance(true)} className="flex items-center gap-1.5 text-sm px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:opacity-90 ml-4">
          <Plus className="h-4 w-4" /> File Grievance
        </button>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {["", "Open", "In Progress", "Resolved", "Escalated"].map(s => (
          <button key={s} onClick={() => { setStatusFilter(s); setPage(0); }}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${statusFilter === s ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border hover:bg-muted"}`}>
            {s || "All"}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="bg-muted/50 text-left text-muted-foreground">
              <th className="px-4 py-3 font-medium">GR ID</th>
              <th className="px-4 py-3 font-medium">Farmer</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">Filed</th>
              <th className="px-4 py-3 font-medium">Priority</th>
              <th className="px-4 py-3 font-medium">Assigned</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">SLA</th>
              <th className="px-4 py-3 font-medium">Action</th>
            </tr></thead>
            <tbody>{pageData.map(g => (
              <tr key={g.id} className="border-t border-border/50 table-row-alt hover:bg-muted/30 transition-colors">
                <td className="px-4 py-2.5 font-mono text-xs">{g.id}</td>
                <td className="px-4 py-2.5 font-medium">{g.farmer}</td>
                <td className="px-4 py-2.5">{g.category}</td>
                <td className="px-4 py-2.5">{g.filed}</td>
                <td className="px-4 py-2.5"><PriorityBadge p={g.priority} /></td>
                <td className="px-4 py-2.5">{g.assigned}</td>
                <td className="px-4 py-2.5"><GrStatus s={g.status} /></td>
                <td className="px-4 py-2.5 text-xs">{g.sla}</td>
                <td className="px-4 py-2.5">
                  <div className="flex gap-1">
                    <button onClick={() => setViewGr(g)} className="text-xs px-2 py-1 rounded bg-primary text-primary-foreground">View</button>
                    {g.status !== "Resolved" && <button onClick={() => showToast(`📋 ${g.id} reassigned`)} className="text-xs px-2 py-1 rounded bg-muted">Reassign</button>}
                  </div>
                </td>
              </tr>
            ))}</tbody>
          </table>
        </div>
        <div className="flex items-center justify-between px-4 py-3 border-t border-border">
          <span className="text-xs text-muted-foreground">Page {page + 1} of {totalPages}</span>
          <div className="flex gap-1">
            <button disabled={page === 0} onClick={() => setPage(p => p - 1)} className="p-1.5 rounded hover:bg-muted disabled:opacity-30"><ChevronLeft className="h-4 w-4" /></button>
            <button disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)} className="p-1.5 rounded hover:bg-muted disabled:opacity-30"><ChevronRight className="h-4 w-4" /></button>
          </div>
        </div>
      </div>

      {/* Grievance Detail */}
      {viewGr && (
        <div className="fixed inset-0 bg-foreground/30 z-50 flex items-center justify-center p-4" onClick={() => setViewGr(null)}>
          <div className="bg-card border border-border rounded-xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 animate-fade-in" style={{ opacity: 0 }} onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-6">
              <div><h2 className="font-heading text-xl">Grievance Detail</h2><p className="text-sm text-muted-foreground">{viewGr.id} — {viewGr.farmer}</p></div>
              <button onClick={() => setViewGr(null)}><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-5">
              <div className="bg-muted/30 rounded-lg p-4 text-sm">
                <p>Dear Sir, I have been waiting for my PM-KISAN subsidy for the past 3 months. My application was approved but the amount has not been credited to my bank account. I have visited the district office twice but have not received any satisfactory response. Please look into this matter urgently.</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium">AI Classification:</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-info/10 text-info">{viewGr.category} — 87% confidence</span>
              </div>
              <div>
                <h4 className="font-heading text-sm mb-2">AI Suggested Response</h4>
                <textarea defaultValue={`Dear ${viewGr.farmer} ji, We have received your complaint regarding ${viewGr.category.toLowerCase()}. Our team is verifying the details and working to resolve this at the earliest. Expected resolution: 2 working days.`}
                  className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg h-24 resize-none" />
              </div>
              <div>
                <h4 className="font-heading text-sm mb-3">Activity Timeline</h4>
                <div className="space-y-3 border-l-2 border-border pl-4 ml-2">
                  {["Filed by farmer", "AI Classified — " + viewGr.category, "Assigned to " + viewGr.assigned, "Officer contacted farmer", viewGr.status === "Resolved" ? "Resolution confirmed" : "Awaiting resolution"].map((step, i) => (
                    <div key={i} className="relative">
                      <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-secondary border-2 border-card" />
                      <div className="text-sm">{step}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                <button onClick={() => { setViewGr(null); showToast("📩 Response sent to farmer"); }} className="text-sm px-4 py-2 rounded-lg bg-primary text-primary-foreground">Send Response</button>
                <button onClick={() => { setViewGr(null); showToast("⬆️ Escalated"); }} className="text-sm px-4 py-2 rounded-lg bg-warning/20 text-warning">Escalate</button>
                <button onClick={() => { setViewGr(null); showToast("✅ Marked as resolved"); }} className="text-sm px-4 py-2 rounded-lg bg-success text-primary-foreground">Mark Resolved</button>
                <button onClick={() => showToast("📋 Reassigned")} className="text-sm px-4 py-2 rounded-lg bg-muted">Reassign</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* File Grievance Form */}
      {showFileGrievance && <GrievanceFilingForm onClose={() => setShowFileGrievance(false)} onSuccess={showToast} />}
    </div>
  );
}
