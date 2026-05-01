import { useState } from "react";
import { transactions, subsidyTrend } from "@/data/dummyData";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { IndianRupee, TrendingUp, Users, AlertTriangle, ChevronLeft, ChevronRight, X } from "lucide-react";

const kpis = [
  { label: "Total Disbursed (FY 24-25)", value: "₹18.7 Cr", icon: IndianRupee, change: "+14.2%" },
  { label: "Pending Disbursement", value: "₹3.2 Cr", icon: TrendingUp, change: "-5.3%" },
  { label: "Beneficiaries This Month", value: "2,341", icon: Users, change: "+8.7%" },
  { label: "Failed Transactions", value: "14", icon: AlertTriangle, change: "-22%" },
];

function TxnStatus({ status }: { status: string }) {
  const map: Record<string, string> = {
    Success: "bg-success/10 text-success",
    Failed: "bg-destructive/10 text-destructive",
    Pending: "bg-warning/20 text-warning",
  };
  const icons: Record<string, string> = { Success: "✅", Failed: "❌", Pending: "⏳" };
  return <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${map[status]}`}>{icons[status]} {status}</span>;
}

export default function SubsidyManagement() {
  const [page, setPage] = useState(0);
  const [showBulk, setShowBulk] = useState(false);
  const [toast, setToast] = useState("");
  const totalPages = Math.ceil(transactions.length / 10);
  const pageData = transactions.slice(page * 10, (page + 1) * 10);

  const showToastMsg = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  return (
    <div className="space-y-6 animate-fade-in" style={{ opacity: 0 }}>
      {toast && <div className="fixed top-4 right-4 z-50 bg-primary text-primary-foreground px-4 py-3 rounded-lg shadow-lg text-sm animate-fade-in" style={{ opacity: 0 }}>{toast}</div>}

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k, i) => (
          <div key={k.label} className={`bg-card border border-border rounded-lg p-4 card-hover grain-bg animate-fade-in stagger-${i + 1}`} style={{ opacity: 0 }}>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-2">
                <k.icon className="h-4 w-4 text-secondary" />
                <span className="text-xs text-success font-medium">{k.change}</span>
              </div>
              <div className="text-2xl font-heading">{k.value}</div>
              <div className="text-xs text-muted-foreground mt-1">{k.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="bg-card border border-border rounded-lg p-5 grain-bg">
        <div className="relative z-10">
          <h3 className="font-heading text-lg mb-4">Monthly Subsidy Disbursement Trend (₹ in Lakhs)</h3>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={subsidyTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(140 15% 82%)" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Area type="monotone" dataKey="amount" stroke="#1B4332" fill="#1B4332" fillOpacity={0.15} strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button onClick={() => setShowBulk(true)} className="text-sm px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:opacity-90">Bulk Disburse</button>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="bg-muted/50 text-left text-muted-foreground">
              <th className="px-4 py-3 font-medium">Txn ID</th>
              <th className="px-4 py-3 font-medium">Farmer</th>
              <th className="px-4 py-3 font-medium">Scheme</th>
              <th className="px-4 py-3 font-medium">Amount</th>
              <th className="px-4 py-3 font-medium">Bank</th>
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Action</th>
            </tr></thead>
            <tbody>{pageData.map(t => (
              <tr key={t.id} className="border-t border-border/50 table-row-alt hover:bg-muted/30 transition-colors">
                <td className="px-4 py-2.5 font-mono text-xs">{t.id}</td>
                <td className="px-4 py-2.5 font-medium">{t.farmer}</td>
                <td className="px-4 py-2.5">{t.scheme}</td>
                <td className="px-4 py-2.5 font-medium">{t.amount}</td>
                <td className="px-4 py-2.5 text-xs font-mono">{t.bank}</td>
                <td className="px-4 py-2.5">{t.date}</td>
                <td className="px-4 py-2.5"><TxnStatus status={t.status} /></td>
                <td className="px-4 py-2.5">
                  {t.status === "Failed" ? (
                    <button onClick={() => showToastMsg(`🔁 Retrying ${t.id}...`)} className="text-xs px-2 py-1 rounded bg-secondary text-secondary-foreground">Retry</button>
                  ) : t.status === "Pending" ? (
                    <button className="text-xs px-2 py-1 rounded bg-muted">Track</button>
                  ) : (
                    <button className="text-xs px-2 py-1 rounded bg-muted">Receipt</button>
                  )}
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

      {/* Bulk Disburse Modal */}
      {showBulk && (
        <div className="fixed inset-0 bg-foreground/30 z-50 flex items-center justify-center p-4" onClick={() => setShowBulk(false)}>
          <div className="bg-card border border-border rounded-xl max-w-lg w-full p-6 animate-fade-in" style={{ opacity: 0 }} onClick={e => e.stopPropagation()}>
            <div className="flex justify-between mb-4"><h2 className="font-heading text-lg">Bulk Disbursement</h2><button onClick={() => setShowBulk(false)}><X className="h-5 w-5" /></button></div>
            <p className="text-sm text-muted-foreground mb-4">47 eligible farmers selected for disbursement</p>
            <div className="max-h-48 overflow-y-auto mb-4 bg-muted/30 rounded-lg p-3 text-sm space-y-1">
              {Array.from({ length: 10 }, (_, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input type="checkbox" defaultChecked className="rounded" />
                  <span>Farmer {i + 1} — ₹2,000 — PM-KISAN</span>
                </div>
              ))}
              <p className="text-xs text-muted-foreground">... and 37 more</p>
            </div>
            <button onClick={() => { setShowBulk(false); showToastMsg("✅ 47 transactions initiated successfully"); }} className="w-full text-sm py-2.5 bg-secondary text-secondary-foreground rounded-lg hover:opacity-90">Disburse to Selected</button>
          </div>
        </div>
      )}
    </div>
  );
}
