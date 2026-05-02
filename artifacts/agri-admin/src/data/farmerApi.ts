export interface LandParcelRecord {
  state?: string;
  district: string;
  taluka?: string;
  village: string;
  surveyNo: string;
  totalArea: string;
  areaUnit?: string;
  irrigatedArea?: string;
  ownershipType?: string;
  soilType?: string;
  irrigationSources?: string[];
  primaryCrop: string;
  secondaryCrop?: string;
  farmingType?: string;
}

export interface DocRecord {
  name: string;
  fileName: string;
  size: string;
  status: "uploaded" | "failed" | "none";
}

export interface FarmerRecord {
  farmerId: string;
  name: string;
  village: string;
  district: string;
  land: number;
  crop: string;
  aadhaar: string;
  surveyNumber: string;
  bankAccount: string;
  status: "Active" | "Inactive" | "Pending";
  source: "ocr" | "manual" | "seed";
  addedAt: string;
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
  landParcels?: LandParcelRecord[];
  bankName?: string;
  branchName?: string;
  ifsc?: string;
  accountNo?: string;
  accountType?: string;
  aadhaarLinked?: string;
  npciStatus?: string;
  docs?: DocRecord[];
  aiRiskScore?: number;
}

const API = "/api";

export async function apiFetchFarmers(): Promise<FarmerRecord[]> {
  const res = await fetch(`${API}/farmers`);
  if (!res.ok) throw new Error("Failed to fetch farmers");
  return res.json();
}

export async function apiCreateFarmer(data: Omit<FarmerRecord, "farmerId" | "addedAt">): Promise<FarmerRecord> {
  const res = await fetch(`${API}/farmers`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create farmer");
  return res.json();
}

export async function apiUpdateFarmer(id: string, data: Partial<FarmerRecord>): Promise<FarmerRecord> {
  const res = await fetch(`${API}/farmers/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update farmer");
  return res.json();
}

export async function apiDeleteFarmer(id: string): Promise<void> {
  const res = await fetch(`${API}/farmers/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete farmer");
}

export async function apiDeleteAllFarmers(): Promise<{ deleted: number }> {
  const res = await fetch(`${API}/farmers`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete all farmers");
  return res.json();
}

export function notifyFarmerChange() {
  window.dispatchEvent(new CustomEvent("farmer-registry-changed"));
}
