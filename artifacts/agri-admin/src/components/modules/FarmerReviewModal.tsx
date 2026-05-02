import { useState, useMemo } from "react";
import { X, CheckCircle2, XCircle, ShieldCheck, Loader2, FileStack, Sprout, ClipboardCheck, CreditCard, BookOpen, UserCheck } from "lucide-react";
import {
  type DocTypeId,
  type ExtractionState,
  type LangCode,
  DEFAULT_STATE,
  EMPTY_PROFILE,
  FarmerProfileCard,
  FieldsTable,
  DOC_CARDS,
  DOC_CARD_SHORT,
  type FarmerProfile,
} from "./NewRegistration";
import { apiUpdateFarmer, type FarmerRecord } from "@/data/farmerApi";

type DocStates = Record<DocTypeId, ExtractionState>;

function StatusBadge({ status }: { status: string }) {
  if (status === "Verified") return <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-emerald-100 text-emerald-700">Verified</span>;
  if (status === "Cancelled") return <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-red-100 text-red-700">Cancelled</span>;
  if (status === "Pending") return <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-yellow-100 text-yellow-700">Pending</span>;
  if (status === "Active") return <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-green-100 text-green-700">Active</span>;
  return <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-muted text-muted-foreground">{status}</span>;
}

function DocTabIcon({ id }: { id: DocTypeId }) {
  if (id === "form7") return <FileStack className="h-3.5 w-3.5 flex-shrink-0" />;
  if (id === "form12") return <Sprout className="h-3.5 w-3.5 flex-shrink-0" />;
  if (id === "form8a") return <ClipboardCheck className="h-3.5 w-3.5 flex-shrink-0" />;
  if (id === "aadhar") return <CreditCard className="h-3.5 w-3.5 flex-shrink-0" />;
  return <BookOpen className="h-3.5 w-3.5 flex-shrink-0" />;
}

export default function FarmerReviewModal({
  farmer,
  onClose,
  onUpdated,
}: {
  farmer: FarmerRecord;
  onClose: () => void;
  onUpdated: (f: FarmerRecord) => void;
}) {
  const [lang, setLang] = useState<LangCode>("mr");
  const [customPhoto, setCustomPhoto] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [modalStep, setModalStep] = useState<"review" | "verify">("review");

  const initialProfile: FarmerProfile = useMemo(() => {
    if (farmer.farmerProfile) return farmer.farmerProfile as unknown as FarmerProfile;
    return {
      ...EMPTY_PROFILE,
      name: farmer.name ?? "",
      village: farmer.village ?? "",
      taluka: farmer.taluka ?? "",
      district: farmer.district ?? "",
      aadhaar: farmer.aadhaar ?? "",
      khateNumber: farmer.khateNumber ?? "",
      surveyNumber: farmer.surveyNumber ?? "",
      land: String(farmer.land ?? ""),
      crop: farmer.crop ?? "",
      bankAccount: farmer.bankAccount ?? "",
    };
  }, [farmer]);

  const [profile, setProfile] = useState<FarmerProfile>(initialProfile);

  const handleProfileChange = (field: keyof FarmerProfile, value: string) => {
    setProfile(p => ({ ...p, [field]: value }));
  };

  const docStates: DocStates = useMemo(() => {
    const states = Object.fromEntries(
      DOC_CARDS.map(c => [c.id, { ...DEFAULT_STATE }])
    ) as DocStates;
    if (farmer.extractionData) {
      for (const [docId, saved] of Object.entries(farmer.extractionData)) {
        states[docId as DocTypeId] = {
          status: "complete",
          filename: saved.filename,
          requestId: null,
          sections: saved.sections,
          images: null,
          rawTables: saved.rawTables,
          textBlocks: saved.textBlocks,
          aadharPhoto: saved.aadharPhoto ?? null,
          error: null,
        };
      }
    }
    return states;
  }, [farmer]);

  const completedCards = DOC_CARDS.filter(c => docStates[c.id].status === "complete");
  const [activeTab, setActiveTab] = useState<DocTypeId | "profile">(
    completedCards.length > 0 ? completedCards[0].id : "profile"
  );

  const handleUpdateStatus = async (status: FarmerRecord["status"]) => {
    setSaving(status);
    try {
      const updated = await apiUpdateFarmer(farmer.farmerId, {
        status,
        farmerProfile: profile as unknown as Record<string, string>,
        name: profile.name || farmer.name,
        village: profile.village || farmer.village,
        taluka: profile.taluka || farmer.taluka,
        district: profile.district || farmer.district,
        khateNumber: profile.khateNumber || farmer.khateNumber,
      });
      onUpdated(updated);
      onClose();
    } catch {
      setSaving(null);
    }
  };

  const isPending = farmer.status === "Pending";
  const isVerified = farmer.status === "Verified";
  const isCancelled = farmer.status === "Cancelled";
  const isReadOnly = isVerified || isCancelled;
  const hasExtractionData = completedCards.length > 0;

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <UserCheck className="h-5 w-5 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-base">{farmer.name}</h2>
              <StatusBadge status={farmer.status} />
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {farmer.farmerId} · Aadhaar: {farmer.aadhaar}
              {farmer.khateNumber && farmer.khateNumber !== "—" ? ` · Khate: ${farmer.khateNumber}` : ""}
            </p>
          </div>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted/60 transition-colors">
          <X className="h-5 w-5 text-muted-foreground" />
        </button>
      </div>

      {/* Tab bar */}
      <div className="flex items-center gap-1 px-6 py-2 border-b border-border bg-muted/30 flex-shrink-0 overflow-x-auto">
        {completedCards.map(card => (
          <button
            key={card.id}
            onClick={() => setActiveTab(card.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
              activeTab === card.id
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <DocTabIcon id={card.id} />
            {DOC_CARD_SHORT[card.id]?.["en"] ?? card.id}
          </button>
        ))}
        <button
          onClick={() => setActiveTab("profile")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
            activeTab === "profile"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          <UserCheck className="h-3.5 w-3.5 flex-shrink-0" />
          Farmer Profile
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {!hasExtractionData && activeTab !== "profile" && (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
            <BookOpen className="h-10 w-10 opacity-30" />
            <p className="text-sm">No extraction data saved for this farmer.</p>
            <p className="text-xs opacity-70">Documents were not uploaded during registration.</p>
          </div>
        )}

        {activeTab !== "profile" && docStates[activeTab as DocTypeId]?.status === "complete" && (
          <FieldsTable
            sections={docStates[activeTab as DocTypeId].sections}
            rawTables={docStates[activeTab as DocTypeId].rawTables}
            textBlocks={docStates[activeTab as DocTypeId].textBlocks}
            docId={activeTab as DocTypeId}
            lang={lang}
          />
        )}

        {activeTab === "profile" && (
          <FarmerProfileCard
            docStates={docStates}
            profile={profile}
            onChange={handleProfileChange}
            onApprove={() => {}}
            approved={true}
            onBack={() => setActiveTab(completedCards[0]?.id ?? "profile")}
            lang={lang}
            onLangChange={setLang}
            customPhoto={customPhoto}
            onCustomPhotoChange={setCustomPhoto}
          />
        )}
      </div>

      {/* Footer actions */}
      <div className="flex-shrink-0 border-t border-border bg-card px-6 py-4">
        {isPending && modalStep === "review" && (
          <div className="flex items-center gap-3 justify-between">
            <p className="text-sm text-muted-foreground">Review all documents and farmer profile before deciding.</p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleUpdateStatus("Cancelled")}
                disabled={!!saving}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-red-200 bg-red-50 text-red-700 text-sm font-medium hover:bg-red-100 transition-colors disabled:opacity-50"
              >
                {saving === "Cancelled" ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                Reject Farmer
              </button>
              <button
                onClick={() => setModalStep("verify")}
                disabled={!!saving}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-colors disabled:opacity-50 shadow-sm"
              >
                <CheckCircle2 className="h-4 w-4" />
                Accept Farmer
              </button>
            </div>
          </div>
        )}

        {isPending && modalStep === "verify" && (
          <div className="flex items-center gap-3 justify-between">
            <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
              <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
              Farmer accepted. Verify data above and approve.
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleUpdateStatus("Cancelled")}
                disabled={!!saving}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-red-200 bg-red-50 text-red-700 text-sm font-medium hover:bg-red-100 transition-colors disabled:opacity-50"
              >
                {saving === "Cancelled" ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                Cancel
              </button>
              <button
                onClick={() => handleUpdateStatus("Verified")}
                disabled={!!saving}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold transition-colors disabled:opacity-50 shadow-sm"
              >
                {saving === "Verified" ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                Approve Verification
              </button>
            </div>
          </div>
        )}

        {isReadOnly && (
          <div className="flex items-center justify-between">
            <div className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg border ${isVerified ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-red-50 border-red-200 text-red-700"}`}>
              {isVerified ? <ShieldCheck className="h-4 w-4 flex-shrink-0" /> : <XCircle className="h-4 w-4 flex-shrink-0" />}
              {isVerified ? "This farmer has been verified and approved." : "This farmer registration was cancelled."}
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-lg border border-border bg-card text-sm font-medium hover:bg-muted/40 transition-colors"
            >
              Close
            </button>
          </div>
        )}

        {!isPending && !isReadOnly && (
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-lg border border-border bg-card text-sm font-medium hover:bg-muted/40 transition-colors"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
