import { useState, useMemo } from "react";
import { applications } from "@/data/dummyData";
import { X, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import SchemeApplicationForm from "@/components/forms/SchemeApplicationForm";

const tabs = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending Review" },
  { key: "ai-approved", label: "AI Pre-Approved" },
  { key: "rejected", label: "Rejected" },
  { key: "flagged", label: "Flagged" },
];

function AiStatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    "AI Approved": "bg-success/10 text-success",
    "Needs Review": "bg-warning/20 text-warning",
    "Flagged": "bg-destructive/10 text-destructive",
    "Rejected": "bg-muted text-muted-foreground",
  };
  const icons: Record<string, string> = { "AI Approved": "✅", "Needs Review": "⚠️", "Flagged": "🚩", "Rejected": "❌" };
  return <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${map[status] || "bg-muted"}`}>{icons[status] || ""} {status}</span>;
}

export default function SchemeApplications() {
  const [tab, setTab] = useState("all");
  const [page, setPage] = useState(0);
  const [reviewApp, setReviewApp] = useState<typeof applications[0] | null>(null);
  const [toast, setToast] = useState("");
  const [showNewApp, setShowNewApp] = useState(false);

  const filtered = useMemo(() => {
    if (tab === "all") return applications;
    return applications.filter(a => a.tab === tab);
  }, [tab]);

  const counts = { total: applications.length, auto: applications.filter(a => a.tab === "ai-approved").length, review: applications.filter(a => a.tab === "pending").length, flagged: applications.filter(a => a.tab === "flagged").length };
  const totalPages = Math.ceil(filtered.length / 10);
  const pageData = filtered.slice(page * 10, (page + 1) * 10);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  return (
    <div className="space-y-4 animate-fade-in" style={{ opacity: 0 }}>
      {toast && <div className="fixed top-4 right-4 z-50 bg-primary text-primary-foreground px-4 py-3 rounded-lg shadow-lg text-sm animate-fade-in" style={{ opacity: 0 }}>{toast}</div>}

      {/* Tabs + New Application */}
      <div className="flex items-center gap-3">
        <div className="flex gap-1 bg-muted/30 rounded-lg p-1 flex-1">
          {tabs.map(t => (
            <button key={t.key} onClick={() => { setTab(t.key); setPage(0); }}
              className={`text-sm px-4 py-2 rounded-md transition-colors ${tab === t.key ? "bg-card shadow-sm text-foreground font-medium" : "text-muted-foreground hover:text-foreground"}`}>
              {t.label}
            </button>
          ))}
        </div>
        <button onClick={() => setShowNewApp(true)} className="flex items-center gap-1.5 text-sm px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:opacity-90">
          <Plus className="h-4 w-4" /> New Application
        </button>
      </div>

      {/* Stats */}
      <div className="flex gap-3 flex-wrap">
        {[["Total", counts.total], ["AI Auto-processed", counts.auto], ["Needs Review", counts.review], ["Flagged", counts.flagged]].map(([l, v]) => (
          <span key={l as string} className="text-xs bg-card border border-border rounded-full px-3 py-1.5 font-medium">{l}: {v}</span>
        ))}
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="bg-muted/50 text-left text-muted-foreground">
              <th className="px-4 py-3 font-medium">App ID</th>
              <th className="px-4 py-3 font-medium">Farmer</th>
              <th className="px-4 py-3 font-medium">Scheme</th>
              <th className="px-4 py-3 font-medium">Submitted</th>
              <th className="px-4 py-3 font-medium">AI Status</th>
              <th className="px-4 py-3 font-medium">Confidence</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr></thead>
            <tbody>{pageData.map(a => (
              <tr key={a.id} className="border-t border-border/50 table-row-alt hover:bg-muted/30 transition-colors">
                <td className="px-4 py-2.5 font-mono text-xs">{a.id}</td>
                <td className="px-4 py-2.5 font-medium">{a.farmer}</td>
                <td className="px-4 py-2.5">{a.scheme}</td>
                <td className="px-4 py-2.5">{a.submitted}</td>
                <td className="px-4 py-2.5"><AiStatusBadge status={a.aiStatus} /></td>
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${a.confidence >= 80 ? "bg-success" : a.confidence >= 60 ? "bg-warning" : "bg-destructive"}`} style={{ width: `${a.confidence}%` }} />
                    </div>
                    <span className="text-xs">{a.confidence}%</span>
                  </div>
                </td>
                <td className="px-4 py-2.5">
                  <div className="flex gap-1">
                    <button onClick={() => setReviewApp(a)} className="text-xs px-2 py-1 rounded bg-primary text-primary-foreground hover:opacity-80">Review</button>
                    <button onClick={() => showToast(`✅ ${a.id} approved`)} className="text-xs px-2 py-1 rounded bg-success/10 text-success hover:bg-success/20">Approve</button>
                    <button onClick={() => showToast(`❌ ${a.id} rejected`)} className="text-xs px-2 py-1 rounded bg-destructive/10 text-destructive hover:bg-destructive/20">Reject</button>
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

      {/* Review Drawer */}
      {reviewApp && (
        <div className="fixed inset-0 bg-foreground/30 z-50 flex justify-end" onClick={() => setReviewApp(null)}>
          <div className="bg-card border-l border-border w-full max-w-lg h-full overflow-y-auto p-6 animate-fade-in" style={{ opacity: 0 }} onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-6">
              <div><h2 className="font-heading text-xl">Application Review</h2><p className="text-sm text-muted-foreground">{reviewApp.id}</p></div>
              <button onClick={() => setReviewApp(null)}><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-5">
              <div className="bg-muted/30 rounded-lg p-4">
                <h4 className="font-medium mb-2">Farmer: {reviewApp.farmer}</h4>
                <p className="text-sm text-muted-foreground">Scheme: {reviewApp.scheme} · Submitted: {reviewApp.submitted}</p>
              </div>
              <div>
                <h4 className="font-heading text-sm mb-3">AI Verification Report</h4>
                <div className="space-y-2">
                  <div className="flex items-start gap-2 text-sm"><span className="text-success">✅</span> Aadhaar verified against UIDAI</div>
                  <div className="flex items-start gap-2 text-sm"><span className="text-success">✅</span> Land record matches revenue dept data</div>
                  <div className="flex items-start gap-2 text-sm"><span className="text-success">✅</span> Bank account is valid and farmer-linked</div>
                  <div className="flex items-start gap-2 text-sm"><span className="text-warning">⚠️</span> Previous scheme benefit detected (PM-KISAN 2022)</div>
                  <div className="flex items-start gap-2 text-sm"><span className="text-destructive">❌</span> Address mismatch: Application says Wardha, record says Amravati</div>
                </div>
              </div>
              <div className="bg-warning/10 border border-warning/30 rounded-lg p-4">
                <h4 className="font-medium text-sm mb-1">AI Recommendation</h4>
                <p className="text-sm">RECOMMEND HOLD — Address discrepancy needs verification</p>
              </div>
              <div>
                <h4 className="font-heading text-sm mb-2">Officer Comments</h4>
                <textarea className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg h-20 resize-none" placeholder="Add your comments..." />
              </div>
              <div className="flex gap-2 flex-wrap">
                <button onClick={() => { setReviewApp(null); showToast("✅ Application approved"); }} className="text-sm px-4 py-2 rounded-lg bg-success text-primary-foreground hover:opacity-90">Approve</button>
                <button onClick={() => { setReviewApp(null); showToast("❌ Application rejected"); }} className="text-sm px-4 py-2 rounded-lg bg-destructive text-destructive-foreground hover:opacity-90">Reject</button>
                <button onClick={() => showToast("📩 Info requested from farmer")} className="text-sm px-4 py-2 rounded-lg bg-muted hover:bg-muted/80">Request More Info</button>
                <button onClick={() => showToast("⬆️ Escalated to supervisor")} className="text-sm px-4 py-2 rounded-lg bg-warning/20 text-warning hover:opacity-80">Escalate</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Application Form */}
      {showNewApp && <SchemeApplicationForm onClose={() => setShowNewApp(false)} onSuccess={showToast} />}
    </div>
  );
}
