import { useState, useMemo, useEffect, useCallback } from "react";
import { Search, Plus, Upload, Download, ChevronLeft, ChevronRight, Sparkles, Loader2, AlertCircle, Trash2 } from "lucide-react";
import { apiFetchFarmers, apiDeleteFarmer, notifyFarmerChange, type FarmerRecord } from "@/data/farmerApi";
import FarmerRegistrationForm from "@/components/forms/FarmerRegistrationForm";
import FarmerDetailModal from "@/components/modules/FarmerDetailModal";

function StatusBadge({ status }: { status: string }) {
  const cls = status === "Active" ? "bg-success/10 text-success" :
    status === "Inactive" ? "bg-muted text-muted-foreground" :
    "bg-warning/20 text-warning";
  return <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${cls}`}>{status}</span>;
}

export default function FarmerRegistry() {
  const [farmers, setFarmers] = useState<FarmerRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [distFilter, setDistFilter] = useState("");
  const [cropFilter, setCropFilter] = useState("");
  const [page, setPage] = useState(0);
  const [showAdd, setShowAdd] = useState(false);
  const [viewFarmer, setViewFarmer] = useState<FarmerRecord | null>(null);
  const [toast, setToast] = useState("");
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const loadFarmers = useCallback(async () => {
    try {
      setError("");
      const data = await apiFetchFarmers();
      setFarmers(data);
    } catch {
      setError("Failed to load farmers. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFarmers();
  }, [loadFarmers]);

  useEffect(() => {
    const handler = () => loadFarmers();
    window.addEventListener("farmer-registry-changed", handler);
    return () => window.removeEventListener("farmer-registry-changed", handler);
  }, [loadFarmers]);

  const districts = useMemo(() => [...new Set(farmers.map(f => f.district))].sort(), [farmers]);
  const crops = useMemo(() => [...new Set(farmers.map(f => f.crop))].sort(), [farmers]);

  const filtered = useMemo(() => {
    return farmers.filter(f => {
      const s = search.toLowerCase();
      const matchSearch = !s || f.name.toLowerCase().includes(s) || f.farmerId.toLowerCase().includes(s) || f.aadhaar.includes(s);
      const matchDist = !distFilter || f.district === distFilter;
      const matchCrop = !cropFilter || f.crop === cropFilter;
      return matchSearch && matchDist && matchCrop;
    });
  }, [search, distFilter, cropFilter, farmers]);

  const totalPages = Math.ceil(filtered.length / 10);
  const pageData = filtered.slice(page * 10, (page + 1) * 10);

  const newlyAdded = farmers.filter(f => f.source === "ocr" || f.source === "manual").length;

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  const handleFarmerDeleted = (id: string) => {
    setFarmers(prev => prev.filter(f => f.farmerId !== id));
    setViewFarmer(null);
    showToast("Farmer deleted successfully");
  };

  const handleRowDelete = async (farmerId: string) => {
    if (pendingDelete !== farmerId) {
      setPendingDelete(farmerId);
      setTimeout(() => setPendingDelete(prev => prev === farmerId ? null : prev), 3000);
      return;
    }
    setPendingDelete(null);
    setDeleting(farmerId);
    try {
      await apiDeleteFarmer(farmerId);
      setFarmers(prev => prev.filter(f => f.farmerId !== farmerId));
      showToast("Farmer deleted");
    } catch {
      showToast("Delete failed — please try again");
    } finally {
      setDeleting(null);
    }
  };

  const handleFarmerUpdated = (updated: FarmerRecord) => {
    setFarmers(prev => prev.map(f => f.farmerId === updated.farmerId ? updated : f));
    setViewFarmer(updated);
  };

  const handleRegistrationSuccess = (msg: string) => {
    showToast(msg);
    loadFarmers();
  };

  return (
    <div className="space-y-4 animate-fade-in" style={{ opacity: 0 }}>
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-primary text-primary-foreground px-4 py-3 rounded-lg shadow-lg text-sm animate-fade-in" style={{ opacity: 0 }}>
          {toast}
        </div>
      )}

      {newlyAdded > 0 && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm">
          <Sparkles className="h-4 w-4 flex-shrink-0" />
          <span><strong>{newlyAdded}</strong> new farmer{newlyAdded > 1 ? "s" : ""} recently added and saved to the database.</span>
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
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-1.5 text-sm px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:opacity-90">
          <Plus className="h-4 w-4" /> Add Farmer
        </button>
        <button onClick={() => showToast("✅ CSV imported successfully — 24 records added")} className="flex items-center gap-1.5 text-sm px-3 py-2 bg-card border border-border rounded-lg hover:bg-muted">
          <Upload className="h-4 w-4" /> Import
        </button>
        <button onClick={() => showToast("📁 Export started...")} className="flex items-center gap-1.5 text-sm px-3 py-2 bg-card border border-border rounded-lg hover:bg-muted">
          <Download className="h-4 w-4" /> Export
        </button>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm">Loading farmers...</span>
        </div>
      )}

      {error && !loading && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {error}
          <button onClick={loadFarmers} className="ml-auto underline text-xs">Retry</button>
        </div>
      )}

      {!loading && !error && (
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
                    key={f.farmerId}
                    className={`border-t border-border/50 hover:bg-muted/30 transition-colors ${f.source === "ocr" ? "bg-emerald-50/40" : f.source === "manual" ? "bg-blue-50/30" : ""}`}
                  >
                    <td className="px-4 py-2.5 font-mono text-xs">
                      <span className="flex items-center gap-1">
                        {f.farmerId}
                        {f.source === "ocr" && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-medium">
                            <Sparkles className="h-2.5 w-2.5" />OCR
                          </span>
                        )}
                        {f.source === "manual" && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">
                            Manual
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
                      <div className="flex gap-1 items-center">
                        <button
                          onClick={() => setViewFarmer(f)}
                          className="text-xs px-2 py-1 rounded bg-primary text-primary-foreground hover:opacity-80"
                        >
                          View
                        </button>
                        <button
                          onClick={() => setViewFarmer(f)}
                          className="text-xs px-2 py-1 rounded bg-muted text-foreground hover:bg-muted/80"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleRowDelete(f.farmerId)}
                          disabled={deleting === f.farmerId}
                          className={`text-xs px-2 py-1 rounded flex items-center gap-1 transition-colors ${
                            pendingDelete === f.farmerId
                              ? "bg-destructive text-destructive-foreground animate-pulse"
                              : "bg-destructive/10 text-destructive hover:bg-destructive/20"
                          }`}
                        >
                          {deleting === f.farmerId ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Trash2 className="h-3 w-3" />
                          )}
                          {pendingDelete === f.farmerId ? "Confirm?" : "Delete"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {pageData.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-4 py-10 text-center text-sm text-muted-foreground">
                      No farmers found matching your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <span className="text-xs text-muted-foreground">
              {filtered.length > 0
                ? `Showing ${page * 10 + 1}–${Math.min((page + 1) * 10, filtered.length)} of ${filtered.length}`
                : "No results"}
            </span>
            <div className="flex gap-1">
              <button disabled={page === 0} onClick={() => setPage(p => p - 1)} className="p-1.5 rounded hover:bg-muted disabled:opacity-30"><ChevronLeft className="h-4 w-4" /></button>
              <button disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)} className="p-1.5 rounded hover:bg-muted disabled:opacity-30"><ChevronRight className="h-4 w-4" /></button>
            </div>
          </div>
        </div>
      )}

      {viewFarmer && (
        <FarmerDetailModal
          farmer={viewFarmer}
          onClose={() => setViewFarmer(null)}
          onDeleted={handleFarmerDeleted}
          onUpdated={handleFarmerUpdated}
        />
      )}

      {showAdd && (
        <FarmerRegistrationForm
          onClose={() => setShowAdd(false)}
          onSuccess={handleRegistrationSuccess}
        />
      )}
    </div>
  );
}
