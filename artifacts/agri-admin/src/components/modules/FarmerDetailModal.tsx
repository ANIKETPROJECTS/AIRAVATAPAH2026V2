import { useState } from "react";
import { X, Sparkles, FileText, User, MapPin, Landmark, Shield, ChevronDown, ChevronUp, Edit2, Save, XCircle } from "lucide-react";
import { FarmerRecord, updateApprovedFarmer, DocRecord } from "@/data/farmerStore";

type AnyFarmerFull = {
  id: string;
  name: string;
  village: string;
  district: string;
  land: number;
  crop: string;
  aadhaar: string;
  status: string;
  source?: string;
  fatherName?: string;
  dob?: string;
  gender?: string;
  category?: string;
  religion?: string;
  mobile?: string;
  altMobile?: string;
  email?: string;
  diffAbled?: boolean;
  disabilityType?: string;
  surveyNumber?: string;
  bankAccount?: string;
  landParcels?: FarmerRecord["landParcels"];
  bankName?: string;
  branchName?: string;
  ifsc?: string;
  accountNo?: string;
  accountType?: string;
  aadhaarLinked?: string;
  npciStatus?: string;
  docs?: DocRecord[];
  aiRiskScore?: number;
};

interface Props {
  farmer: AnyFarmerFull;
  onClose: () => void;
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value || "—"}</span>
    </div>
  );
}

function Section({ title, icon, children, defaultOpen = true }: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 bg-muted/30 hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-2 text-sm font-heading font-semibold">
          {icon}
          {title}
        </div>
        {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </button>
      {open && <div className="p-4">{children}</div>}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const cls = status === "Active" ? "bg-success/10 text-success" :
    status === "Inactive" ? "bg-muted text-muted-foreground" :
    "bg-warning/20 text-warning";
  return <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${cls}`}>{status}</span>;
}

export default function FarmerDetailModal({ farmer, onClose }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(farmer.name);
  const [editMobile, setEditMobile] = useState(farmer.mobile || "");
  const [editEmail, setEditEmail] = useState(farmer.email || "");
  const [editStatus, setEditStatus] = useState(farmer.status);
  const [editCrop, setEditCrop] = useState(farmer.crop);

  const isStoreFarmer = farmer.source === "ocr" || farmer.source === "manual";

  const handleSave = () => {
    if (isStoreFarmer) {
      updateApprovedFarmer(farmer.id, {
        name: editName,
        mobile: editMobile,
        email: editEmail,
        status: editStatus as "Active" | "Inactive" | "Pending",
        crop: editCrop,
      });
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditName(farmer.name);
    setEditMobile(farmer.mobile || "");
    setEditEmail(farmer.email || "");
    setEditStatus(farmer.status);
    setEditCrop(farmer.crop);
    setIsEditing(false);
  };

  const calcAge = (dob?: string) => {
    if (!dob) return null;
    const birth = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    if (today.getMonth() < birth.getMonth() || (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())) age--;
    return age;
  };

  const inputCls = "w-full px-3 py-1.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary/50";

  return (
    <div className="fixed inset-0 bg-foreground/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-card border border-border rounded-xl w-full max-w-2xl max-h-[92vh] flex flex-col animate-fade-in"
        style={{ opacity: 0 }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-border flex-shrink-0">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              {isEditing ? (
                <input value={editName} onChange={e => setEditName(e.target.value)} className={`${inputCls} max-w-xs font-heading text-lg`} />
              ) : (
                <h2 className="font-heading text-xl">{farmer.name}</h2>
              )}
              {farmer.source === "ocr" && (
                <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-medium flex-shrink-0">
                  <Sparkles className="h-3 w-3" />OCR
                </span>
              )}
              {farmer.source === "manual" && (
                <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium flex-shrink-0">
                  <User className="h-3 w-3" />Manual
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">{farmer.id} · {farmer.village}, {farmer.district}</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 ml-4">
            {isStoreFarmer && !isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
              >
                <Edit2 className="h-3.5 w-3.5" /> Edit
              </button>
            )}
            {isEditing && (
              <>
                <button onClick={handleSave} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-secondary text-secondary-foreground hover:opacity-90">
                  <Save className="h-3.5 w-3.5" /> Save
                </button>
                <button onClick={handleCancelEdit} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-muted hover:bg-muted/80">
                  <XCircle className="h-3.5 w-3.5" /> Cancel
                </button>
              </>
            )}
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 p-6 space-y-4">

          {/* Quick stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-muted/30 rounded-lg p-3 text-center">
              <div className="text-xs text-muted-foreground mb-0.5">Land</div>
              <div className="font-semibold text-sm">{farmer.land} ac</div>
            </div>
            <div className="bg-muted/30 rounded-lg p-3 text-center">
              <div className="text-xs text-muted-foreground mb-0.5">Crop</div>
              {isEditing ? (
                <input value={editCrop} onChange={e => setEditCrop(e.target.value)} className="w-full text-xs px-1 py-0.5 border border-border rounded text-center" />
              ) : (
                <div className="font-semibold text-sm">{farmer.crop}</div>
              )}
            </div>
            <div className="bg-muted/30 rounded-lg p-3 text-center">
              <div className="text-xs text-muted-foreground mb-0.5">Status</div>
              {isEditing ? (
                <select value={editStatus} onChange={e => setEditStatus(e.target.value)} className="w-full text-xs px-1 py-0.5 border border-border rounded">
                  {["Active", "Inactive", "Pending"].map(s => <option key={s}>{s}</option>)}
                </select>
              ) : (
                <StatusBadge status={farmer.status} />
              )}
            </div>
            <div className="bg-muted/30 rounded-lg p-3 text-center">
              <div className="text-xs text-muted-foreground mb-0.5">AI Risk</div>
              <div className="font-semibold text-sm text-success">{farmer.aiRiskScore != null ? `${farmer.aiRiskScore}/100` : "—"}</div>
            </div>
          </div>

          {/* Personal Information */}
          <Section title="Personal Information" icon={<User className="h-4 w-4 text-secondary" />}>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <InfoRow label="Full Name" value={farmer.name} />
              <InfoRow label="Father / Husband" value={farmer.fatherName} />
              <div className="flex flex-col gap-0.5">
                <span className="text-xs text-muted-foreground">Date of Birth</span>
                <span className="text-sm font-medium">
                  {farmer.dob ? `${new Date(farmer.dob).toLocaleDateString("en-IN")} (Age ${calcAge(farmer.dob)})` : "—"}
                </span>
              </div>
              <InfoRow label="Gender" value={farmer.gender} />
              <InfoRow label="Category" value={farmer.category} />
              <InfoRow label="Religion" value={farmer.religion} />
              <div className="flex flex-col gap-0.5">
                <span className="text-xs text-muted-foreground">Aadhaar Number</span>
                <span className="text-sm font-medium font-mono">{farmer.aadhaar}</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-xs text-muted-foreground">Mobile</span>
                {isEditing ? (
                  <input value={editMobile} onChange={e => setEditMobile(e.target.value)} className={inputCls} />
                ) : (
                  <span className="text-sm font-medium">{farmer.mobile || "—"}</span>
                )}
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-xs text-muted-foreground">Email</span>
                {isEditing ? (
                  <input value={editEmail} onChange={e => setEditEmail(e.target.value)} className={inputCls} />
                ) : (
                  <span className="text-sm font-medium">{farmer.email || "—"}</span>
                )}
              </div>
              {farmer.altMobile && <InfoRow label="Alternate Mobile" value={farmer.altMobile} />}
              {farmer.diffAbled && (
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-muted-foreground">Differently Abled</span>
                  <span className="text-sm font-medium">Yes {farmer.disabilityType ? `(${farmer.disabilityType})` : ""}</span>
                </div>
              )}
            </div>
          </Section>

          {/* Land & Farm Details */}
          <Section title="Land & Farm Details" icon={<MapPin className="h-4 w-4 text-secondary" />}>
            {farmer.landParcels && farmer.landParcels.length > 0 ? (
              <div className="space-y-4">
                {farmer.landParcels.map((lp, i) => (
                  <div key={i} className={`${farmer.landParcels!.length > 1 ? "border border-border rounded-lg p-3" : ""}`}>
                    {farmer.landParcels!.length > 1 && (
                      <div className="text-xs font-semibold text-muted-foreground mb-3">Parcel {i + 1}</div>
                    )}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      <InfoRow label="State" value={lp.state} />
                      <InfoRow label="District" value={lp.district} />
                      <InfoRow label="Taluka" value={lp.taluka} />
                      <InfoRow label="Village" value={lp.village} />
                      <InfoRow label="Survey / Gat No." value={lp.surveyNo} />
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs text-muted-foreground">Total Area</span>
                        <span className="text-sm font-medium">{lp.totalArea} {lp.areaUnit || "Acres"}</span>
                      </div>
                      {lp.irrigatedArea && (
                        <InfoRow label="Irrigated Area" value={`${lp.irrigatedArea} ${lp.areaUnit || "Acres"}`} />
                      )}
                      <InfoRow label="Ownership" value={lp.ownershipType} />
                      <InfoRow label="Soil Type" value={lp.soilType} />
                      <InfoRow label="Primary Crop" value={lp.primaryCrop} />
                      {lp.secondaryCrop && <InfoRow label="Secondary Crop" value={lp.secondaryCrop} />}
                      <InfoRow label="Farming Type" value={lp.farmingType} />
                    </div>
                    {lp.irrigationSources && lp.irrigationSources.length > 0 && (
                      <div className="mt-3">
                        <div className="text-xs text-muted-foreground mb-1.5">Irrigation Sources</div>
                        <div className="flex flex-wrap gap-1.5">
                          {lp.irrigationSources.map(s => (
                            <span key={s} className="text-xs px-2 py-0.5 rounded-full bg-secondary/10 text-secondary font-medium">{s}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <InfoRow label="District" value={farmer.district} />
                <InfoRow label="Village" value={farmer.village} />
                <InfoRow label="Survey Number" value={farmer.surveyNumber} />
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-muted-foreground">Land Holdings</span>
                  <span className="text-sm font-medium">{farmer.land} Acres</span>
                </div>
                <InfoRow label="Primary Crop" value={farmer.crop} />
              </div>
            )}
          </Section>

          {/* Bank Details */}
          <Section title="Bank Details" icon={<Landmark className="h-4 w-4 text-secondary" />}>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <InfoRow label="Bank Name" value={farmer.bankName} />
              <InfoRow label="Branch" value={farmer.branchName} />
              <InfoRow label="IFSC Code" value={farmer.ifsc} />
              <div className="flex flex-col gap-0.5">
                <span className="text-xs text-muted-foreground">Account Number</span>
                <span className="text-sm font-medium font-mono">
                  {farmer.accountNo ? `****${farmer.accountNo.slice(-4)}` : (farmer.bankAccount || "—")}
                </span>
              </div>
              <InfoRow label="Account Type" value={farmer.accountType} />
              <InfoRow label="NPCI Mapper" value={farmer.npciStatus} />
              <InfoRow label="Aadhaar Linked" value={farmer.aadhaarLinked} />
            </div>
          </Section>

          {/* Documents */}
          <Section title="Documents" icon={<FileText className="h-4 w-4 text-secondary" />}>
            {farmer.docs && farmer.docs.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {farmer.docs.filter(d => d.status === "uploaded").map((doc, i) => (
                  <div key={i} className="flex items-center gap-2 bg-muted/30 rounded-lg p-2.5">
                    <div className="w-8 h-8 bg-primary/10 rounded flex items-center justify-center text-sm flex-shrink-0">📄</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{doc.name}</div>
                      <div className="text-xs text-muted-foreground truncate">{doc.fileName} · {doc.size}</div>
                    </div>
                    <span className="text-xs text-success font-medium flex-shrink-0">✅</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {["Aadhaar Card", "Land Record", "Bank Passbook", "Photo ID"].map(d => (
                  <div key={d} className="flex items-center gap-2 bg-muted/30 rounded-lg p-2.5">
                    <div className="w-8 h-8 bg-primary/10 rounded flex items-center justify-center text-sm flex-shrink-0">📄</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium">{d}</div>
                      <div className="text-xs text-muted-foreground">On file</div>
                    </div>
                    <span className="text-xs text-success font-medium flex-shrink-0">✅</span>
                  </div>
                ))}
              </div>
            )}
          </Section>

          {/* Schemes & AI Risk */}
          <Section title="Schemes & AI Assessment" icon={<Shield className="h-4 w-4 text-secondary" />}>
            <div className="flex flex-col sm:flex-row gap-6">
              <div className="flex-1">
                <div className="text-xs text-muted-foreground mb-2">Scheme Enrollments</div>
                <div className="flex flex-wrap gap-2">
                  <span className="text-xs px-2.5 py-1 rounded-full bg-success/10 text-success">PM-KISAN ✅</span>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-success/10 text-success">PMFBY ✅</span>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-warning/20 text-warning">KCC ⏳</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative w-16 h-16">
                  <svg className="w-16 h-16 -rotate-90" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="14" fill="none" stroke="hsl(140 20% 90%)" strokeWidth="3" />
                    <circle cx="18" cy="18" r="14" fill="none" stroke="hsl(142 60% 40%)" strokeWidth="3"
                      strokeDasharray="88"
                      strokeDashoffset={88 - 88 * ((farmer.aiRiskScore ?? 32) / 100)}
                      strokeLinecap="round" />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-xs font-bold">
                    {farmer.aiRiskScore ?? 32}
                  </span>
                </div>
                <div>
                  <div className="text-sm font-medium">AI Risk Score</div>
                  <div className="text-xs text-success font-medium">
                    {(farmer.aiRiskScore ?? 32) < 40 ? "Low Risk" : (farmer.aiRiskScore ?? 32) < 70 ? "Medium Risk" : "High Risk"}
                  </div>
                </div>
              </div>
            </div>
          </Section>

        </div>
      </div>
    </div>
  );
}
