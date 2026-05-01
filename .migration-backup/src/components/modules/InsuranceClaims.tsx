import { useState } from "react";
import { claims } from "@/data/dummyData";
import { Shield, CheckCircle, Clock, AlertTriangle, XCircle, X, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import InsuranceClaimForm from "@/components/forms/InsuranceClaimForm";

const statusKpis = [
  { label: "Claims Filed", value: 89, icon: Shield },
  { label: "Under AI Review", value: 31, icon: Clock },
  { label: "Approved", value: 44, icon: CheckCircle },
  { label: "Rejected", value: 8, icon: XCircle },
  { label: "Settled", value: 6, icon: CheckCircle },
];

const assessments = [
  { village: "Wardha Block", crop: "Cotton", loss: 68, confidence: 91, status: "Auto-approved for claim processing" },
  { village: "Latur Taluka", crop: "Soybean", loss: 23, confidence: 78, status: "Needs ground verification" },
  { village: "Amravati", crop: "Tur Dal", loss: 81, confidence: 95, status: "Auto-approved" },
];

function ClaimStatus({ status }: { status: string }) {
  const map: Record<string, string> = {
    "AI Approved": "bg-success/10 text-success", Verification: "bg-warning/20 text-warning",
    Disputed: "bg-destructive/10 text-destructive", Rejected: "bg-muted text-muted-foreground",
    Settled: "bg-info/10 text-info",
  };
  const icons: Record<string, string> = { "AI Approved": "✅", Verification: "⏳", Disputed: "🚩", Rejected: "❌", Settled: "💰" };
  return <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${map[status] || "bg-muted"}`}>{icons[status]} {status}</span>;
}

export default function InsuranceClaims() {
  const [page, setPage] = useState(0);
  const [viewClaim, setViewClaim] = useState<typeof claims[0] | null>(null);
  const [toast, setToast] = useState("");
  const [showFileClaim, setShowFileClaim] = useState(false);
  const totalPages = Math.ceil(claims.length / 10);
  const pageData = claims.slice(page * 10, (page + 1) * 10);
  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  return (
    <div className="space-y-6 animate-fade-in" style={{ opacity: 0 }}>
      {toast && <div className="fixed top-4 right-4 z-50 bg-primary text-primary-foreground px-4 py-3 rounded-lg shadow-lg text-sm animate-fade-in" style={{ opacity: 0 }}>{toast}</div>}

      {/* Status Cards + File Claim button */}
      <div className="flex items-center justify-between">
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 flex-1">
          {statusKpis.map((k, i) => (
            <div key={k.label} className={`bg-card border border-border rounded-lg p-4 card-hover animate-fade-in stagger-${i + 1}`} style={{ opacity: 0 }}>
              <k.icon className="h-4 w-4 text-secondary mb-2" />
              <div className="text-2xl font-heading">{k.value}</div>
              <div className="text-xs text-muted-foreground">{k.label}</div>
            </div>
          ))}
        </div>
      </div>
      <button onClick={() => setShowFileClaim(true)} className="flex items-center gap-1.5 text-sm px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:opacity-90">
        <Plus className="h-4 w-4" /> File New Claim
      </button>

      {/* AI Assessment Panel */}
      <div className="bg-agri-light border border-border rounded-lg p-5">
        <h3 className="font-heading text-lg mb-1">🤖 AI Crop Loss Assessment</h3>
        <p className="text-sm text-muted-foreground mb-4">AI analyzes satellite imagery + weather data to auto-assess crop loss percentage</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {assessments.map((a, i) => (
            <div key={i} className="bg-card border border-border rounded-lg p-4">
              <div className="font-medium text-sm">{a.village}</div>
              <div className="text-xs text-muted-foreground mb-2">Crop: {a.crop}</div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-lg font-heading">{a.loss}%</span>
                <span className="text-xs text-muted-foreground">loss</span>
                <span className="ml-auto text-xs">Conf: {a.confidence}%</span>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full ${a.confidence >= 90 ? "bg-success/10 text-success" : "bg-warning/20 text-warning"}`}>{a.status}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Claims Table */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="bg-muted/50 text-left text-muted-foreground">
              <th className="px-4 py-3 font-medium">Claim ID</th>
              <th className="px-4 py-3 font-medium">Farmer</th>
              <th className="px-4 py-3 font-medium">Crop</th>
              <th className="px-4 py-3 font-medium">Loss% (AI)</th>
              <th className="px-4 py-3 font-medium">Amount</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Filed</th>
              <th className="px-4 py-3 font-medium">Action</th>
            </tr></thead>
            <tbody>{pageData.map(c => (
              <tr key={c.id} className="border-t border-border/50 table-row-alt hover:bg-muted/30 transition-colors">
                <td className="px-4 py-2.5 font-mono text-xs">{c.id}</td>
                <td className="px-4 py-2.5 font-medium">{c.farmer}</td>
                <td className="px-4 py-2.5">{c.crop}</td>
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-12 h-2 bg-muted rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${c.loss >= 60 ? "bg-destructive" : c.loss >= 40 ? "bg-warning" : "bg-success"}`} style={{ width: `${c.loss}%` }} />
                    </div>
                    <span className="text-xs">{c.loss}%</span>
                  </div>
                </td>
                <td className="px-4 py-2.5 font-medium">{c.amount}</td>
                <td className="px-4 py-2.5"><ClaimStatus status={c.status} /></td>
                <td className="px-4 py-2.5">{c.filed}</td>
                <td className="px-4 py-2.5">
                  <div className="flex gap-1">
                    <button onClick={() => setViewClaim(c)} className="text-xs px-2 py-1 rounded bg-primary text-primary-foreground">View</button>
                    {c.status === "AI Approved" && <button onClick={() => showToast(`✅ ${c.id} settlement initiated`)} className="text-xs px-2 py-1 rounded bg-success/10 text-success">Process</button>}
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

      {/* Claim Detail Modal */}
      {viewClaim && (
        <div className="fixed inset-0 bg-foreground/30 z-50 flex justify-end" onClick={() => setViewClaim(null)}>
          <div className="bg-card border-l border-border w-full max-w-lg h-full overflow-y-auto p-6 animate-fade-in" style={{ opacity: 0 }} onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-6">
              <div><h2 className="font-heading text-xl">Claim Details</h2><p className="text-sm text-muted-foreground">{viewClaim.id}</p></div>
              <button onClick={() => setViewClaim(null)}><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-5">
              <div className="bg-muted/30 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-muted-foreground">Farmer:</span> <strong>{viewClaim.farmer}</strong></div>
                  <div><span className="text-muted-foreground">Crop:</span> <strong>{viewClaim.crop}</strong></div>
                  <div><span className="text-muted-foreground">AI Loss:</span> <strong>{viewClaim.loss}%</strong></div>
                  <div><span className="text-muted-foreground">Amount:</span> <strong>{viewClaim.amount}</strong></div>
                </div>
              </div>
              <div>
                <h4 className="font-heading text-sm mb-2">Satellite Assessment</h4>
                <div className="bg-muted/50 rounded-lg h-40 flex items-center justify-center text-muted-foreground text-sm border border-border">
                  🛰️ Satellite View — {viewClaim.crop} field, {viewClaim.farmer}
                </div>
              </div>
              <div>
                <h4 className="font-heading text-sm mb-2">Document Checklist</h4>
                <div className="space-y-1.5">
                  {[["FIR Copy", true], ["Crop Photos", true], ["Land Record", true], ["Bank Details", false]].map(([d, ok]) => (
                    <div key={d as string} className="flex items-center gap-2 text-sm">
                      <span>{ok ? "✅" : "❌"}</span><span>{d as string}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-agri-light border border-border rounded-lg p-4">
                <h4 className="font-heading text-sm mb-2">Settlement Calculator</h4>
                <div className="text-sm space-y-1">
                  <div>Claim: {viewClaim.amount}</div>
                  <div>Deductible: ₹2,000</div>
                  <div className="font-bold pt-1 border-t border-border">Net Payable: ₹{(parseInt(viewClaim.amount.replace(/[₹,]/g, "")) - 2000).toLocaleString()}</div>
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                <button onClick={() => { setViewClaim(null); showToast("✅ Settlement initiated"); }} className="text-sm px-4 py-2 rounded-lg bg-success text-primary-foreground">Approve & Settle</button>
                <button onClick={() => { setViewClaim(null); showToast("❌ Claim rejected"); }} className="text-sm px-4 py-2 rounded-lg bg-destructive text-destructive-foreground">Reject</button>
                <button onClick={() => showToast("📋 Survey requested")} className="text-sm px-4 py-2 rounded-lg bg-muted">Request Survey</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* File Claim Form */}
      {showFileClaim && <InsuranceClaimForm onClose={() => setShowFileClaim(false)} onSuccess={showToast} />}
    </div>
  );
}
