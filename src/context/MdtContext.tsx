import React, { createContext, useContext, useState, useEffect } from 'react';
import { Citizen, Vehicle, CriminalReport, Detainee, DispatchCall, Officer, Charge, OfficerRank, OfficerDivision, AttendanceRecord, DigitalEvidence, ActivityLog } from '../types';
import { MOCK_CITIZENS, MOCK_VEHICLES, MOCK_REPORTS, MOCK_DETAINEES, MOCK_DISPATCH, PENAL_CODE, MOCK_EVIDENCES } from '../data/mockData';
import { supabaseService, isSupabaseEnabled, mapReportFromDb } from '../lib/supabaseService';
import { supabase } from '../lib/supabaseClient';

interface MdtContextType {
  currentOfficer: Officer | null;
  citizens: Citizen[];
  vehicles: Vehicle[];
  reports: CriminalReport[];
  detainees: Detainee[];
  dispatchCalls: DispatchCall[];
  activityLogs: ActivityLog[];
  loginOfficer: (badge: string, pin: string) => { success: boolean; error?: string };
  logoutOfficer: () => void;
  addCitizen: (citizen: Omit<Citizen, 'convictions' | 'avatar'> & { avatar?: string }) => void;
  updateCitizen: (id: string, updates: Partial<Citizen>) => void;
  deleteCitizen: (id: string) => void;
  addVehicle: (vehicle: Omit<Vehicle, 'id'>) => void;
  updateVehicle: (id: string, updates: Partial<Vehicle>) => void;
  deleteVehicle: (id: string) => void;
  getNextReportId: () => string;
  submitReport: (report: Omit<CriminalReport, 'id' | 'date' | 'isProcessed'> & { id?: string }) => void;
  updateReport: (id: string, updates: Partial<CriminalReport>) => void;
  deleteReport: (id: string) => void;
  addDispatchCall: (call: Omit<DispatchCall, 'id' | 'time' | 'status' | 'respondingUnits'>) => void;
  updateDispatchCall: (id: string, updates: Partial<DispatchCall>) => void;
  respondToDispatch: (id: string, badgeNumber: string) => void;
  updateDetaineeStatus: (id: string, status: Detainee['status'], cellNumber?: string) => void;
  releaseDetainee: (id: string) => void;
  setLanguage: (lang: 'id' | 'en') => void;
  language: 'id' | 'en';
  penalCodes: Charge[];
  updatePenalCode: (code: string, updates: Partial<Charge>) => void;
  addPenalCode: (charge: Charge) => void;
  resetPenalCodes: () => void;
  registeredOfficers: (Officer & { pin: string })[];
  registerOfficer: (badge: string, name: string, rank: OfficerRank, pin: string, avatar?: string, division?: OfficerDivision) => void;
  removeOfficer: (badge: string) => void;
  updateOfficerDivision: (badge: string, division?: OfficerDivision) => void;
  updateOfficerRankAndDivision: (badge: string, rank: OfficerRank, division?: OfficerDivision) => void;
  attendanceRecords: AttendanceRecord[];
  toggleOfficerDuty: (badge: string) => void;
  resetAttendance: () => void;
  evidences: DigitalEvidence[];
  addEvidence: (evidence: Omit<DigitalEvidence, 'id' | 'dateCollected' | 'collectedBy' | 'collectedByBadge'>) => void;
  updateEvidence: (id: string, updates: Partial<DigitalEvidence>) => void;
  deleteEvidence: (id: string) => void;
  addActivityLog: (action: ActivityLog['action'], module: ActivityLog['module'], description: string, details?: string) => void;
}

const MdtContext = createContext<MdtContextType | undefined>(undefined);

const getLocalArray = <T,>(key: string, defaultValue: T[]): T[] => {
  const saved = localStorage.getItem(key);
  if (!saved) return defaultValue;
  try {
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed : defaultValue;
  } catch (e) {
    console.warn(`Error parsing localStorage key "${key}":`, e);
    return defaultValue;
  }
};

/**
 * Normalizes existing reports so they strictly follow sequential numbering REP-01, REP-02, ...
 * without confusing legacy random numbers (e.g. REP-7701, REP-7703).
 */
export const normalizeReportIds = (reportsList: CriminalReport[]): CriminalReport[] => {
  if (!reportsList || !Array.isArray(reportsList) || reportsList.length === 0) return [];

  const hasLegacy = reportsList.some((r) => {
    if (!r || !r.id) return true;
    const match = r.id.match(/^REP-(\d+)$/i);
    if (!match) return true;
    const num = parseInt(match[1], 10);
    return num > 99;
  });

  if (!hasLegacy) {
    return reportsList;
  }

  // Sort chronologically (oldest first) to assign sequential numbers 01, 02...
  const sorted = [...reportsList].sort((a, b) => {
    const timeA = new Date(a.date).getTime();
    const timeB = new Date(b.date).getTime();
    if (!isNaN(timeA) && !isNaN(timeB)) return timeA - timeB;
    return 0;
  });

  const reindexed = sorted.map((rep, idx) => ({
    ...rep,
    id: `REP-${String(idx + 1).padStart(2, '0')}`,
  }));

  // Return newest first
  return reindexed.reverse();
};

/**
 * Calculates the next sequential report ID starting from 'REP-01', 'REP-02', etc.
 * Finds the highest number present in existing reports (e.g. REP-01 -> 1, REP-02 -> 2)
 * and returns the next padded number. If no reports exist, starts at 'REP-01'.
 */
export const calculateNextReportId = (currentReports: CriminalReport[]): string => {
  if (!currentReports || currentReports.length === 0) {
    return 'REP-01';
  }
  let maxNum = 0;
  for (const r of currentReports) {
    if (!r || !r.id) continue;
    const match = r.id.match(/^REP-(\d+)$/i) || r.id.match(/\d+/);
    if (match) {
      const num = parseInt(match[1] || match[0], 10);
      if (!isNaN(num) && num < 500 && num > maxNum) {
        maxNum = num;
      }
    }
  }
  const nextNum = maxNum + 1;
  return `REP-${String(nextNum).padStart(2, '0')}`;
};

export const MdtProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentOfficer, setCurrentOfficer] = useState<Officer | null>(() => {
    const saved = localStorage.getItem('lspd_current_officer');
    if (!saved) return null;
    try {
      const parsed = JSON.parse(saved);
      return parsed && typeof parsed === 'object' ? parsed : null;
    } catch (e) {
      console.warn('Error parsing current officer:', e);
      return null;
    }
  });

  const [registeredOfficers, setRegisteredOfficers] = useState<(Officer & { pin: string })[]>(() => {
    const defaultOfficers: (Officer & { pin: string })[] = [
      { badgeNumber: '01', name: 'Charles Davis', rank: OfficerRank.CHIEF, rankLevel: 8, onDuty: true, pin: '1010', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200', division: OfficerDivision.PUBLIC_ADMIN },
      { badgeNumber: '02', name: 'Sarah Jenkins', rank: OfficerRank.DEPUTY_CHIEF, rankLevel: 7, onDuty: true, pin: '1002', avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200', division: OfficerDivision.INTERNAL_AFFAIRS },
      { badgeNumber: '03', name: 'Arthur Pendelton', rank: OfficerRank.COMMANDER, rankLevel: 6, onDuty: true, pin: '1003', avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=200', division: OfficerDivision.SWAT },
      { badgeNumber: '05', name: 'Alice Miller', rank: OfficerRank.LIEUTENANT, rankLevel: 4, onDuty: true, pin: '1005', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200', division: OfficerDivision.CIB },
      { badgeNumber: '21', name: 'Jack Bennett', rank: OfficerRank.SERGEANT, rankLevel: 3, onDuty: true, pin: '1021', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200', division: OfficerDivision.PATROL_TRAFFIC },
      { badgeNumber: '99', name: 'Governor Archer', rank: OfficerRank.GOVERNMENT, rankLevel: 1, onDuty: true, pin: '9999', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200' }
    ];
    return getLocalArray('lspd_registered_officers', defaultOfficers);
  });

  useEffect(() => {
    localStorage.setItem('lspd_registered_officers', JSON.stringify(registeredOfficers));
  }, [registeredOfficers]);

  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>(() => {
    const defaultAttendance: AttendanceRecord[] = [
      {
        id: 'ATT-1',
        badgeNumber: '05',
        name: 'Alice Miller',
        rank: OfficerRank.LIEUTENANT,
        date: new Date().toISOString().split('T')[0],
        dutyOnTime: '08:15:30',
        dutyOffTime: '17:00:22',
        status: 'OFF-DUTY'
      },
      {
        id: 'ATT-2',
        badgeNumber: '21',
        name: 'Jack Bennett',
        rank: OfficerRank.SERGEANT,
        date: new Date().toISOString().split('T')[0],
        dutyOnTime: '09:00:00',
        status: 'DUTY'
      },
      {
        id: 'ATT-3',
        badgeNumber: '05',
        name: 'Alice Miller',
        rank: OfficerRank.LIEUTENANT,
        date: '2026-06-19',
        dutyOnTime: '08:00:00',
        dutyOffTime: '16:30:00',
        status: 'OFF-DUTY'
      },
      {
        id: 'ATT-4',
        badgeNumber: '21',
        name: 'Jack Bennett',
        rank: OfficerRank.SERGEANT,
        date: '2026-06-18',
        dutyOnTime: '13:15:00',
        dutyOffTime: '21:40:00',
        status: 'OFF-DUTY'
      },
      {
        id: 'ATT-5',
        badgeNumber: '01',
        name: 'Charles Davis',
        rank: OfficerRank.CHIEF,
        date: '2026-06-17',
        dutyOnTime: '09:30:30',
        dutyOffTime: '18:00:00',
        status: 'OFF-DUTY'
      },
      {
        id: 'ATT-6',
        badgeNumber: '05',
        name: 'Alice Miller',
        rank: OfficerRank.LIEUTENANT,
        date: '2026-06-16',
        dutyOnTime: '08:00:00',
        dutyOffTime: '17:00:00',
        status: 'OFF-DUTY'
      },
      {
        id: 'ATT-7',
        badgeNumber: '21',
        name: 'Jack Bennett',
        rank: OfficerRank.SERGEANT,
        date: '2026-06-15',
        dutyOnTime: '10:00:00',
        dutyOffTime: '18:30:00',
        status: 'OFF-DUTY'
      },
      {
        id: 'ATT-8',
        badgeNumber: '05',
        name: 'Alice Miller',
        rank: OfficerRank.LIEUTENANT,
        date: '2026-06-14',
        dutyOnTime: '08:15:00',
        dutyOffTime: '16:00:00',
        status: 'OFF-DUTY'
      },
      {
        id: 'ATT-9',
        badgeNumber: '01',
        name: 'Charles Davis',
        rank: OfficerRank.CHIEF,
        date: '2026-06-12',
        dutyOnTime: '10:00:00',
        dutyOffTime: '15:45:00',
        status: 'OFF-DUTY'
      },
      {
        id: 'ATT-10',
        badgeNumber: '21',
        name: 'Jack Bennett',
        rank: OfficerRank.SERGEANT,
        date: '2026-06-10',
        dutyOnTime: '12:00:00',
        dutyOffTime: '20:00:00',
        status: 'OFF-DUTY'
      },
      {
        id: 'ATT-11',
        badgeNumber: '05',
        name: 'Alice Miller',
        rank: OfficerRank.LIEUTENANT,
        date: '2026-06-08',
        dutyOnTime: '08:00:00',
        dutyOffTime: '16:30:00',
        status: 'OFF-DUTY'
      },
      {
        id: 'ATT-12',
        badgeNumber: '21',
        name: 'Jack Bennett',
        rank: OfficerRank.SERGEANT,
        date: '2026-06-05',
        dutyOnTime: '14:00:00',
        dutyOffTime: '22:00:00',
        status: 'OFF-DUTY'
      },
      {
        id: 'ATT-13',
        badgeNumber: '01',
        name: 'Charles Davis',
        rank: OfficerRank.CHIEF,
        date: '2026-06-01',
        dutyOnTime: '09:00:00',
        dutyOffTime: '17:00:00',
        status: 'OFF-DUTY'
      }
    ];
    return getLocalArray('lspd_attendance_records', defaultAttendance);
  });

  useEffect(() => {
    localStorage.setItem('lspd_attendance_records', JSON.stringify(attendanceRecords));
  }, [attendanceRecords]);

  const [citizens, setCitizens] = useState<Citizen[]>(() => {
    return getLocalArray('lspd_citizens', MOCK_CITIZENS);
  });

  const [vehicles, setVehicles] = useState<Vehicle[]>(() => {
    return getLocalArray('lspd_vehicles', MOCK_VEHICLES);
  });

  const [reports, setReports] = useState<CriminalReport[]>(() => {
    const rawReports = getLocalArray('lspd_reports', MOCK_REPORTS);
    return normalizeReportIds(rawReports);
  });

  const [detainees, setDetainees] = useState<Detainee[]>(() => {
    return getLocalArray('lspd_detainees', MOCK_DETAINEES);
  });

  const [dispatchCalls, setDispatchCalls] = useState<DispatchCall[]>(() => {
    return getLocalArray('lspd_dispatch', MOCK_DISPATCH);
  });

  const [language, setLanguageState] = useState<'id' | 'en'>(() => {
    return (localStorage.getItem('lspd_lang') as 'id' | 'en') || 'id';
  });

  const [penalCodes, setPenalCodes] = useState<Charge[]>(() => {
    return getLocalArray('lspd_penal_codes', PENAL_CODE);
  });

  const [evidences, setEvidences] = useState<DigitalEvidence[]>(() => {
    const raw = getLocalArray('lspd_evidences', MOCK_EVIDENCES);
    return raw.map((e) => {
      if (e.caseId === 'REP-7703') return { ...e, caseId: 'REP-02' };
      if (e.caseId === 'REP-7701') return { ...e, caseId: 'REP-01' };
      return e;
    });
  });

  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(() => {
    return getLocalArray('lspd_activity_logs', []);
  });

  useEffect(() => {
    localStorage.setItem('lspd_activity_logs', JSON.stringify(activityLogs));
  }, [activityLogs]);

  // LOAD ALL DATA FROM SUPABASE ON INITIAL MOUNT IF CONFIGURED
  useEffect(() => {
    const loadSupabaseData = async () => {
      if (!isSupabaseEnabled()) {
        console.log('Supabase tidak dikonfigurasi. Menggunakan penyimpanan lokal.');
        return;
      }
      
      console.log('Koneksi Supabase terdeteksi! Memuat data terbaru dari Cloud...');
      try {
        const dbOfficers = await supabaseService.fetchOfficers();
        if (dbOfficers !== null) {
          setRegisteredOfficers(dbOfficers);
        }

        const dbCitizens = await supabaseService.fetchCitizens();
        if (dbCitizens !== null) {
          setCitizens(dbCitizens);
        }

        const dbVehicles = await supabaseService.fetchVehicles();
        if (dbVehicles !== null) {
          setVehicles(dbVehicles);
        }

        const dbReports = await supabaseService.fetchReports();
        if (dbReports !== null) {
          setReports(normalizeReportIds(dbReports));
        }

        const dbDetainees = await supabaseService.fetchDetainees();
        if (dbDetainees !== null) {
          setDetainees(dbDetainees);
        }

        const dbDispatch = await supabaseService.fetchDispatchCalls();
        if (dbDispatch !== null) {
          setDispatchCalls(dbDispatch);
        }

        const dbPenal = await supabaseService.fetchPenalCodes();
        if (dbPenal !== null) {
          setPenalCodes(dbPenal);
        }

        const dbEvidences = await supabaseService.fetchEvidences();
        if (dbEvidences !== null) {
          setEvidences(dbEvidences);
        }

        // Pembersihan otomatis log absensi dan log aktivitas (> 7 hari) untuk menghemat ruang database Supabase
        await supabaseService.cleanupOldAttendanceRecords();
        await supabaseService.cleanupOldActivityLogs();

        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const cutoffDateStr = sevenDaysAgo.toISOString().split('T')[0];

        const dbAttendance = await supabaseService.fetchAttendanceRecords();
        if (dbAttendance !== null) {
          const filteredAttendance = dbAttendance.filter((r) => r.date >= cutoffDateStr);
          setAttendanceRecords(filteredAttendance);
        }

        const dbLogs = await supabaseService.fetchActivityLogs();
        if (dbLogs !== null) {
          const filteredLogs = dbLogs.filter((log) => {
            const logTime = new Date(log.timestamp).getTime();
            return !isNaN(logTime) ? logTime >= sevenDaysAgo.getTime() : true;
          });
          setActivityLogs(filteredLogs);
        }
        
        console.log('Sinkronisasi data Supabase berhasil diselesaikan!');
      } catch (err) {
        console.error('Koneksi Supabase gagal atau tabel belum dibuat:', err);
      }
    };

    loadSupabaseData();
  }, []);

  // Real-time synchronization across browser tabs/windows and Supabase Realtime
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 1. Cross-tab BroadcastChannel for zero-latency sync
    let bc: BroadcastChannel | null = null;
    if ('BroadcastChannel' in window) {
      try {
        bc = new BroadcastChannel('lspd_mdt_sync');
        bc.onmessage = (event) => {
          const { type, payload } = event.data || {};
          if (type === 'REPORT_CREATED' && payload?.id) {
            setReports((prev) => {
              if (prev.some((r) => r.id === payload.id)) return prev;
              return [payload, ...prev];
            });
            window.dispatchEvent(new CustomEvent('lspd_report_created', { detail: payload }));
          } else if (type === 'REPORT_UPDATED' && payload?.id) {
            setReports((prev) => prev.map((r) => (r.id === payload.id ? { ...r, ...payload } : r)));
          } else if (type === 'REPORT_DELETED' && payload) {
            setReports((prev) => prev.filter((r) => r.id !== payload));
          }
        };
      } catch (err) {
        console.warn('BroadcastChannel error:', err);
      }
    }

    // 2. Storage event fallback for older / cross-window sync
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'lspd_reports' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) {
            setReports(normalizeReportIds(parsed));
          }
        } catch {}
      }
    };
    window.addEventListener('storage', handleStorage);

    // 3. Supabase Realtime channel for instant multi-user synchronization
    let supabaseChannel: any = null;
    if (isSupabaseEnabled()) {
      try {
        supabaseChannel = supabase
          .channel('public:criminal_reports')
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'criminal_reports' },
            (payload) => {
              if (payload.eventType === 'INSERT' && payload.new) {
                const incoming = mapReportFromDb(payload.new);
                setReports((prev) => {
                  if (prev.some((r) => r.id === incoming.id)) return prev;
                  return [incoming, ...prev];
                });
                window.dispatchEvent(new CustomEvent('lspd_report_created', { detail: incoming }));
              } else if (payload.eventType === 'UPDATE' && payload.new) {
                const incoming = mapReportFromDb(payload.new);
                setReports((prev) => prev.map((r) => (r.id === incoming.id ? incoming : r)));
              } else if (payload.eventType === 'DELETE' && payload.old) {
                const deletedId = (payload.old as any).id;
                setReports((prev) => prev.filter((r) => r.id !== deletedId));
              }
            }
          )
          .subscribe();
      } catch (err) {
        console.warn('Gagal mengaktifkan Supabase Realtime channel:', err);
      }
    }

    return () => {
      if (bc) bc.close();
      window.removeEventListener('storage', handleStorage);
      if (supabaseChannel) {
        supabase.removeChannel(supabaseChannel);
      }
    };
  }, []);

  // Sync state to local storage to prevent loss of custom configurations
  useEffect(() => {
    localStorage.setItem('lspd_citizens', JSON.stringify(citizens));
  }, [citizens]);

  useEffect(() => {
    localStorage.setItem('lspd_vehicles', JSON.stringify(vehicles));
  }, [vehicles]);

  useEffect(() => {
    localStorage.setItem('lspd_reports', JSON.stringify(reports));
  }, [reports]);

  useEffect(() => {
    localStorage.setItem('lspd_detainees', JSON.stringify(detainees));
  }, [detainees]);

  useEffect(() => {
    localStorage.setItem('lspd_dispatch', JSON.stringify(dispatchCalls));
  }, [dispatchCalls]);

  useEffect(() => {
    localStorage.setItem('lspd_penal_codes', JSON.stringify(penalCodes));
  }, [penalCodes]);

  useEffect(() => {
    localStorage.setItem('lspd_evidences', JSON.stringify(evidences));
  }, [evidences]);

  const setLanguage = (lang: 'id' | 'en') => {
    setLanguageState(lang);
    localStorage.setItem('lspd_lang', lang);
  };

  const updatePenalCode = (code: string, updates: Partial<Charge>) => {
    setPenalCodes((prev) => {
      const updated = prev.map((c) => (c.code === code ? { ...c, ...updates } : c));
      const target = updated.find((c) => c.code === code);
      if (target) {
        supabaseService.upsertPenalCode(target);
      }
      return updated;
    });
  };

  const addPenalCode = (charge: Charge) => {
    setPenalCodes((prev) => [...prev, charge]);
    supabaseService.upsertPenalCode(charge);
  };

  const resetPenalCodes = () => {
    setPenalCodes(PENAL_CODE);
    PENAL_CODE.forEach((charge) => {
      supabaseService.upsertPenalCode(charge);
    });
  };

  // Detention status countdown simulator effect
  useEffect(() => {
    const interval = setInterval(() => {
      setDetainees((prev) =>
        prev
          .map((det) => {
            if (det.status === 'Bebas' || det.remainingTime <= 0) {
              return { ...det, remainingTime: 0, status: 'Bebas' as const };
            }
            // Decrement remaining sentence time (representing simulation months/minutes)
            return { ...det, remainingTime: Math.max(0, det.remainingTime - 1) };
          })
      );
    }, 1000); // 1 tick per second
    return () => clearInterval(interval);
  }, []);

  const loginOfficer = (badge: string, pin: string): { success: boolean; error?: string } => {
    const cleanBadge = badge.trim().toUpperCase().replace(/^LSPD-/, '');
    const found = registeredOfficers.find(
      (o) => o.badgeNumber === cleanBadge && o.pin === pin.trim()
    );
    if (!found) {
      return { success: false, error: 'Nomor Lencana atau PIN Keamanan Salah / Tidak Terdaftar!' };
    }

    // Set matching officer to onDuty = true
    setRegisteredOfficers((prev) => {
      const updated = prev.map((o) => (o.badgeNumber === cleanBadge ? { ...o, onDuty: true } : o));
      const target = updated.find((o) => o.badgeNumber === cleanBadge);
      if (target) {
        supabaseService.upsertOfficer(target);
      }
      return updated;
    });

    const officer: Officer = {
      badgeNumber: found.badgeNumber,
      name: found.name,
      rank: found.rank,
      rankLevel: found.rankLevel,
      onDuty: true,
      avatar: found.avatar,
      division: found.division,
    };
    setCurrentOfficer(officer);
    localStorage.setItem('lspd_current_officer', JSON.stringify(officer));

    // Log login activity
    const logNewSession: ActivityLog = {
      id: `LOG-${Math.floor(100000 + Math.random() * 900000)}`,
      timestamp: new Date().toISOString(),
      officerName: officer.name,
      officerBadge: officer.badgeNumber,
      action: 'LOGIN',
      module: 'SYSTEM',
      description: `Petugas LSPD-${officer.badgeNumber} (${officer.name}) masuk tugas (ON-DUTY).`,
      details: JSON.stringify(officer)
    };
    setActivityLogs((prev) => [logNewSession, ...prev]);
    supabaseService.insertActivityLog(logNewSession);

    // Register active daily attendance record
    const today = new Date().toISOString().split('T')[0];
    const nowTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    
    setAttendanceRecords((prev) => {
      const alreadyHasDuty = prev.some((r) => r.badgeNumber === cleanBadge && r.date === today && r.status === 'DUTY');
      if (alreadyHasDuty) return prev;
      
      const newRecord: AttendanceRecord = {
        id: `ATT-${Math.floor(1000 + Math.random() * 9000)}`,
        badgeNumber: cleanBadge,
        name: found.name,
        rank: found.rank,
        date: today,
        dutyOnTime: nowTime,
        status: 'DUTY',
      };
      supabaseService.upsertAttendanceRecord(newRecord);
      return [newRecord, ...prev];
    });

    return { success: true };
  };

  const registerOfficer = (badge: string, name: string, rank: OfficerRank, pin: string, avatar?: string, division?: OfficerDivision) => {
    let level = 1;
    switch (rank) {
      case OfficerRank.CHIEF: level = 8; break;
      case OfficerRank.DEPUTY_CHIEF: level = 7; break;
      case OfficerRank.COMMANDER: level = 6; break;
      case OfficerRank.CAPTAIN: level = 5; break;
      case OfficerRank.LIEUTENANT: level = 4; break;
      case OfficerRank.SERGEANT: level = 3; break;
      case OfficerRank.OFFICER: level = 2; break;
      case OfficerRank.GOVERNMENT: level = 1; break;
      default: level = 1; // Cadet
    }
    const cleanBadge = badge.trim().toUpperCase().replace(/^LSPD-/, '');
    const defaultAvatar = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200';
    const newOfficer = {
      badgeNumber: cleanBadge,
      name: name.trim(),
      rank,
      rankLevel: level,
      onDuty: false,
      pin: pin.trim(),
      avatar: avatar && avatar.trim() ? avatar.trim() : defaultAvatar,
      division
    };
    setRegisteredOfficers((prev) => {
      const filtered = prev.filter((o) => o.badgeNumber !== cleanBadge);
      return [...filtered, newOfficer];
    });
    supabaseService.upsertOfficer(newOfficer);
  };

  const removeOfficer = (badge: string) => {
    const cleanBadge = badge.trim().toUpperCase().replace(/^LSPD-/, '');
    setRegisteredOfficers((prev) => prev.filter((o) => o.badgeNumber !== cleanBadge));
    supabaseService.deleteOfficer(cleanBadge);
  };

  const updateOfficerDivision = (badge: string, division?: OfficerDivision) => {
    const cleanBadge = badge.trim().toUpperCase().replace(/^LSPD-/, '');
    
    setRegisteredOfficers((prev) => {
      const updated = prev.map((o) => (o.badgeNumber === cleanBadge ? { ...o, division } : o));
      const target = updated.find((o) => o.badgeNumber === cleanBadge);
      if (target) {
        supabaseService.upsertOfficer(target);
      }
      return updated;
    });

    if (currentOfficer && currentOfficer.badgeNumber === cleanBadge) {
      const updatedCurrent = { ...currentOfficer, division };
      setCurrentOfficer(updatedCurrent);
      localStorage.setItem('lspd_current_officer', JSON.stringify(updatedCurrent));
    }
  };

  const updateOfficerRankAndDivision = (badge: string, rank: OfficerRank, division?: OfficerDivision) => {
    const cleanBadge = badge.trim().toUpperCase().replace(/^LSPD-/, '');
    let level = 1;
    switch (rank) {
      case OfficerRank.CHIEF: level = 8; break;
      case OfficerRank.DEPUTY_CHIEF: level = 7; break;
      case OfficerRank.COMMANDER: level = 6; break;
      case OfficerRank.CAPTAIN: level = 5; break;
      case OfficerRank.LIEUTENANT: level = 4; break;
      case OfficerRank.SERGEANT: level = 3; break;
      case OfficerRank.OFFICER: level = 2; break;
      case OfficerRank.GOVERNMENT: level = 1; break;
      default: level = 1; // Cadet
    }

    setRegisteredOfficers((prev) => {
      const updated = prev.map((o) => (o.badgeNumber === cleanBadge ? { ...o, rank, rankLevel: level, division } : o));
      const target = updated.find((o) => o.badgeNumber === cleanBadge);
      if (target) {
        supabaseService.upsertOfficer(target);
      }
      return updated;
    });

    if (currentOfficer && currentOfficer.badgeNumber === cleanBadge) {
      const updatedCurrent = { ...currentOfficer, rank, rankLevel: level, division };
      setCurrentOfficer(updatedCurrent);
      localStorage.setItem('lspd_current_officer', JSON.stringify(updatedCurrent));
    }
  };

  const toggleOfficerDuty = (badge: string) => {
    const cleanBadge = badge.trim().toUpperCase().replace(/^LSPD-/, '');
    const officerObj = registeredOfficers.find((o) => o.badgeNumber === cleanBadge);
    if (!officerObj) return;

    const newDutyState = !officerObj.onDuty;

    // update registered officers list
    setRegisteredOfficers((prev) => {
      const updated = prev.map((o) => (o.badgeNumber === cleanBadge ? { ...o, onDuty: newDutyState } : o));
      const target = updated.find((o) => o.badgeNumber === cleanBadge);
      if (target) {
        supabaseService.upsertOfficer(target);
      }
      return updated;
    });

    // update currentOfficer if they are currently logged in
    if (currentOfficer && currentOfficer.badgeNumber === cleanBadge) {
      const updatedCurrent = { ...currentOfficer, onDuty: newDutyState };
      setCurrentOfficer(updatedCurrent);
      localStorage.setItem('lspd_current_officer', JSON.stringify(updatedCurrent));
    }

    const today = new Date().toISOString().split('T')[0];
    const nowTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    setAttendanceRecords((prev) => {
      if (newDutyState) {
        // Log in to DUTY
        const newRecord: AttendanceRecord = {
          id: `ATT-${Math.floor(1000 + Math.random() * 9000)}`,
          badgeNumber: cleanBadge,
          name: officerObj.name,
          rank: officerObj.rank,
          date: today,
          dutyOnTime: nowTime,
          status: 'DUTY',
        };
        supabaseService.upsertAttendanceRecord(newRecord);
        return [newRecord, ...prev];
      } else {
        // Log out to OFF-DUTY: find latest active DUTY record of today
        const recordIndex = prev.findIndex(
          (r) => r.badgeNumber === cleanBadge && r.date === today && r.status === 'DUTY'
        );
        if (recordIndex !== -1) {
          const updated = [...prev];
          updated[recordIndex] = {
            ...updated[recordIndex],
            dutyOffTime: nowTime,
            status: 'OFF-DUTY',
          };
          supabaseService.upsertAttendanceRecord(updated[recordIndex]);
          return updated;
        } else {
          // fallback record
          const newRecord: AttendanceRecord = {
            id: `ATT-${Math.floor(1000 + Math.random() * 9000)}`,
            badgeNumber: cleanBadge,
            name: officerObj.name,
            rank: officerObj.rank,
            date: today,
            dutyOnTime: '08:00:00',
            dutyOffTime: nowTime,
            status: 'OFF-DUTY',
          };
          supabaseService.upsertAttendanceRecord(newRecord);
          return [newRecord, ...prev];
        }
      }
    });
  };

  const resetAttendance = () => {
    setAttendanceRecords([]);
    // also mark all registered officers as off duty
    setRegisteredOfficers((prev) => prev.map((o) => ({ ...o, onDuty: false })));
    if (currentOfficer) {
      const updatedCurrent = { ...currentOfficer, onDuty: false };
      setCurrentOfficer(updatedCurrent);
      localStorage.setItem('lspd_current_officer', JSON.stringify(updatedCurrent));
    }
  };

  const logoutOfficer = () => {
    if (currentOfficer) {
      const cleanBadge = currentOfficer.badgeNumber;
      
      // Log logout activity
      addActivityLog('LOGOUT', 'SYSTEM', `Petugas LSPD-${currentOfficer.badgeNumber} (${currentOfficer.name}) keluar tugas (OFF-DUTY).`);

      // Mark as offDuty: false in registered officers
      setRegisteredOfficers((prev) => {
        const updated = prev.map((o) => (o.badgeNumber === cleanBadge ? { ...o, onDuty: false } : o));
        const target = updated.find((o) => o.badgeNumber === cleanBadge);
        if (target) {
          supabaseService.upsertOfficer(target);
        }
        return updated;
      });

      const today = new Date().toISOString().split('T')[0];
      const nowTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

      setAttendanceRecords((prev) => {
        const recordIndex = prev.findIndex(
          (r) => r.badgeNumber === cleanBadge && r.date === today && r.status === 'DUTY'
        );
        if (recordIndex !== -1) {
          const updated = [...prev];
          updated[recordIndex] = {
            ...updated[recordIndex],
            dutyOffTime: nowTime,
            status: 'OFF-DUTY',
          };
          supabaseService.upsertAttendanceRecord(updated[recordIndex]);
          return updated;
        }
        return prev;
      });
    }

    setCurrentOfficer(null);
    localStorage.removeItem('lspd_current_officer');
  };

  const addActivityLog = (action: ActivityLog['action'], module: ActivityLog['module'], description: string, details?: string) => {
    const newLog: ActivityLog = {
      id: `LOG-${Math.floor(100000 + Math.random() * 900000)}`,
      timestamp: new Date().toISOString(),
      officerName: currentOfficer ? currentOfficer.name : 'System',
      officerBadge: currentOfficer ? currentOfficer.badgeNumber : 'SYSTEM',
      action,
      module,
      description,
      details: details || ''
    };
    setActivityLogs((prev) => [newLog, ...prev]);
    supabaseService.insertActivityLog(newLog);
  };



  const addCitizen = (citizenData: Omit<Citizen, 'convictions' | 'avatar'> & { avatar?: string }) => {
    const defaultAvatar = citizenData.gender === 'Laki-laki'
      ? 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200'
      : 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200';

    const newCitizen: Citizen = {
      ...citizenData,
      avatar: citizenData.avatar || defaultAvatar,
      convictions: [],
      isWanted: citizenData.isWanted || false,
    };
    setCitizens((prev) => [newCitizen, ...prev]);
    supabaseService.upsertCitizen(newCitizen);
    addActivityLog('CREATE', 'CITIZENS', `Mendaftarkan data warga baru: ${newCitizen.firstName} ${newCitizen.lastName} (${newCitizen.id})`, JSON.stringify(newCitizen));
  };

  const updateCitizen = (id: string, updates: Partial<Citizen>) => {
    setCitizens((prev) => {
      const updated = prev.map((c) => (c.id === id ? { ...c, ...updates } : c));
      const target = updated.find((c) => c.id === id);
      if (target) {
        supabaseService.upsertCitizen(target);
      }
      return updated;
    });

    const citizen = citizens.find((c) => c.id === id);
    if (citizen) {
      addActivityLog('UPDATE', 'CITIZENS', `Mengubah data warga: ${citizen.firstName} ${citizen.lastName} (${id})`, JSON.stringify(updates));
    }
  };

  const deleteCitizen = (id: string) => {
    const citizen = citizens.find((c) => c.id === id);
    setCitizens((prev) => prev.filter((c) => c.id !== id));
    supabaseService.deleteCitizen(id);
    if (citizen) {
      addActivityLog('DELETE', 'CITIZENS', `Menghapus data warga permanen: ${citizen.firstName} ${citizen.lastName} (${id})`, JSON.stringify(citizen));
    }
  };

  const addVehicle = (vehicleData: Omit<Vehicle, 'id'>) => {
    const newVehicle: Vehicle = {
      ...vehicleData,
      id: `VEH-${Math.floor(1000 + Math.random() * 9000)}`,
    };
    setVehicles((prev) => [newVehicle, ...prev]);
    supabaseService.upsertVehicle(newVehicle);
    addActivityLog('CREATE', 'VEHICLES', `Mendaftarkan kendaraan baru: Plat ${newVehicle.plate} (${newVehicle.model}) milik ${newVehicle.ownerName}`, JSON.stringify(newVehicle));
  };

  const updateVehicle = (id: string, updates: Partial<Vehicle>) => {
    setVehicles((prev) => {
      const updated = prev.map((v) => (v.id === id ? { ...v, ...updates } : v));
      const target = updated.find((v) => v.id === id);
      if (target) {
        supabaseService.upsertVehicle(target);
      }
      return updated;
    });

    const vehicle = vehicles.find((v) => v.id === id);
    if (vehicle) {
      addActivityLog('UPDATE', 'VEHICLES', `Mengubah data kendaraan: Plat ${vehicle.plate} (${vehicle.model})`, JSON.stringify(updates));
    }
  };

  const deleteVehicle = (id: string) => {
    const vehicle = vehicles.find((v) => v.id === id);
    setVehicles((prev) => prev.filter((v) => v.id !== id));
    supabaseService.deleteVehicle(id);
    if (vehicle) {
      addActivityLog('DELETE', 'VEHICLES', `Menghapus data kendaraan permanen: Plat ${vehicle.plate} (${vehicle.model})`, JSON.stringify(vehicle));
    }
  };

  const getNextId = () => calculateNextReportId(reports);

  const submitReport = (reportData: Omit<CriminalReport, 'id' | 'date' | 'isProcessed'> & { id?: string }) => {
    const reportId = reportData.id || calculateNextReportId(reports);
    const status = reportData.status || 'Selesai';
    const type = reportData.type || 'LSPD';

    const newReport: CriminalReport = {
      ...reportData,
      status,
      type,
      id: reportId,
      date: new Date().toISOString(),
      isProcessed: true,
    };

    // Add to reports list (Real-time update at top of array)
    setReports((prev) => [newReport, ...prev.filter((r) => r.id !== reportId)]);
    supabaseService.upsertReport(newReport);
    addActivityLog('CREATE', 'REPORTS', `Membuat Laporan Kasus baru #${reportId}: ${newReport.title} untuk tersangka ${newReport.suspectName}`, JSON.stringify(newReport));

    // Real-time broadcast for zero-latency monitoring board updates
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('lspd_report_created', { detail: newReport }));
      if ('BroadcastChannel' in window) {
        try {
          const bc = new BroadcastChannel('lspd_mdt_sync');
          bc.postMessage({ type: 'REPORT_CREATED', payload: newReport });
          bc.close();
        } catch {}
      }
    }

    // Track chosen suspect IDs for updating multiple suspect convictions
    const targetSuspects = reportData.suspects && reportData.suspects.length > 0
      ? reportData.suspects
      : (reportData.suspectId ? [{ id: reportData.suspectId, name: reportData.suspectName }] : []);

    // Filter out unknown/mock/lidik suspect IDs
    const validSuspects = targetSuspects.filter(sus => sus.id && sus.id !== 'LIDIK' && sus.id !== 'UNKNOWN');
    const validSuspectIds = validSuspects.map(s => s.id);

    if (validSuspectIds.length > 0) {
      // Sync citizen updates to Supabase
      validSuspectIds.forEach((sid) => {
        const ctz = citizens.find((c) => c.id === sid);
        if (ctz) {
          const updatedCtz = { ...ctz };
          if (status === 'Selesai') {
            const newConvictions = [...ctz.convictions];
            reportData.charges.forEach((charge) => {
              if (!newConvictions.includes(charge.title)) {
                newConvictions.push(charge.title);
              }
            });
            updatedCtz.convictions = newConvictions;
            updatedCtz.isWanted = false;
            updatedCtz.wantedReason = undefined;
          } else if (status === 'DPO') {
            updatedCtz.isWanted = true;
            updatedCtz.wantedReason = `DPO: ${reportData.title}`;
          }
          supabaseService.upsertCitizen(updatedCtz);
        }
      });

      // Update Citizen convictions and clear WANTED status if they are being processed
      setCitizens((prev) =>
        prev.map((c) => {
          if (validSuspectIds.includes(c.id)) {
            if (status === 'Selesai') {
              const newConvictions = [...c.convictions];
              reportData.charges.forEach((charge) => {
                if (!newConvictions.includes(charge.title)) {
                  newConvictions.push(charge.title);
                }
              });
              return {
                ...c,
                convictions: newConvictions,
                isWanted: false, // Turn off wanted since captured!
                wantedReason: undefined,
              };
            } else if (status === 'DPO') {
              return {
                ...c,
                isWanted: true,
                wantedReason: `DPO: ${reportData.title}`,
              };
            }
          }
          return c;
        })
      );

      // If status is 'Selesai', automatically register suspect into the Detainee database
      if (status === 'Selesai') {
        setDetainees((prev) => {
          const newDetaineesToAppend = validSuspects.map((sus) => {
            const detaineeId = `DET-${Math.floor(100 + Math.random() * 900)}`;
            // Give adequate simulation time: at least 300s (5 minutes) or jail time * 60s
            const simulationSeconds = reportData.totalJailTime > 0
              ? Math.max(300, reportData.totalJailTime * 60)
              : 300;
            const newDet = {
              id: detaineeId,
              citizenName: sus.name,
              citizenId: sus.id,
              jailTime: reportData.totalJailTime > 0 ? reportData.totalJailTime : 5,
              remainingTime: simulationSeconds,
              fine: reportData.totalFine,
              cellNumber: `Sel Block ${Math.floor(1 + Math.random() * 4)}-${Math.floor(1 + Math.random() * 10)}`,
              status: reportData.totalJailTime > 0 ? ('Dalam Sel' as const) : ('Interogasi' as const),
              dateArrested: new Date().toISOString(),
              arrestingOfficer: `${currentOfficer?.rank ?? 'Ofc.'} ${currentOfficer?.name ?? 'Unknown'} (Kasus ${reportId})`,
            };
            // Sync to Supabase
            supabaseService.upsertDetainee(newDet);
            return newDet;
          });
          return [...newDetaineesToAppend, ...prev];
        });
      }
    }
  };

  const deleteReport = (id: string) => {
    const reportToDelete = reports.find((r) => r.id === id);
    setReports((prev) => prev.filter((r) => r.id !== id));
    supabaseService.deleteReport(id);
    if (reportToDelete) {
      addActivityLog('DELETE', 'REPORTS', `Menghapus Laporan Kasus permanen: #${id} - ${reportToDelete.title}`, JSON.stringify(reportToDelete));
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('lspd_report_deleted', { detail: id }));
      if ('BroadcastChannel' in window) {
        try {
          const bc = new BroadcastChannel('lspd_mdt_sync');
          bc.postMessage({ type: 'REPORT_DELETED', payload: id });
          bc.close();
        } catch {}
      }
    }
  };

  const updateReport = (id: string, updates: Partial<CriminalReport>) => {
    // Find old report before update
    const oldReport = reports.find(r => r.id === id);

    setReports((prev) => {
      const updated = prev.map((r) => (r.id === id ? { ...r, ...updates } : r));
      const target = updated.find((r) => r.id === id);
      if (target) {
        supabaseService.upsertReport(target);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('lspd_report_updated', { detail: target }));
          if ('BroadcastChannel' in window) {
            try {
              const bc = new BroadcastChannel('lspd_mdt_sync');
              bc.postMessage({ type: 'REPORT_UPDATED', payload: target });
              bc.close();
            } catch {}
          }
        }
      }
      return updated;
    });

    if (oldReport) {
      addActivityLog('UPDATE', 'REPORTS', `Mengubah Laporan Kasus: #${id} - ${oldReport.title}`, JSON.stringify(updates));
      
      const oldStatus = oldReport.status || 'Selesai';
      const newStatus = updates.status || oldStatus;

      // Transition to Selesai
      if (newStatus === 'Selesai' && oldStatus !== 'Selesai') {
        const targetSuspectIds = updates.suspects
          ? updates.suspects.map((s) => s.id)
          : (updates.suspectId ? [updates.suspectId] : (oldReport.suspects ? oldReport.suspects.map(s => s.id) : [oldReport.suspectId]));

        const validSuspectIds = targetSuspectIds.filter(id => id && id !== 'LIDIK' && id !== 'UNKNOWN');

        if (validSuspectIds.length > 0) {
          const reportCharges = updates.charges || oldReport.charges;
          const reportTitle = updates.title || oldReport.title;
          const reportFine = updates.totalFine !== undefined ? updates.totalFine : oldReport.totalFine;
          const reportJailTime = updates.totalJailTime !== undefined ? updates.totalJailTime : oldReport.totalJailTime;

          // Sync updated citizens to Supabase
          validSuspectIds.forEach((sid) => {
            const ctz = citizens.find((c) => c.id === sid);
            if (ctz) {
              const newConvictions = [...ctz.convictions];
              reportCharges.forEach((charge) => {
                if (!newConvictions.includes(charge.title)) {
                  newConvictions.push(charge.title);
                }
              });
              const updatedCtz = {
                ...ctz,
                convictions: newConvictions,
                isWanted: false,
                wantedReason: undefined,
              };
              supabaseService.upsertCitizen(updatedCtz);
            }
          });

          setCitizens((prev) =>
            prev.map((c) => {
              if (validSuspectIds.includes(c.id)) {
                const newConvictions = [...c.convictions];
                reportCharges.forEach((charge) => {
                  if (!newConvictions.includes(charge.title)) {
                    newConvictions.push(charge.title);
                  }
                });
                return {
                  ...c,
                  convictions: newConvictions,
                  isWanted: false,
                  wantedReason: undefined,
                };
              }
              return c;
            })
          );

          if (reportJailTime > 0) {
            const listToIncarcerate = updates.suspects || oldReport.suspects || [
              { id: updates.suspectId || oldReport.suspectId, name: updates.suspectName || oldReport.suspectName },
            ];

            const validListToIncarcerate = listToIncarcerate.filter(sus => sus.id && sus.id !== 'LIDIK' && sus.id !== 'UNKNOWN');

            if (validListToIncarcerate.length > 0) {
              setDetainees((prev) => {
                const newDetaineesToAppend = validListToIncarcerate.map((sus) => {
                  const detaineeId = `DET-${Math.floor(100 + Math.random() * 900)}`;
                  const simulationSeconds = reportJailTime * 15;
                  const newDet = {
                    id: detaineeId,
                    citizenName: sus.name,
                    citizenId: sus.id,
                    jailTime: reportJailTime,
                    remainingTime: simulationSeconds,
                    fine: reportFine,
                    cellNumber: `Sel Block ${Math.floor(1 + Math.random() * 4)}-${Math.floor(1 + Math.random() * 10)}`,
                    status: 'Dalam Sel' as const,
                    dateArrested: new Date().toISOString(),
                    arrestingOfficer: `${currentOfficer?.rank ?? 'Ofc.'} ${currentOfficer?.name ?? 'Unknown'}`,
                  };
                  // Sync detainee to Supabase
                  supabaseService.upsertDetainee(newDet);
                  return newDet;
                });
                return [...newDetaineesToAppend, ...prev];
              });
            }
          }
        }
      } else if (newStatus === 'DPO' && oldStatus !== 'DPO') {
        const targetSuspectIds = updates.suspects
          ? updates.suspects.map((s) => s.id)
          : (updates.suspectId ? [updates.suspectId] : (oldReport.suspects ? oldReport.suspects.map(s => s.id) : [oldReport.suspectId]));

        const validSuspectIds = targetSuspectIds.filter(id => id && id !== 'LIDIK' && id !== 'UNKNOWN');

        if (validSuspectIds.length > 0) {
          const reportTitle = updates.title || oldReport.title;

          // Sync DPO citizens to Supabase
          validSuspectIds.forEach((sid) => {
            const ctz = citizens.find((c) => c.id === sid);
            if (ctz) {
              const updatedCtz = {
                ...ctz,
                isWanted: true,
                wantedReason: `DPO: ${reportTitle}`,
              };
              supabaseService.upsertCitizen(updatedCtz);
            }
          });

          setCitizens((prev) =>
            prev.map((c) => {
              if (validSuspectIds.includes(c.id)) {
                return {
                  ...c,
                  isWanted: true,
                  wantedReason: `DPO: ${reportTitle}`,
                };
              }
              return c;
            })
          );
        }
      }
    }
  };

  const addDispatchCall = (callData: Omit<DispatchCall, 'id' | 'time' | 'status' | 'respondingUnits'>) => {
    const newCall: DispatchCall = {
      ...callData,
      id: `DSP-${Math.floor(10 + Math.random() * 90)}`,
      time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      status: 'Aktif',
      respondingUnits: [],
    };
    setDispatchCalls((prev) => [newCall, ...prev]);
    supabaseService.upsertDispatchCall(newCall);
  };

  const updateDispatchCall = (id: string, updates: Partial<DispatchCall>) => {
    setDispatchCalls((prev) => {
      const updated = prev.map((c) => (c.id === id ? { ...c, ...updates } : c));
      const target = updated.find((c) => c.id === id);
      if (target) {
        supabaseService.upsertDispatchCall(target);
      }
      return updated;
    });
  };

  const respondToDispatch = (id: string, badgeNumber: string) => {
    setDispatchCalls((prev) => {
      const updated = prev.map((c) => {
        if (c.id === id) {
          const units = c.respondingUnits.includes(badgeNumber)
            ? c.respondingUnits.filter((u) => u !== badgeNumber)
            : [...c.respondingUnits, badgeNumber];
          const status = units.length > 0 ? ('Merespon' as const) : ('Aktif' as const);
          return {
            ...c,
            respondingUnits: units,
            status,
          };
        }
        return c;
      });
      const target = updated.find((c) => c.id === id);
      if (target) {
        supabaseService.upsertDispatchCall(target);
      }
      return updated;
    });
  };

  const updateDetaineeStatus = (id: string, status: Detainee['status'], cellNumber?: string) => {
    setDetainees((prev) => {
      const updated = prev.map((det) => {
        if (det.id === id) {
          const cell = cellNumber !== undefined ? cellNumber : det.cellNumber;
          return {
            ...det,
            status,
            cellNumber: cell,
            // If released, clear remaining jail timer
            remainingTime: status === 'Bebas' ? 0 : det.remainingTime,
          };
        }
        return det;
      });
      const target = updated.find((det) => det.id === id);
      if (target) {
        supabaseService.upsertDetainee(target);
      }
      return updated;
    });
  };

  const releaseDetainee = (id: string) => {
    setDetainees((prev) => prev.filter((det) => det.id !== id));
    supabaseService.deleteDetainee(id);
  };

  const addEvidence = (evidenceData: Omit<DigitalEvidence, 'id' | 'dateCollected' | 'collectedBy' | 'collectedByBadge'>) => {
    const evidenceId = `EVI-${Math.floor(1000 + Math.random() * 9000)}`;
    const newEvidence: DigitalEvidence = {
      ...evidenceData,
      id: evidenceId,
      dateCollected: new Date().toISOString(),
      collectedBy: currentOfficer ? currentOfficer.name : 'Unknown Officer',
      collectedByBadge: currentOfficer ? currentOfficer.badgeNumber : '00',
    };
    setEvidences((prev) => [newEvidence, ...prev]);
    supabaseService.upsertEvidence(newEvidence);
    addActivityLog('CREATE', 'EVIDENCE', `Mendaftarkan barang bukti baru #${evidenceId}: ${newEvidence.title} (Kasus: ${newEvidence.caseTitle})`, JSON.stringify(newEvidence));
  };

  const updateEvidence = (id: string, updates: Partial<DigitalEvidence>) => {
    setEvidences((prev) => {
      const updated = prev.map((e) => (e.id === id ? { ...e, ...updates } : e));
      const target = updated.find((e) => e.id === id);
      if (target) {
        supabaseService.upsertEvidence(target);
      }
      return updated;
    });

    const evidence = evidences.find((e) => e.id === id);
    if (evidence) {
      addActivityLog('UPDATE', 'EVIDENCE', `Mengubah status barang bukti #${id} (${evidence.title})`, JSON.stringify(updates));
    }
  };

  const deleteEvidence = (id: string) => {
    const evidence = evidences.find((e) => e.id === id);
    setEvidences((prev) => prev.filter((e) => e.id !== id));
    supabaseService.deleteEvidence(id);
    if (evidence) {
      addActivityLog('DELETE', 'EVIDENCE', `Menghapus data barang bukti permanen #${id} (${evidence.title})`, JSON.stringify(evidence));
    }
  };

  return (
    <MdtContext.Provider
      value={{
        currentOfficer,
        citizens,
        vehicles,
        reports,
        detainees,
        dispatchCalls,
        activityLogs,
        loginOfficer,
        logoutOfficer,
        addCitizen,
        updateCitizen,
        deleteCitizen,
        addVehicle,
        updateVehicle,
        deleteVehicle,
        getNextReportId: getNextId,
        submitReport,
        updateReport,
        deleteReport,
        addDispatchCall,
        updateDispatchCall,
        respondToDispatch,
        updateDetaineeStatus,
        releaseDetainee,
        setLanguage,
        language,
        penalCodes,
        updatePenalCode,
        addPenalCode,
        resetPenalCodes,
        registeredOfficers,
        registerOfficer,
        removeOfficer,
        updateOfficerDivision,
        updateOfficerRankAndDivision,
        attendanceRecords,
        toggleOfficerDuty,
        resetAttendance,
        evidences,
        addEvidence,
        updateEvidence,
        deleteEvidence,
        addActivityLog,
      }}
    >
      {children}
    </MdtContext.Provider>
  );
};

export const useMdt = () => {
  const context = useContext(MdtContext);
  if (!context) {
    throw new Error('useMdt must be used within an MdtProvider');
  }
  return context;
};
