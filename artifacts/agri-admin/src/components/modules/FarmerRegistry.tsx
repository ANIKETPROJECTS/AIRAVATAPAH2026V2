import { useState, useMemo, useEffect } from "react";
import { Search, Plus, Upload, Download, X, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { farmers } from "@/data/dummyData";
import { getApprovedFarmers, subscribeToFarmers, FarmerRecord } from "@/data/farmerStore";
import FarmerRegistrationForm from "@/components/forms/FarmerRegistrationForm";

type AnyFarmer = {
  id: string;
  name: string;
  village: string;
  district: string;
  land: number;
  crop: string;
  aadhaar: string;
  status: string;
  source?: string;
};

function toAnyFarmer(f: typeof farmers[0] | FarmerRecord): AnyFarmer {
  return {
    id: f.id,
    name: f.name,
    village: f.village,
    district: f.district,
    land: Number(f.land),
    crop: f.crop,
    aadhaar: f.aadhaar,
    status: f.status,
    source: (f as FarmerRecord).source,
  };
}

function StatusBadge({ status }: { status: string }) {
  const cls = status === "Active" ? "bg-success/10 text-success" :
    status === "Inactive" ? "bg-muted text-muted-foreground" :
    "bg-warning/20 text-warning";
  return <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${cls}`}>{status}</span>;
}

export default function FarmerRegistry() {
  const [search, setSearch] = useState("");
  const [distFilter, setDistFilter] = useState("");
  const [cropFilter, setCropFilter] = useState("");
  const [page, setPage] = useState(0);
  const [showAdd, setShowAdd] = useState(false);
  const [viewFarmer, setViewFarmer] = useState<AnyFarmer | null>(null);
  const [toast, setToast] = useState("");
  const [approvedFarmers, setApprovedFarmers] = useState<FarmerRecord[]>(() => getApprovedFarmers());

  useEffect(() => {
    return subscribeToFarmers(() => {
      setApprovedFarmers(getApprovedFarmers());
    });
  }, []);

  const allFarmers = useMemo<AnyFarmer[]>(() => {
    const base = farmers.map(toAnyFarmer);
    const approved = approvedFarmers.map(toAnyFarmer);
    return [...approved, ...base];
  }, [approvedFarmers]);

  const districts = useMemo(() => [...new Set(allFarmers.map(f => f.district))], [allFarmers]);
  const crops = useMemo(() => [...new Set(allFarmers.map(f => f.crop))], [allFarmers]);

  const filtered = useMemo(() => {
    return allFarmers.filter(f => {
      const s = search.toLowerCase();
      const matchSearch = !s || f.name.toLowerCase().includes(s) || f.id.toLowerCase().includes(s) || f.aadhaar.includes(s);
      const matchDist = !distFilter || f.district === distFilter;
      const matchCrop = !cropFilter || f.crop === cropFilter;
      return matchSearch && matchDist && matchCrop;
    });
  }, [search, distFilter, cropFilter, allFarmers]);

  const totalPages = Math.ceil(filtered.length / 10);
  const pageData = filtered.slice(page * 10, (page + 1) * 10);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  return (
    <div className="space-y-4 animate-fade-in" style={{ opacity: 0 }}>
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-primary text-primary-foreground px-4 py-3 rounded-lg shadow-lg text-sm animate-fade-in" style={{ opacity: 0 }}>
          {toast}
        </div>
      )}

      {approvedFarmers.length > 0 && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm">
          <Sparkles className="h-4 w-4 flex-shrink-0" />
          <span><strong>{approvedFarmers.length}</strong> new farmer{approvedFarmers.length > 1 ? "s" : ""} added via OCR registration and appear{approvedFarmers.length === 1 ? "s" : ""} at the top of the list.</span>
        </div>
      )}

      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(0); }}
            placeholder="Search by name, ID, Aadhaar..."
            className="w-full pl-9 pr-3 py-2 text-sm bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary/50" />
        </div>
        <select value={distFilter} onChange={e => { setDistFilter(e.target.value); setPage(0); }}
          className="text-sm bg-card border border-border rounded-lg px-3 py-2">
          <option value="">All Districts</option>
          {districts.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        <select value={cropFilter} onChange={e => { setCropFilter(e.target.value); setPage(0); }}
          className="text-sm bg-card border border-border rounded-lg px-3 py-2">
          <option value="">All Crops</option>
          {crops.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-1.5 text-sm px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:opacity-90"><Plus className="h-4 w-4" /> Add Farmer</button>
        <button onClick={() => showToast("✅ CSV imported successfully — 24 records added")} className="flex items-center gap-1.5 text-sm px-3 py-2 bg-card border border-border rounded-lg hover:bg-muted"><Upload className="h-4 w-4" /> Import</button>
        <button onClick={() => showToast("📁 Export started...")} className="flex items-center gap-1.5 text-sm px-3 py-2 bg-card border border-border rounded-lg hover:bg-muted"><Download className="h-4 w-4" /> Export</button>
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 text-left text-muted-foreground">
                <th className="px-4 py-3 font-medium">Farmer ID</th>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Village</th>
                <th className="px-4 py-3 font-medium">District</th>
                <th className="px-4 py-3 font-medium">Land (ac)</th>
                <th className="px-4 py-3 font-medium">Crop</th>
                <th className="px-4 py-3 font-medium">Aadhaar</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pageData.map(f => (
                <tr
                  key={f.id}
                  className={`border-t border-border/50 table-row-alt hover:bg-muted/30 transition-colors ${f.source === "ocr" ? "bg-emerald-50/40" : ""}`}
                >
                  <td className="px-4 py-2.5 font-mono text-xs">
                    <span className="flex items-center gap-1">
                      {f.id}
                      {f.source === "ocr" && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-medium">
                          <Sparkles className="h-2.5 w-2.5" />OCR
                        </span>
                      )}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 font-medium">{f.name}</td>
                  <td className="px-4 py-2.5">{f.village}</td>
                  <td className="px-4 py-2.5">{f.district}</td>
                  <td className="px-4 py-2.5">{f.land}</td>
                  <td className="px-4 py-2.5">{f.crop}</td>
                  <td className="px-4 py-2.5 font-mono text-xs">{f.aadhaar}</td>
                  <td className="px-4 py-2.5"><StatusBadge status={f.status} /></td>
                  <td className="px-4 py-2.5">
                    <div className="flex gap-1">
                      <button onClick={() => setViewFarmer(f)} className="text-xs px-2 py-1 rounded bg-primary text-primary-foreground hover:opacity-80">View</button>
                      <button className="text-xs px-2 py-1 rounded bg-muted text-foreground hover:bg-muted/80">Edit</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between px-4 py-3 border-t border-border">
          <span className="text-xs text-muted-foreground">Showing {page * 10 + 1}–{Math.min((page + 1) * 10, filtered.length)} of {filtered.length}</span>
          <div className="flex gap-1">
            <button disabled={page === 0} onClick={() => setPage(p => p - 1)} className="p-1.5 rounded hover:bg-muted disabled:opacity-30"><ChevronLeft className="h-4 w-4" /></button>
            <button disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)} className="p-1.5 rounded hover:bg-muted disabled:opacity-30"><ChevronRight className="h-4 w-4" /></button>
          </div>
        </div>
      </div>

      {viewFarmer && (
        <div className="fixed inset-0 bg-foreground/30 z-50 flex items-center justify-center p-4" onClick={() => setViewFarmer(null)}>
          <div className="bg-card border border-border rounded-xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 animate-fade-in" style={{ opacity: 0 }} onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-6">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-heading text-xl">{viewFarmer.name}</h2>
                  {viewFarmer.source === "ocr" && (
                    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-medium">
                      <Sparkles className="h-3 w-3" />OCR Registered
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{viewFarmer.id} · {viewFarmer.village}, {viewFarmer.district}</p>
              </div>
              <button onClick={() => setViewFarmer(null)}><X className="h-5 w-5" /></button>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-muted/30 rounded-lg p-3">
                <div className="text-xs text-muted-foreground">Land Holdings</div>
                <div className="font-semibold">{viewFarmer.land} acres</div>
              </div>
              <div className="bg-muted/30 rounded-lg p-3">
                <div className="text-xs text-muted-foreground">Primary Crop</div>
                <div className="font-semibold">{viewFarmer.crop}</div>
              </div>
              <div className="bg-muted/30 rounded-lg p-3">
                <div className="text-xs text-muted-foreground">Aadhaar</div>
                <div className="font-semibold font-mono">{viewFarmer.aadhaar}</div>
              </div>
              <div className="bg-muted/30 rounded-lg p-3">
                <div className="text-xs text-muted-foreground">Status</div>
                <StatusBadge status={viewFarmer.status} />
              </div>
            </div>
            {!viewFarmer.source && (
              <>
                <div className="mb-4">
                  <h4 className="font-heading text-sm mb-2">Scheme Enrollments</h4>
                  <div className="flex flex-wrap gap-2">
                    <span className="text-xs px-2.5 py-1 rounded-full bg-success/10 text-success">PM-KISAN ✅</span>
                    <span className="text-xs px-2.5 py-1 rounded-full bg-success/10 text-success">PMFBY ✅</span>
                    <span className="text-xs px-2.5 py-1 rounded-full bg-warning/20 text-warning">KCC ⏳</span>
                  </div>
                </div>
                <div className="mb-4">
                  <h4 className="font-heading text-sm mb-2">AI Risk Score</h4>
                  <div className="flex items-center gap-3">
                    <div className="relative w-16 h-16">
                      <svg className="w-16 h-16 -rotate-90" viewBox="0 0 36 36">
                        <circle cx="18" cy="18" r="14" fill="none" stroke="hsl(140 20% 90%)" strokeWidth="3" />
                        <circle cx="18" cy="18" r="14" fill="none" stroke="hsl(142 60% 40%)" strokeWidth="3" strokeDasharray="88" strokeDashoffset={88 - 88 * 0.32} strokeLinecap="round" />
                      </svg>
                      <span className="absolute inset-0 flex items-center justify-center text-xs font-bold">32</span>
                    </div>
                    <span className="text-sm text-success font-medium">Low Risk</span>
                  </div>
                </div>
                <div className="mb-4">
                  <h4 className="font-heading text-sm mb-2">Documents</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {["Aadhaar Card", "Land Record", "Bank Passbook", "Photo ID"].map(d => (
                      <div key={d} className="flex items-center gap-2 bg-muted/30 rounded-lg p-2.5 text-sm">
                        <div className="w-8 h-8 bg-primary/10 rounded flex items-center justify-center text-xs">📄</div>
                        <span>{d}</span>
                        <button className="ml-auto text-xs text-secondary hover:underline">View</button>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {showAdd && (
        <FarmerRegistrationForm onClose={() => setShowAdd(false)} onSuccess={showToast} />
      )}
    </div>
  );
}
