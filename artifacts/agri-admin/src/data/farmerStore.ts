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
  id: string;
  name: string;
  village: string;
  district: string;
  land: number;
  crop: string;
  aadhaar: string;
  surveyNumber: string;
  bankAccount: string;
  status: "Active" | "Inactive" | "Pending";
  source: "ocr" | "manual";
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

const listeners: Array<() => void> = [];
const approvedFarmers: FarmerRecord[] = [];

export function getApprovedFarmers(): FarmerRecord[] {
  return [...approvedFarmers];
}

export function addApprovedFarmer(farmer: FarmerRecord): void {
  approvedFarmers.push(farmer);
  listeners.forEach((fn) => fn());
}

export function updateApprovedFarmer(id: string, updates: Partial<FarmerRecord>): void {
  const idx = approvedFarmers.findIndex((f) => f.id === id);
  if (idx !== -1) {
    approvedFarmers[idx] = { ...approvedFarmers[idx], ...updates };
    listeners.forEach((fn) => fn());
  }
}

export function subscribeToFarmers(fn: () => void): () => void {
  listeners.push(fn);
  return () => {
    const i = listeners.indexOf(fn);
    if (i !== -1) listeners.splice(i, 1);
  };
}

let counter = 100;
export function nextFarmerId(): string {
  counter += 1;
  return `F-${String(counter).padStart(3, "0")}`;
}
