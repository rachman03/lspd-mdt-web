export enum OfficerRank {
  CADET = 'Cadet',
  OFFICER = 'Police Officer',
  SERGEANT = 'Sergeant',
  LIEUTENANT = 'Lieutenant',
  CAPTAIN = 'Captain',
  COMMANDER = 'Commander',
  DEPUTY_CHIEF = 'Deputy Chief of Police',
  CHIEF = 'Chief of Police',
  GOVERNMENT = 'Government'
}

export enum OfficerDivision {
  PATROL_TRAFFIC = 'Patrol Traffic',
  SWAT = 'SWAT',
  CIB = 'Criminal Investigation Bureau (CIB)',
  INTERNAL_AFFAIRS = 'Internal Affairs (IA)',
  TRD = 'Training & Recruitment (TRD)',
  PUBLIC_ADMIN = 'Public Administration'
}

export interface Officer {
  badgeNumber: string;
  name: string;
  rank: OfficerRank;
  rankLevel: number; // 1 to 6
  onDuty: boolean;
  avatar?: string;
  pin?: string;
  division?: OfficerDivision;
}

export interface LicenseStatus {
  drivers: 'Active' | 'Suspended' | 'None';
  weapons: 'Active' | 'Suspended' | 'None';
  ktp: 'Active' | 'Suspended' | 'None';
}

export interface Citizen {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  dob: string;
  gender: 'Laki-laki' | 'Perempuan';
  licenseStatus: LicenseStatus;
  avatar: string;
  isWanted: boolean;
  wantedReason?: string;
  convictions: string[]; // List of historical report titles or penal codes
  notes: string;
}

export interface Vehicle {
  id: string;
  plate: string;
  model: string;
  ownerName: string;
  ownerId: string;
  color: string;
  isStolen: boolean;
  notes: string;
  imageUrl?: string;
}

export interface Charge {
  code: string;
  title: string;
  category: string;
  fine: number; // in $
  jailTime: number; // in months/minutes
  description: string;
}

export interface EvidenceImage {
  id: string;
  url: string;
  caption: string;
  type: 'mugshot' | 'evidence' | 'other';
}

export interface CriminalReport {
  id: string;
  title: string;
  date: string;
  suspectId: string;
  suspectName: string;
  officerName: string;
  officerBadge: string;
  charges: Charge[];
  totalFine: number;
  totalJailTime: number; // in months
  description: string;
  isProcessed: boolean;
  assistingOfficers?: string;
  suspects?: { id: string; name: string }[];
  imageUrl?: string;
  evidenceImages?: EvidenceImage[];
  status?: 'Penyelidikan' | 'DPO' | 'Selesai';
  type?: 'LSPD' | 'Citizen';
  reporterName?: string;
  location?: string;
}

export interface Detainee {
  id: string;
  citizenName: string;
  citizenId: string;
  jailTime: number; // total sentence in months
  remainingTime: number; // remaining sentence for the timer
  fine: number;
  cellNumber: string;
  status: 'Dalam Sel' | 'Interogasi' | 'Isolasi' | 'Bebas';
  dateArrested: string;
  arrestingOfficer: string;
}

export interface DispatchCall {
  id: string;
  title: string;
  location: string;
  description: string;
  time: string;
  priority: 'Rendah' | 'Sedang' | 'Tinggi' | 'Kritis';
  status: 'Aktif' | 'Merespon' | 'Selesai';
  respondingUnits: string[]; // Badge numbers of officers responding
}

export interface AttendanceRecord {
  id: string;
  badgeNumber: string;
  name: string;
  rank: OfficerRank;
  date: string; // Format: YYYY-MM-DD
  dutyOnTime: string; // Format: HH:MM:SS
  dutyOffTime?: string; // Format: HH:MM:SS
  status: 'DUTY' | 'OFF-DUTY';
}

export interface DigitalEvidence {
  id: string;
  caseId: string;
  caseTitle: string;
  title: string;
  description: string;
  tag: 'Fingerprint' | 'Weapon' | 'Narcotics' | 'Document' | 'Money' | 'Other';
  imageUrl?: string;
  collectedBy: string;
  collectedByBadge: string;
  dateCollected: string;
  serialNumber?: string;
  status: 'Dalam Gudang' | 'Uji Lab' | 'Dipakai Sidang' | 'Dimusnahkan';
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  officerName: string;
  officerBadge: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT';
  module: 'CITIZENS' | 'VEHICLES' | 'REPORTS' | 'DETAINEES' | 'EVIDENCE' | 'OFFICERS' | 'WARRANTS' | 'SYSTEM';
  description: string;
  details?: string;
}




