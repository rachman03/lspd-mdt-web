import { supabase, isSupabaseConfigured } from './supabaseClient';
import { Citizen, Vehicle, CriminalReport, Detainee, DispatchCall, Charge, DigitalEvidence, Officer, AttendanceRecord, ActivityLog } from '../types';

// Check if Supabase keys are configured
export const isSupabaseEnabled = (): boolean => {
  return isSupabaseConfigured();
};

// ==========================================
// MAPPINGS: DATABASE <--> FRONTEND OBJECTS
// ==========================================

const mapActivityLogFromDb = (row: any): ActivityLog => ({
  id: row.id,
  timestamp: row.timestamp || row.created_at || new Date().toISOString(),
  officerName: row.officer_name,
  officerBadge: row.officer_badge,
  action: row.action,
  module: row.module,
  description: row.description,
  details: row.details || '',
});

const mapActivityLogToDb = (log: ActivityLog) => ({
  id: log.id,
  timestamp: log.timestamp,
  officer_name: log.officerName,
  officer_badge: log.officerBadge,
  action: log.action,
  module: log.module,
  description: log.description,
  details: log.details || null,
});



const mapCitizenFromDb = (row: any): Citizen => ({
  id: row.id,
  firstName: row.first_name,
  lastName: row.last_name,
  phone: row.phone || '',
  dob: row.dob,
  gender: row.gender,
  licenseStatus: {
    drivers: row.license_drivers || 'None',
    weapons: row.license_weapons || 'None',
    ktp: row.license_ktp || 'Active',
  },
  avatar: row.avatar || '',
  isWanted: row.is_wanted || false,
  wantedReason: row.wanted_reason,
  convictions: row.convictions || [],
  notes: row.notes || '',
});

const mapCitizenToDb = (c: Citizen) => ({
  id: c.id,
  first_name: c.firstName,
  last_name: c.lastName,
  phone: c.phone,
  dob: c.dob,
  gender: c.gender,
  license_drivers: c.licenseStatus?.drivers || 'None',
  license_weapons: c.licenseStatus?.weapons || 'None',
  license_ktp: c.licenseStatus?.ktp || 'Active',
  avatar: c.avatar,
  is_wanted: c.isWanted,
  wanted_reason: c.wantedReason,
  convictions: c.convictions || [],
  notes: c.notes,
});

const mapVehicleFromDb = (row: any): Vehicle => ({
  id: row.id,
  plate: row.plate,
  model: row.model,
  ownerName: row.owner_name,
  ownerId: row.owner_id || '',
  color: row.color,
  isStolen: row.is_stolen || false,
  notes: row.notes || '',
  imageUrl: row.image_url,
});

const mapVehicleToDb = (v: Vehicle) => ({
  id: v.id,
  plate: v.plate,
  model: v.model,
  owner_name: v.ownerName,
  owner_id: v.ownerId || null,
  color: v.color,
  is_stolen: v.isStolen,
  notes: v.notes,
  image_url: v.imageUrl,
});

export const mapReportFromDb = (row: any): CriminalReport => ({
  id: row.id,
  title: row.title,
  date: row.date || new Date().toISOString(),
  suspectId: row.suspect_id || '',
  suspectName: row.suspect_name || '',
  officerName: row.officer_name || '',
  officerBadge: row.officer_badge || '',
  totalFine: row.total_fine || 0,
  totalJailTime: row.total_jail_time || 0,
  description: row.description || '',
  isProcessed: row.is_processed || false,
  assistingOfficers: row.assisting_officers,
  imageUrl: row.image_url,
  status: row.status || 'Selesai',
  type: row.type || 'LSPD',
  reporterName: row.reporter_name,
  charges: Array.isArray(row.charges_json) ? row.charges_json : [],
});

const mapReportToDb = (r: CriminalReport) => ({
  id: r.id,
  title: r.title,
  date: r.date,
  suspect_id: r.suspectId || null,
  suspect_name: r.suspectName,
  officer_name: r.officerName,
  officer_badge: r.officerBadge || null,
  total_fine: r.totalFine,
  total_jail_time: r.totalJailTime,
  description: r.description,
  is_processed: r.isProcessed,
  assisting_officers: r.assistingOfficers,
  image_url: r.imageUrl,
  status: r.status || 'Selesai',
  type: r.type || 'LSPD',
  reporter_name: r.reporterName,
  charges_json: r.charges || [],
});

const mapDetaineeFromDb = (row: any): Detainee => ({
  id: row.id,
  citizenName: row.citizen_name,
  citizenId: row.citizen_id,
  jailTime: row.jail_time,
  remainingTime: row.remaining_time,
  fine: row.fine || 0,
  cellNumber: row.cell_number,
  status: row.status || 'Dalam Sel',
  dateArrested: row.date_arrested || new Date().toISOString(),
  arrestingOfficer: row.arresting_officer,
});

const mapDetaineeToDb = (d: Detainee) => ({
  id: d.id,
  citizen_name: d.citizenName,
  citizen_id: d.citizenId,
  jail_time: d.jailTime,
  remaining_time: d.remainingTime,
  fine: d.fine,
  cell_number: d.cellNumber,
  status: d.status,
  date_arrested: d.dateArrested,
  arresting_officer: d.arrestingOfficer,
});

const mapDispatchFromDb = (row: any): DispatchCall => ({
  id: row.id,
  title: row.title,
  location: row.location,
  description: row.description || '',
  time: row.time,
  priority: row.priority || 'Sedang',
  status: row.status || 'Aktif',
  respondingUnits: row.responding_units || [],
});

const mapDispatchToDb = (d: DispatchCall) => ({
  id: d.id,
  title: d.title,
  location: d.location,
  description: d.description,
  time: d.time,
  priority: d.priority,
  status: d.status,
  responding_units: d.respondingUnits || [],
});

const mapPenalCodeFromDb = (row: any): Charge => ({
  code: row.code,
  title: row.title,
  category: row.category,
  fine: row.fine || 0,
  jailTime: row.jail_time || 0,
  description: row.description || '',
});

const mapPenalCodeToDb = (c: Charge) => ({
  code: c.code,
  title: c.title,
  category: c.category,
  fine: c.fine,
  jail_time: c.jailTime,
  description: c.description,
});

const mapEvidenceFromDb = (row: any): DigitalEvidence => ({
  id: row.id,
  caseId: row.case_id || '',
  caseTitle: row.case_title || '',
  title: row.title,
  description: row.description || '',
  tag: row.tag || 'Other',
  imageUrl: row.image_url,
  collectedBy: row.collected_by,
  collectedByBadge: row.collected_by_badge,
  dateCollected: row.date_collected,
  serialNumber: row.serial_number,
  status: row.status || 'Dalam Gudang',
});

const mapEvidenceToDb = (e: DigitalEvidence) => ({
  id: e.id,
  case_id: e.caseId || null,
  case_title: e.caseTitle,
  title: e.title,
  description: e.description,
  tag: e.tag,
  image_url: e.imageUrl,
  collected_by: e.collectedBy,
  collected_by_badge: e.collectedByBadge,
  date_collected: e.dateCollected,
  serial_number: e.serialNumber,
  status: e.status,
});

const mapOfficerFromDb = (row: any): Officer & { pin: string } => ({
  badgeNumber: row.badge_number,
  name: row.name,
  rank: row.rank,
  rankLevel: row.rank_level || 1,
  onDuty: row.on_duty || false,
  avatar: row.avatar || '',
  pin: row.pin || '0000',
  division: row.division,
});

const mapOfficerToDb = (o: Officer & { pin: string }) => ({
  badge_number: o.badgeNumber,
  name: o.name,
  rank: o.rank,
  rank_level: o.rankLevel,
  on_duty: o.onDuty,
  avatar: o.avatar,
  pin: o.pin,
  division: o.division,
});

const mapAttendanceFromDb = (row: any): AttendanceRecord => ({
  id: row.id,
  badgeNumber: row.badge_number,
  name: row.name,
  rank: row.rank,
  date: row.date,
  dutyOnTime: row.duty_on_time,
  dutyOffTime: row.duty_off_time,
  status: row.status || 'OFF-DUTY',
});

const mapAttendanceToDb = (r: AttendanceRecord) => ({
  id: r.id,
  badge_number: r.badgeNumber,
  name: r.name,
  rank: r.rank,
  date: r.date,
  duty_on_time: r.dutyOnTime,
  duty_off_time: r.dutyOffTime || null,
  status: r.status,
});

// ==========================================
// SERVICE OPERATIONS (API ACTIONS)
// ==========================================

export const supabaseService = {
  // CITIZENS
  async fetchCitizens(): Promise<Citizen[] | null> {
    if (!isSupabaseEnabled()) return null;
    try {
      const { data, error } = await supabase.from('citizens').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map(mapCitizenFromDb);
    } catch (e) {
      console.error('Supabase fetchCitizens error:', e);
      return null;
    }
  },
  async upsertCitizen(citizen: Citizen): Promise<boolean> {
    if (!isSupabaseEnabled()) return false;
    try {
      const payload = mapCitizenToDb(citizen);
      const { error } = await supabase.from('citizens').upsert(payload);
      if (error) throw error;
      return true;
    } catch (e) {
      console.error('Supabase upsertCitizen error:', e);
      return false;
    }
  },
  async deleteCitizen(id: string): Promise<boolean> {
    if (!isSupabaseEnabled()) return false;
    try {
      const { error } = await supabase.from('citizens').delete().eq('id', id);
      if (error) throw error;
      return true;
    } catch (e) {
      console.error('Supabase deleteCitizen error:', e);
      return false;
    }
  },

  // VEHICLES
  async fetchVehicles(): Promise<Vehicle[] | null> {
    if (!isSupabaseEnabled()) return null;
    try {
      const { data, error } = await supabase.from('vehicles').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map(mapVehicleFromDb);
    } catch (e) {
      console.error('Supabase fetchVehicles error:', e);
      return null;
    }
  },
  async upsertVehicle(vehicle: Vehicle): Promise<boolean> {
    if (!isSupabaseEnabled()) return false;
    try {
      const payload = mapVehicleToDb(vehicle);
      const { error } = await supabase.from('vehicles').upsert(payload);
      if (error) throw error;
      return true;
    } catch (e) {
      console.error('Supabase upsertVehicle error:', e);
      return false;
    }
  },
  async deleteVehicle(id: string): Promise<boolean> {
    if (!isSupabaseEnabled()) return false;
    try {
      const { error } = await supabase.from('vehicles').delete().eq('id', id);
      if (error) throw error;
      return true;
    } catch (e) {
      console.error('Supabase deleteVehicle error:', e);
      return false;
    }
  },

  // CRIMINAL REPORTS
  async fetchReports(): Promise<CriminalReport[] | null> {
    if (!isSupabaseEnabled()) return null;
    try {
      const { data, error } = await supabase.from('criminal_reports').select('*').order('date', { ascending: false });
      if (error) throw error;
      return (data || []).map(mapReportFromDb);
    } catch (e) {
      console.error('Supabase fetchReports error:', e);
      return null;
    }
  },
  async upsertReport(report: CriminalReport): Promise<boolean> {
    if (!isSupabaseEnabled()) return false;
    try {
      const payload = mapReportToDb(report);
      const { error } = await supabase.from('criminal_reports').upsert(payload);
      if (error) throw error;
      return true;
    } catch (e) {
      console.error('Supabase upsertReport error:', e);
      return false;
    }
  },
  async deleteReport(id: string): Promise<boolean> {
    if (!isSupabaseEnabled()) return false;
    try {
      const { error } = await supabase.from('criminal_reports').delete().eq('id', id);
      if (error) throw error;
      return true;
    } catch (e) {
      console.error('Supabase deleteReport error:', e);
      return false;
    }
  },

  // DETAINEES
  async fetchDetainees(): Promise<Detainee[] | null> {
    if (!isSupabaseEnabled()) return null;
    try {
      const { data, error } = await supabase.from('detainees').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map(mapDetaineeFromDb);
    } catch (e) {
      console.error('Supabase fetchDetainees error:', e);
      return null;
    }
  },
  async upsertDetainee(detainee: Detainee): Promise<boolean> {
    if (!isSupabaseEnabled()) return false;
    try {
      const payload = mapDetaineeToDb(detainee);
      const { error } = await supabase.from('detainees').upsert(payload);
      if (error) throw error;
      return true;
    } catch (e) {
      console.error('Supabase upsertDetainee error:', e);
      return false;
    }
  },
  async deleteDetainee(id: string): Promise<boolean> {
    if (!isSupabaseEnabled()) return false;
    try {
      const { error } = await supabase.from('detainees').delete().eq('id', id);
      if (error) throw error;
      return true;
    } catch (e) {
      console.error('Supabase deleteDetainee error:', e);
      return false;
    }
  },

  // DISPATCH CALLS
  async fetchDispatchCalls(): Promise<DispatchCall[] | null> {
    if (!isSupabaseEnabled()) return null;
    try {
      const { data, error } = await supabase.from('dispatch_calls').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map(mapDispatchFromDb);
    } catch (e) {
      console.error('Supabase fetchDispatchCalls error:', e);
      return null;
    }
  },
  async upsertDispatchCall(call: DispatchCall): Promise<boolean> {
    if (!isSupabaseEnabled()) return false;
    try {
      const payload = mapDispatchToDb(call);
      const { error } = await supabase.from('dispatch_calls').upsert(payload);
      if (error) throw error;
      return true;
    } catch (e) {
      console.error('Supabase upsertDispatchCall error:', e);
      return false;
    }
  },

  // PENAL CODES
  async fetchPenalCodes(): Promise<Charge[] | null> {
    if (!isSupabaseEnabled()) return null;
    try {
      const { data, error } = await supabase.from('penal_codes').select('*').order('code', { ascending: true });
      if (error) throw error;
      return (data || []).map(mapPenalCodeFromDb);
    } catch (e) {
      console.error('Supabase fetchPenalCodes error:', e);
      return null;
    }
  },
  async upsertPenalCode(charge: Charge): Promise<boolean> {
    if (!isSupabaseEnabled()) return false;
    try {
      const payload = mapPenalCodeToDb(charge);
      const { error } = await supabase.from('penal_codes').upsert(payload);
      if (error) throw error;
      return true;
    } catch (e) {
      console.error('Supabase upsertPenalCode error:', e);
      return false;
    }
  },

  // DIGITAL EVIDENCES
  async fetchEvidences(): Promise<DigitalEvidence[] | null> {
    if (!isSupabaseEnabled()) return null;
    try {
      const { data, error } = await supabase.from('digital_evidences').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map(mapEvidenceFromDb);
    } catch (e) {
      console.error('Supabase fetchEvidences error:', e);
      return null;
    }
  },
  async upsertEvidence(evidence: DigitalEvidence): Promise<boolean> {
    if (!isSupabaseEnabled()) return false;
    try {
      const payload = mapEvidenceToDb(evidence);
      const { error } = await supabase.from('digital_evidences').upsert(payload);
      if (error) throw error;
      return true;
    } catch (e) {
      console.error('Supabase upsertEvidence error:', e);
      return false;
    }
  },
  async deleteEvidence(id: string): Promise<boolean> {
    if (!isSupabaseEnabled()) return false;
    try {
      const { error } = await supabase.from('digital_evidences').delete().eq('id', id);
      if (error) throw error;
      return true;
    } catch (e) {
      console.error('Supabase deleteEvidence error:', e);
      return false;
    }
  },

  // OFFICERS
  async fetchOfficers(): Promise<(Officer & { pin: string })[] | null> {
    if (!isSupabaseEnabled()) return null;
    try {
      const { data, error } = await supabase.from('officers').select('*').order('badge_number', { ascending: true });
      if (error) throw error;
      return (data || []).map(mapOfficerFromDb);
    } catch (e) {
      console.error('Supabase fetchOfficers error:', e);
      return null;
    }
  },
  async upsertOfficer(officer: Officer & { pin: string }): Promise<boolean> {
    if (!isSupabaseEnabled()) return false;
    try {
      const payload = mapOfficerToDb(officer);
      const { error } = await supabase.from('officers').upsert(payload);
      if (error) throw error;
      return true;
    } catch (e) {
      console.error('Supabase upsertOfficer error:', e);
      return false;
    }
  },
  async deleteOfficer(badgeNumber: string): Promise<boolean> {
    if (!isSupabaseEnabled()) return false;
    try {
      const { error } = await supabase.from('officers').delete().eq('badge_number', badgeNumber);
      if (error) throw error;
      return true;
    } catch (e) {
      console.error('Supabase deleteOfficer error:', e);
      return false;
    }
  },

  // ATTENDANCE RECORDS
  async fetchAttendanceRecords(): Promise<AttendanceRecord[] | null> {
    if (!isSupabaseEnabled()) return null;
    try {
      const { data, error } = await supabase.from('attendance_records').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map(mapAttendanceFromDb);
    } catch (e) {
      console.error('Supabase fetchAttendanceRecords error:', e);
      return null;
    }
  },
  async upsertAttendanceRecord(record: AttendanceRecord): Promise<boolean> {
    if (!isSupabaseEnabled()) return false;
    try {
      const payload = mapAttendanceToDb(record);
      const { error } = await supabase.from('attendance_records').upsert(payload);
      if (error) throw error;
      return true;
    } catch (e) {
      console.error('Supabase upsertAttendanceRecord error:', e);
      return false;
    }
  },

  // ACTIVITY LOGS
  async fetchActivityLogs(): Promise<ActivityLog[] | null> {
    if (!isSupabaseEnabled()) return null;
    try {
      const { data, error } = await supabase.from('activity_logs').select('*').order('timestamp', { ascending: false });
      if (error) throw error;
      return (data || []).map(mapActivityLogFromDb);
    } catch (e) {
      console.error('Supabase fetchActivityLogs error:', e);
      return null;
    }
  },
  async insertActivityLog(log: ActivityLog): Promise<boolean> {
    if (!isSupabaseEnabled()) return false;
    try {
      const payload = mapActivityLogToDb(log);
      const { error } = await supabase.from('activity_logs').insert(payload);
      if (error) throw error;
      return true;
    } catch (e) {
      console.error('Supabase insertActivityLog error:', e);
      return false;
    }
  },

  // AUTO-CLEANUP ATTENDANCE RECORDS (7 DAYS / 1 WEEK RETENTION FOR DATABASE EFFICIENCY)
  async cleanupOldAttendanceRecords(): Promise<boolean> {
    if (!isSupabaseEnabled()) return false;
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const isoString = sevenDaysAgo.toISOString();
      const dateStr = sevenDaysAgo.toISOString().split('T')[0];
      const { error } = await supabase
        .from('attendance_records')
        .delete()
        .or(`created_at.lt.${isoString},date.lt.${dateStr}`);
      if (error) throw error;
      console.log('Pembersihan otomatis log absensi (>7 hari) berhasil diselesaikan!');
      return true;
    } catch (e) {
      console.error('Supabase cleanupOldAttendanceRecords error:', e);
      return false;
    }
  },

  // AUTO-CLEANUP LOGS (7 DAYS / 1 WEEK RETENTION FOR DATABASE EFFICIENCY)
  async cleanupOldActivityLogs(): Promise<boolean> {
    if (!isSupabaseEnabled()) return false;
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const isoString = sevenDaysAgo.toISOString();
      const { error } = await supabase
        .from('activity_logs')
        .delete()
        .lt('timestamp', isoString);
      if (error) throw error;
      console.log('Pembersihan otomatis log aktivitas (>7 hari) berhasil diselesaikan!');
      return true;
    } catch (e) {
      console.error('Supabase cleanupOldActivityLogs error:', e);
      return false;
    }
  },
};
