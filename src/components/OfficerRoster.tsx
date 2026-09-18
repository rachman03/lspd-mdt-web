import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useMdt } from '../context/MdtContext';
import { OfficerRank, OfficerDivision } from '../types';
import { Shield, PlusCircle, UserMinus, Search, Lock, User, ShieldCheck, RefreshCw, Calendar, Clock, Printer, FileText, ChevronRight, Trophy, Award, Edit, X, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { copyToClipboard } from '../lib/clipboard';
import lspdLogo from '../assets/images/lspd_logo_1781980741624.jpg';

export const OfficerRoster: React.FC = () => {
  const {
    registeredOfficers,
    registerOfficer,
    removeOfficer,
    currentOfficer,
    attendanceRecords,
    toggleOfficerDuty,
    resetAttendance,
    reports,
    updateOfficerRankAndDivision
  } = useMdt();

  const getOfficerReportCount = (badge: string, name: string) => {
    const cleanBadge = badge.trim().toUpperCase().replace(/^LSPD-/, '');
    const cleanName = name.trim().toLowerCase();
    
    return reports.filter((rep) => {
      const repBadge = rep.officerBadge?.trim().toUpperCase().replace(/^LSPD-/, '');
      const repName = rep.officerName?.trim().toLowerCase();
      
      return (repBadge && repBadge === cleanBadge) || 
             (repName && (repName.includes(cleanName) || cleanName.includes(repName)));
    }).length;
  };
  
  const [searchQuery, setSearchQuery] = useState('');
  const [rosterTab, setRosterTab] = useState<'daily' | 'monthly'>('daily');
  const [selectedMonthFilter, setSelectedMonthFilter] = useState<'all' | 'current' | 'past'>('all');
  const [logSearchQuery, setLogSearchQuery] = useState('');
  const [sortStatsBy, setSortStatsBy] = useState<'hours' | 'reports'>('hours');
  
  // Register Form State
  const [newBadge, setNewBadge] = useState('');
  const [newName, setNewName] = useState('');
  const [newRank, setNewRank] = useState<OfficerRank>(OfficerRank.OFFICER);
  const [newDivision, setNewDivision] = useState<string>('');
  const [newPin, setNewPin] = useState('');
  const [newAvatar, setNewAvatar] = useState('');

  // Edit Officer State
  const [editingOfficerBadge, setEditingOfficerBadge] = useState<string | null>(null);
  const [editRank, setEditRank] = useState<OfficerRank>(OfficerRank.OFFICER);
  const [editDivision, setEditDivision] = useState<string>('');
  
  // Custom dialog state
  const [officerToDelete, setOfficerToDelete] = useState<{ badge: string; name: string } | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [customAlert, setCustomAlert] = useState<{ title: string; message: string } | null>(null);
  const [showLogsPrintPreview, setShowLogsPrintPreview] = useState(false);
  const [copiedLogsSuccess, setCopiedLogsSuccess] = useState(false);
  const [manualCopyLogsText, setManualCopyLogsText] = useState<string | null>(null);

  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Role Checker
  const isChief = currentOfficer?.rank === OfficerRank.CHIEF;
  const isDeputy = currentOfficer?.rank === OfficerRank.DEPUTY_CHIEF;
  const canManage = isChief || isDeputy;

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOfficerBadge) return;
    updateOfficerRankAndDivision(
      editingOfficerBadge,
      editRank,
      editDivision ? (editDivision as OfficerDivision) : undefined
    );
    setEditingOfficerBadge(null);
  };

  const filteredOfficers = registeredOfficers.filter((off) => {
    const q = searchQuery.toLowerCase();
    return (
      off.name.toLowerCase().includes(q) ||
      off.badgeNumber.toLowerCase().includes(q) ||
      off.rank.toLowerCase().includes(q)
    );
  });

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!canManage) {
      setErrorMsg('Hanya Kepala Polisi atau petugas berwenang yang diizinkan mendaftarkan anggota baru!');
      return;
    }

    if (!newBadge.trim() || !newName.trim() || !newPin.trim()) {
      setErrorMsg('Semua kolom registrasi wajib diisi!');
      return;
    }

    const cleanBadge = newBadge.trim().toUpperCase().replace(/^LSPD-/, '');
    
    // Check duplication
    const duplicate = registeredOfficers.find(o => o.badgeNumber === cleanBadge);
    if (duplicate) {
      setErrorMsg(`Nomor Lencana LSPD-${cleanBadge} sudah terdaftar atas nama ${duplicate.name}!`);
      return;
    }

    registerOfficer(
      cleanBadge, 
      newName.trim(), 
      newRank, 
      newPin.trim(), 
      newAvatar.trim(), 
      newDivision ? (newDivision as OfficerDivision) : undefined
    );
    setSuccessMsg(`Petugas LSPD-${cleanBadge} (${newName}) berhasil didaftarkan ke pangkalan data!`);
    
    // Reset fields
    setNewBadge('');
    setNewName('');
    setNewRank(OfficerRank.OFFICER);
    setNewDivision('');
    setNewPin('');
    setNewAvatar('');

    setTimeout(() => {
      setSuccessMsg('');
    }, 4000);
  };

  const handleRemove = (badge: string, name: string) => {
    if (!canManage) {
      setCustomAlert({
        title: 'AKSES DITOLAK',
        message: 'Anda tidak memiliki otoritas manajemen untuk memecat/menghapus petugas!'
      });
      return;
    }
    if (badge === currentOfficer?.badgeNumber) {
      setCustomAlert({
        title: 'PERINGATAN PROTOKOL',
        message: 'Anda tidak bisa menghapus diri Anda sendiri saat sedang bertugas!'
      });
      return;
    }
    setOfficerToDelete({ badge, name });
  };

  // HELPER calculations for Monthly Duty control
  const calculateDurationMinutes = (on: string, off?: string) => {
    if (!off) return 0;
    const [onH, onM, onS] = on.split(':').map(Number);
    const [offH, offM, offS] = off.split(':').map(Number);
    const onTotalSecs = onH * 3600 + onM * 60 + (onS || 0);
    const offTotalSecs = offH * 3600 + offM * 60 + (offS || 0);
    if (offTotalSecs >= onTotalSecs) {
      return (offTotalSecs - onTotalSecs) / 60;
    }
    return ((24 * 3600 - onTotalSecs) + offTotalSecs) / 60;
  };

  // Filter logs by week (7 days retention) and search query
  const filteredLogs = attendanceRecords.filter((rec) => {
    const matchesQuery = 
      rec.name.toLowerCase().includes(logSearchQuery.toLowerCase()) ||
      rec.badgeNumber.toLowerCase().includes(logSearchQuery.toLowerCase());
    
    if (selectedMonthFilter === 'all') return matchesQuery;
    
    const recordDate = new Date(rec.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffDays = Math.floor((today.getTime() - recordDate.getTime()) / (1000 * 3600 * 24));

    if (selectedMonthFilter === 'current') {
      return matchesQuery && diffDays <= 3;
    } else {
      return matchesQuery && diffDays > 3;
    }
  });

  // Calculate statistics aggregated by active officers
  const officerStats = registeredOfficers.map((off) => {
    const records = attendanceRecords.filter((rec) => rec.badgeNumber === off.badgeNumber);
    
    let totalMinutes = 0;
    let completedSessions = 0;
    let ongoingSessions = 0;
    
    records.forEach((rec) => {
      if (rec.dutyOffTime) {
        totalMinutes += calculateDurationMinutes(rec.dutyOnTime, rec.dutyOffTime);
        completedSessions++;
      } else if (rec.status === 'DUTY') {
        ongoingSessions++;
      }
    });

    const reportCount = getOfficerReportCount(off.badgeNumber, off.name);

    return {
      ...off,
      totalMinutes,
      totalSessions: records.length,
      completedSessions,
      ongoingSessions,
      reportCount
    };
  }).sort((a, b) => {
    if (sortStatsBy === 'reports') {
      if (b.reportCount !== a.reportCount) {
        return b.reportCount - a.reportCount;
      }
      return b.totalMinutes - a.totalMinutes;
    }
    return b.totalMinutes - a.totalMinutes;
  });

  // General operations summaries
  const totalDutyHoursLogged = Math.round(
    attendanceRecords.reduce((acc, rec) => {
      if (rec.dutyOffTime) {
        return acc + calculateDurationMinutes(rec.dutyOnTime, rec.dutyOffTime);
      }
      return acc;
    }, 0) / 60
  );

  const activeOfficersThisMonth = registeredOfficers.filter(off => 
    attendanceRecords.some(rec => rec.badgeNumber === off.badgeNumber)
  ).length;

  return (
    <div className="space-y-6" id="lspd-roster-top-panel">
      {/* Sub-tab Navigation */}
      <div className="flex bg-slate-900 border border-slate-800 p-1 rounded-lg max-w-sm font-sans text-xs">
        <button
          id="tab-daily-btn"
          onClick={() => setRosterTab('daily')}
          className={`flex-1 py-1.5 text-center rounded font-sans text-xs font-bold uppercase cursor-pointer transition-all ${
            rosterTab === 'daily'
              ? 'bg-sky-500 text-slate-950 shadow-sm font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          📋 Dinas Harian
        </button>
        <button
          id="tab-monthly-btn"
          onClick={() => setRosterTab('monthly')}
          className={`flex-1 py-1.5 text-center rounded font-sans text-xs font-bold uppercase cursor-pointer transition-all ${
            rosterTab === 'monthly'
              ? 'bg-sky-500 text-slate-950 shadow-sm font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          📊 Laporan Mingguan (7 Hari)
        </button>
      </div>

      {rosterTab === 'daily' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="lspd-roster-panel">
      
      {/* LEFT COLUMN: ACTIVE ROSTER DIRECTORY */}
      <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-lg overflow-hidden shadow-lg flex flex-col h-[750px]">
        
        {/* Panel Header */}
        <div className="bg-slate-850 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Shield className="w-5 h-5 text-sky-400" />
            <h2 className="text-sm font-bold font-mono text-slate-200 uppercase tracking-widest">DIREKTORI ANGGOTA LSPD AKTIF</h2>
          </div>
          <span className="text-[10px] bg-slate-950 border border-slate-800 text-sky-450 px-2 py-0.5 shadow-sm rounded font-mono font-bold uppercase">
            Jumlah Anggota: {registeredOfficers.length}
          </span>
        </div>

        {/* Search Field */}
        <div className="p-3 bg-slate-955 border-b border-slate-900">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
            <input
              id="roster-search-input"
              type="text"
              placeholder="Cari Agen LSPD berdasarkan Nama / No Lencana / Kepangkatan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 focus:border-sky-500 rounded pl-9 pr-3 py-2 text-xs text-slate-100 outline-none font-mono"
            />
          </div>
        </div>

        {/* Directory List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 divide-y divide-slate-850/30">
          {filteredOfficers.length === 0 ? (
            <div className="text-center py-20 text-slate-500 font-mono text-xs">
              Tidak ada data petugas yang cocok dengan kata kunci pencarian.
            </div>
          ) : (
            filteredOfficers.map((off) => {
              const isCurrent = off.badgeNumber === currentOfficer?.badgeNumber;
              return (
                <div
                  key={off.badgeNumber}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-md border text-left transition-colors ${
                    isCurrent 
                      ? 'bg-sky-950/20 border-sky-850/60' 
                      : 'bg-slate-950 border-slate-850 hover:border-slate-800'
                  }`}
                >
                  <div className="flex items-center space-x-3.5">
                    {off.avatar ? (
                      <img 
                        src={off.avatar} 
                        alt={off.name} 
                        className={`w-10 h-10 rounded-md object-cover border ${
                          off.rankLevel >= 5 
                            ? 'border-amber-500/50 shadow-md shadow-amber-500/5' 
                            : 'border-slate-805/70'
                        }`}
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className={`p-2 rounded-md ${
                        off.rankLevel >= 5 
                          ? 'bg-amber-955/40 text-amber-500 border border-amber-900/50' 
                          : 'bg-slate-900 text-slate-400 border border-slate-800'
                      }`}>
                        <Shield className="w-5 h-5" />
                      </div>
                    )}
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold font-mono text-slate-100">{off.name}</span>
                        {isCurrent && (
                          <span className="text-[8.5px] bg-emerald-950 border border-emerald-900 text-emerald-400 px-1.5 py-0.2 rounded font-mono uppercase font-bold tracking-wider">
                            ON-DUTY ANDA
                          </span>
                        )}
                        {off.onDuty && !isCurrent && (
                          <span className="text-[8.5px] bg-sky-950 border border-sky-900 text-sky-400 px-1.5 py-0.2 rounded font-mono uppercase font-bold tracking-wider">
                            ON-DUTY
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-455 mt-1 font-mono flex flex-wrap items-center gap-1">
                        <span>Lencana: <span className="text-sky-400 font-bold">LSPD-{off.badgeNumber}</span></span>
                        <span className="text-slate-700">|</span>
                        <span>Pangkat: <span className="text-slate-300">{off.rank}</span></span>
                        {off.division && (
                          <>
                            <span className="text-slate-700">|</span>
                            <span className="bg-sky-500/10 text-sky-400 border border-sky-500/20 px-1.5 py-0.2 rounded text-[8.5px] font-bold tracking-wide uppercase">
                              {off.division}
                            </span>
                          </>
                        )}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <span className="text-[9px] bg-rose-500/10 text-rose-400 border border-rose-500/20 px-1.5 py-0.5 rounded font-bold font-mono tracking-wide uppercase flex items-center gap-1">
                          <FileText className="w-2.5 h-2.5 text-rose-400" />
                          {getOfficerReportCount(off.badgeNumber, off.name)} LAPORAN
                        </span>
                        <span className="text-[9.5px] text-slate-500 font-mono">
                          PIN Akses MDT: [ {canManage || isCurrent ? off.pin : '••••'} ]
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 sm:mt-0 flex items-center space-x-2 self-end sm:self-auto font-mono">
                    {off.rankLevel >= 5 ? (
                      <span className="text-[9px] font-bold text-amber-500 bg-amber-955/20 border border-amber-900/40 px-2 py-0.5 rounded uppercase">
                        High Command
                      </span>
                    ) : (
                      <span className="text-[9px] font-bold text-slate-400 bg-slate-900 border border-slate-850 px-2 py-0.5 rounded uppercase">
                        Department
                      </span>
                    )}
                    
                    {canManage && (
                      <div className="flex items-center space-x-1.5">
                        <button
                          onClick={() => {
                            setEditingOfficerBadge(off.badgeNumber);
                            setEditRank(off.rank);
                            setEditDivision(off.division || '');
                          }}
                          className="px-2 py-1 rounded transition-all cursor-pointer text-[10px] font-bold flex items-center gap-1 bg-sky-950/60 text-sky-400 hover:bg-sky-900 hover:text-sky-200 border border-sky-900/40"
                          title="Edit Pangkat & Divisi Anggota"
                        >
                          <Edit className="w-3 h-3" />
                          <span>EDIT</span>
                        </button>
                        
                        <button
                          onClick={() => handleRemove(off.badgeNumber, off.name)}
                          className={`px-2 py-1 rounded transition-all cursor-pointer text-[10px] font-bold flex items-center gap-1 ${
                            isCurrent 
                              ? 'opacity-30 cursor-not-allowed bg-slate-900 text-slate-600 border border-transparent' 
                              : 'bg-rose-950/60 text-rose-400 hover:bg-rose-900 hover:text-rose-200 border border-rose-900/40'
                          }`}
                          title="Hapus / Keluarkan Anggota dari Roster"
                          disabled={isCurrent}
                        >
                          <UserMinus className="w-3 h-3" />
                          <span>HAPUS</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: ATTENDANCE BLOCK & REGISTRATION */}
      <div className="lg:col-span-5 space-y-6">
        
        {/* ATTENDANCE TERMINAL */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 shadow-lg text-left font-mono space-y-4">
          <div className="border-b border-slate-800 pb-3 flex items-center justify-between text-emerald-400">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-5 h-5 text-emerald-450" />
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-100">ABSENSI HARIAN PETUGAS</h3>
            </div>
            <span className={`text-[9px] border px-1.5 py-0.5 rounded uppercase font-bold tracking-wider animate-pulse ${
              currentOfficer?.onDuty 
                ? 'bg-emerald-950/50 border-emerald-900 text-emerald-400' 
                : 'bg-rose-955/20 border-rose-900 text-rose-400'
            }`}>
              {currentOfficer?.onDuty ? 'ON DUTY' : 'OFF DUTY'}
            </span>
          </div>

          {/* Current Officer Info & Toggle Switch */}
          <div className="bg-slate-950 border border-slate-850 rounded p-3.5 text-xs space-y-3.5">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[9.5px] text-slate-500 uppercase font-bold">PETUGAS AKTIF:</span>
                <h4 className="text-[13px] font-bold text-slate-200 mt-0.5">{currentOfficer?.name}</h4>
                <p className="text-[10px] text-slate-450 mt-0.5">LSPD-{currentOfficer?.badgeNumber} | {currentOfficer?.rank}</p>
              </div>
              
              {/* Quick Status Light Indicator */}
              <div className="flex items-center space-x-1.5 relative py-1 pr-1">
                <span className={`w-2 h-2 rounded-full absolute ${currentOfficer?.onDuty ? 'bg-emerald-500 animate-ping' : 'bg-rose-500'}`}></span>
                <span className={`w-2 h-2 rounded-full ${currentOfficer?.onDuty ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-3.5">
                  {currentOfficer?.onDuty ? 'Siaga' : 'Selesai'}
                </span>
              </div>
            </div>

            {/* In-Duty Status Punch Button */}
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => {
                  if (currentOfficer && !currentOfficer.onDuty) {
                    toggleOfficerDuty(currentOfficer.badgeNumber);
                  }
                }}
                className={`py-2 text-[10px] font-bold rounded uppercase tracking-wider transition-all flex items-center justify-center space-x-1 cursor-pointer border ${
                  currentOfficer?.onDuty
                    ? 'bg-slate-950 text-slate-600 border-slate-900 cursor-default'
                    : 'bg-emerald-500 hover:bg-emerald-400 text-slate-955 border-emerald-600 font-extrabold shadow-md shadow-emerald-500/5'
                }`}
                disabled={currentOfficer?.onDuty}
              >
                <span>MASUK TUGAS</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  if (currentOfficer && currentOfficer.onDuty) {
                    toggleOfficerDuty(currentOfficer.badgeNumber);
                  }
                }}
                className={`py-2 text-[10px] font-bold rounded uppercase tracking-wider transition-all flex items-center justify-center space-x-1 cursor-pointer border ${
                  !currentOfficer?.onDuty
                    ? 'bg-slate-950 text-slate-600 border-slate-900 cursor-default'
                    : 'bg-rose-500 hover:bg-rose-450 text-slate-955 border-rose-600 font-extrabold shadow-md shadow-rose-500/5'
                }`}
                disabled={!currentOfficer?.onDuty}
              >
                <span>KELUAR TUGAS</span>
              </button>
            </div>
          </div>

          {/* ATTENDANCE RECORDS LIST */}
          <div className="space-y-1.5 flex flex-col h-[180px]">
            <div className="flex justify-between items-center text-[9.5px] text-slate-500 font-bold uppercase tracking-wider px-1">
              <span>RIWAYAT ABSENSI (7 HARI TERAKHIR)</span>
              <span>TOTAL: {attendanceRecords.length}</span>
            </div>

            <div className="flex-1 bg-slate-955 border border-slate-850/60 rounded p-2 overflow-y-auto space-y-1.5 pr-1 text-xs">
              {attendanceRecords.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-slate-650 italic py-10 font-sans text-[11px]">
                  <span>Belum ada riwayat absensi dalam 7 hari terakhir.</span>
                </div>
              ) : (
                attendanceRecords.map((record) => (
                  <div
                    key={record.id}
                    className="flex justify-between items-center p-2 rounded bg-slate-950/70 border border-slate-850/30 hover:border-slate-800 transition-colors"
                  >
                    <div>
                      <div className="flex items-center space-x-1.5 font-bold">
                        <span className="text-slate-200 text-[11px]">{record.name}</span>
                        <span className="text-[9.5px] text-sky-400">LSPD-{record.badgeNumber}</span>
                      </div>
                      <div className="text-[9px] text-slate-500 mt-0.5">
                        <span>Masuk: <strong className="text-slate-450 font-mono">{record.dutyOnTime}</strong></span>
                        {record.dutyOffTime && (
                          <span className="ml-2">Keluar: <strong className="text-rose-400/80 font-mono">{record.dutyOffTime}</strong></span>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      {record.status === 'DUTY' ? (
                        <span className="text-[8px] font-bold bg-emerald-950/70 border border-emerald-900 text-emerald-500 px-1.5 py-0.5 rounded uppercase">
                          ON
                        </span>
                      ) : (
                        <span className="text-[8px] font-bold bg-rose-955/20 border border-rose-950 text-rose-400 px-1.5 py-0.5 rounded uppercase">
                          OFF
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* RESET BUTTON */}
          <div className="pt-2 border-t border-slate-850/60">
            <button
              onClick={() => {
                if (!isChief) {
                  setCustomAlert({
                    title: 'AKSES DITOLAK',
                    message: 'Hanya Kepala Polisi (Chief of Police) yang diizinkan mereset absensi harian!'
                  });
                  return;
                }
                setShowResetConfirm(true);
              }}
              className={`w-full py-2 text-[10px] font-bold uppercase rounded border transition-colors flex items-center justify-center space-x-1 cursor-pointer ${
                isChief
                  ? 'bg-slate-900 text-amber-500 border-amber-900/50 hover:bg-slate-850/75'
                  : 'bg-slate-950 text-slate-600 border-slate-900 opacity-60 cursor-not-allowed'
              }`}
              disabled={!isChief}
            >
              <RefreshCw className="w-3 h-3" />
              <span>RESET ABSEN HARIAN (DAILY PURGE)</span>
            </button>
            <p className="text-[8.5px] text-slate-500 text-center mt-1.5 font-sans italic">
              {isChief 
                ? '* Sebagai Kepala Kepolisian, Anda memegang kunci reset rekapitulasi.' 
                : '* Hanya Kepala Kepolisian (Chief of Police / LSPD-01) yang berhak mereset absensi.'}
            </p>
          </div>
        </div>

        {/* Registration Form */}
        {!canManage ? (
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 shadow-lg text-left font-mono space-y-4">
            <div className="border-b border-slate-800 pb-3 flex items-center justify-between text-rose-500">
              <div className="flex items-center space-x-2">
                <Lock className="w-5 h-5 animate-pulse" />
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-205">REGISTRASI DIKUNCI</h3>
              </div>
            </div>
            
            <p className="text-xs text-slate-400 leading-relaxed font-sans">
              Penambahan, pengeditan, atau pemecatan personil di pangkalan data MDT memerlukan otorisasi tingkat tinggi. Fitur ini hanya dapat diakses oleh <span className="text-amber-500 font-bold">Chief of Police (COP)</span> atau <span className="text-amber-500 font-bold">Deputy Chief of Police (Deputi COP)</span>.
            </p>
          </div>
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 shadow-lg text-left font-mono animate-fade-in space-y-4">
            <div className="border-b border-slate-800 pb-3 flex items-center justify-between text-sky-455">
              <div className="flex items-center space-x-2">
                <PlusCircle className="w-5 h-5 text-sky-400" />
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-100">DAFTARKAN PETUGAS LSPD</h3>
              </div>
            </div>

            <form onSubmit={handleRegister} className="space-y-4 text-xs">
              {errorMsg && (
                <div className="bg-rose-955/40 border border-rose-900 text-rose-300 p-2.5 rounded font-mono text-[10px]">
                  {errorMsg}
                </div>
              )}
              
              {successMsg && (
                <div className="bg-emerald-950/60 border border-emerald-900 text-emerald-300 p-2.5 rounded font-mono text-[10px]">
                  {successMsg}
                </div>
              )}

              {/* Shield Badge Input */}
              <div className="space-y-1">
                <label className="block text-[10px] text-slate-455 uppercase font-bold">Nomor Lencana (Badge Number)</label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-slate-500 font-bold text-xs">LSPD-</span>
                  <input
                    type="text"
                    maxLength={5}
                    placeholder="25"
                    value={newBadge}
                    onChange={(e) => setNewBadge(e.target.value)}
                    className="w-full pl-15 pr-3 py-1.5 bg-slate-950 border border-slate-800 focus:border-sky-500 rounded text-sky-400 font-bold tracking-wider outline-none uppercase font-mono"
                    required
                  />
                </div>
              </div>

              {/* Officer Name Input */}
              <div className="space-y-1">
                <label className="block text-[10px] text-slate-455 uppercase font-bold">Nama Lengkap Sipil LSPD</label>
                <input
                  type="text"
                  placeholder="cth. Charles Davis"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500 p-2 text-slate-100 rounded outline-none font-mono"
                  required
                />
              </div>

              {/* Rank Select */}
              <div className="space-y-1">
                <label className="block text-[10px] text-slate-455 uppercase font-bold">Pangkat Anggota (Rank Assigned)</label>
                <select
                  value={newRank}
                  onChange={(e) => setNewRank(e.target.value as OfficerRank)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500 p-2 rounded outline-none cursor-pointer font-mono"
                  required
                >
                  <option value={OfficerRank.CADET}>Cadet (Kadet)</option>
                  <option value={OfficerRank.OFFICER}>Police Officer (Petugas)</option>
                  <option value={OfficerRank.SERGEANT}>Sergeant (Sersan)</option>
                  <option value={OfficerRank.LIEUTENANT}>Lieutenant (Letnan)</option>
                  <option value={OfficerRank.CAPTAIN}>Captain (Kapten)</option>
                  <option value={OfficerRank.COMMANDER}>Commander (Komandan)</option>
                  <option value={OfficerRank.DEPUTY_CHIEF}>Deputy Chief of Police (Deputi COP)</option>
                  <option value={OfficerRank.CHIEF}>Chief of Police (Kepala Polisi / COP)</option>
                  <option value={OfficerRank.GOVERNMENT}>Government (Pemerintah)</option>
                </select>
              </div>

              {/* Division Select */}
              <div className="space-y-1">
                <label className="block text-[10px] text-slate-455 uppercase font-bold">Divisi Departemen (Division)</label>
                <select
                  value={newDivision}
                  onChange={(e) => setNewDivision(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500 p-2 rounded outline-none cursor-pointer font-mono text-xs text-slate-100"
                >
                  <option value="">-- Tanpa Divisi (No Division) --</option>
                  <option value={OfficerDivision.PATROL_TRAFFIC}>Patrol Traffic (Patroli Lalu Lintas)</option>
                  <option value={OfficerDivision.SWAT}>SWAT (Special Weapons and Tactics)</option>
                  <option value={OfficerDivision.CIB}>Criminal Investigation Bureau (CIB / Reserse)</option>
                  <option value={OfficerDivision.INTERNAL_AFFAIRS}>Internal Affairs (IA / Investigasi Internal)</option>
                  <option value={OfficerDivision.TRD}>Training & Recruitment Division (TRD)</option>
                  <option value={OfficerDivision.PUBLIC_ADMIN}>Public Administration (Humas & Adum)</option>
                </select>
              </div>

              {/* Tautan Pas Foto / Avatar URL Input */}
              <div className="space-y-1">
                <label className="block text-[10px] text-slate-455 uppercase font-bold">Tautan Pas Foto / Avatar Petugas (URL)</label>
                <input
                  type="url"
                  placeholder="cth. https://images.unsplash.com/photo-..."
                  value={newAvatar}
                  onChange={(e) => setNewAvatar(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500 p-2 text-slate-100 rounded outline-none font-mono text-[11px]"
                />
              </div>

              {/* PIN Security code */}
              <div className="space-y-1">
                <label className="block text-[10px] text-slate-455 uppercase font-bold">PIN Akses Rahasia MDT (4-Digits PIN)</label>
                <input
                  type="password"
                  maxLength={6}
                  placeholder="cth. 2525"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500 p-2 text-slate-200 tracking-widest rounded outline-none font-bold font-mono"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full bg-sky-500 hover:bg-sky-400 text-slate-950 py-2.5 font-bold uppercase rounded flex items-center justify-center space-x-2 shrink-0 transition-colors cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>DAFTARKAN PETUGAS</span>
              </button>
            </form>
          </div>
        )}

        {/* Security Rule Warning Block */}
        <div className="bg-slate-950 border border-slate-900 rounded-lg p-4 font-mono text-left space-y-1.5">
          <div className="flex items-center space-x-1.5 text-amber-500 font-bold text-[10.5px]">
            <Lock className="w-3.5 h-3.5" />
            <span className="uppercase font-mono">PROTOKOL KEAMANAN LSPD</span>
          </div>
          <p className="text-[10px] text-slate-500 leading-relaxed font-sans text-left">
            Setiap tindakan absensi harian, registrasi, promosi, dan pemberhentian petugas LSPD dipantau dan direkam di bawah pengawasan <span className="text-amber-505 font-bold text-amber-500">MDT Pusat LSPD</span> untuk menjaga integritas kepolisian.
          </p>
        </div>

      </div>
      </div>
      ) : (
        /* LAPORAN DINAS MINGGUAN (WEEKLY ROSTER CONTROL PANEL - 7 HARI) */
        <div className="space-y-6 text-left">
          {/* Statistics Widgets */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg flex items-center justify-between shadow">
              <div>
                <span className="text-[10px] text-slate-500 uppercase block font-bold font-mono tracking-wider">TOTAL JAM DINAS TERKONTROL</span>
                <h3 className="text-2xl font-bold font-mono text-cyan-400 mt-1">{totalDutyHoursLogged} Jam</h3>
                <p className="text-[9.5px] text-slate-500 mt-1 font-sans">Waktu patroli akumulatif 7 hari terakhir</p>
              </div>
              <div className="p-3 bg-slate-950 border border-slate-850 text-cyan-400 rounded">
                <Clock className="w-5 h-5 animate-pulse" />
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg flex items-center justify-between shadow">
              <div>
                <span className="text-[10px] text-slate-500 uppercase block font-bold font-mono tracking-wider">PERSONIL MASUK DINAS (7 HARI)</span>
                <h3 className="text-2xl font-bold font-mono text-amber-500 mt-1">{activeOfficersThisMonth} Agen</h3>
                <p className="text-[9.5px] text-slate-500 mt-1 font-sans">Petugas aktif melakukan log dinas minggu ini</p>
              </div>
              <div className="p-3 bg-slate-950 border border-slate-850 text-amber-500 rounded">
                <Shield className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg flex items-center justify-between shadow">
              <div>
                <span className="text-[10px] text-slate-500 uppercase block font-bold font-mono tracking-wider">TOTAL SESI ABSENSI (7 HARI)</span>
                <h3 className="text-2xl font-bold font-mono text-emerald-400 mt-1">{attendanceRecords.length} Sesi</h3>
                <p className="text-[9.5px] text-slate-500 mt-1 font-sans">Total log masuk dan keluar patroli (7 hari)</p>
              </div>
              <div className="p-3 bg-slate-950 border border-slate-850 text-emerald-400 rounded">
                <Calendar className="w-5 h-5" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Personnel Leaderboard / Performance List (Span 5) */}
            <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-lg p-5 shadow-lg space-y-4">
              <div className="border-b border-slate-800 pb-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-widest font-mono flex items-center gap-1.5">
                  <Trophy className="w-4 h-4 text-amber-500 animate-pulse" /> KINERJA PERSONIL LSPD
                </h3>
                <div className="flex bg-slate-950 border border-slate-850 p-0.5 rounded text-[9px] font-mono">
                  <button
                    type="button"
                    onClick={() => setSortStatsBy('hours')}
                    className={`px-1.5 py-0.5 rounded cursor-pointer transition-colors ${
                      sortStatsBy === 'hours'
                        ? 'bg-sky-500/10 text-sky-400 font-bold border border-sky-550/20'
                        : 'text-slate-500 hover:text-slate-350 border border-transparent'
                    }`}
                  >
                    JAM DINAS
                  </button>
                  <button
                    type="button"
                    onClick={() => setSortStatsBy('reports')}
                    className={`px-1.5 py-0.5 rounded cursor-pointer transition-colors ${
                      sortStatsBy === 'reports'
                        ? 'bg-rose-500/10 text-rose-400 font-bold border border-rose-550/20'
                        : 'text-slate-500 hover:text-slate-350 border border-transparent'
                    }`}
                  >
                    LAPORAN
                  </button>
                </div>
              </div>

              <div className="space-y-3 overflow-y-auto max-h-[500px] pr-1">
                {officerStats.map((off, idx) => {
                  const hours = Math.floor(off.totalMinutes / 60);
                  const minutes = Math.round(off.totalMinutes % 60);
                  
                  return (
                    <div key={off.badgeNumber} className="bg-slate-950 border border-slate-850 rounded p-3 text-left space-y-2 hover:border-slate-800 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="text-[10px] font-bold font-mono text-slate-600">#{idx + 1}</span>
                          <h4 className="text-xs font-bold text-slate-100">{off.name}</h4>
                        </div>
                        <span className="text-[9px] bg-slate-900 text-sky-400 border border-slate-800 px-2 py-0.5 rounded font-mono font-bold">
                          LSPD-{off.badgeNumber}
                        </span>
                      </div>

                      <div className="flex justify-between items-center text-[10.5px]">
                        <span className="text-slate-450 font-mono text-[10px]">{off.rank}</span>
                        <div className="flex items-center gap-2 font-mono text-[10px]">
                          <span className="text-sky-400 font-bold flex items-center gap-0.5" title="Jam Dinas">
                            <Clock className="w-3 h-3 text-sky-500" />
                            {hours > 0 ? `${hours}j ${minutes}m` : `${minutes}m`}
                          </span>
                          <span className="text-slate-700">|</span>
                          <span className="text-rose-400 font-bold flex items-center gap-0.5" title="Total Laporan Dibuat">
                            <FileText className="w-3 h-3 text-rose-500" />
                            {off.reportCount} LPR
                          </span>
                        </div>
                      </div>

                      {/* Progress visual bar */}
                      <div className="w-full bg-slate-900 rounded-full h-1 my-1 overflow-hidden">
                        <div 
                          className={`h-full rounded-full bg-gradient-to-r ${
                            sortStatsBy === 'reports' 
                              ? 'from-rose-500 to-amber-500' 
                              : 'from-sky-500 to-emerald-400'
                          }`}
                          style={{ 
                            width: sortStatsBy === 'reports'
                              ? `${Math.min(100, (off.reportCount / 3) * 100)}%`
                              : `${Math.min(100, (off.totalMinutes / (10 * 60)) * 100)}%` 
                          }}
                        ></div>
                      </div>

                      <div className="flex justify-between text-[9px] text-slate-500 font-sans mt-0.5">
                        <span>Total: {off.totalSessions} Absensi</span>
                        <span>
                          {sortStatsBy === 'reports' ? 'Target: 3 Laporan/Minggu' : 'Target: 10 Jam/Minggu'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Roster Logs Auditing Sheet (Span 7) */}
            <div className="lg:col-span-7 bg-slate-900 border border-slate-805 rounded-lg overflow-hidden shadow-lg flex flex-col h-[600px]">
              {/* Header / Filter bar */}
              <div className="bg-slate-850 px-4 py-3 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left">
                <h3 className="text-xs font-bold font-mono text-slate-205 uppercase tracking-widest flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-sky-400" /> REKOD ABSENSI DETIL (LOG MINGGUAN - 7 HARI)
                </h3>

                <div className="flex items-center gap-2">
                  <select
                    value={selectedMonthFilter}
                    onChange={(e) => setSelectedMonthFilter(e.target.value as any)}
                    className="bg-slate-950 border border-slate-800 rounded text-[10px] p-1 font-bold outline-none text-slate-300 cursor-pointer"
                  >
                    <option value="all">Semua Log (7 Hari)</option>
                    <option value="current">3 Hari Terakhir</option>
                    <option value="past">4 - 7 Hari Lalu</option>
                  </select>

                  <button
                    onClick={() => {
                      setShowLogsPrintPreview(true);
                    }}
                    className="bg-sky-500 hover:bg-sky-450 text-slate-950 font-bold rounded px-2.5 py-1 text-[10.5px] cursor-pointer flex items-center gap-1 uppercase"
                  >
                    <Printer className="w-3.5 h-3.5" /> Cetak
                  </button>
                </div>
              </div>

              {/* Audit Logs Search bar */}
              <div className="p-3 bg-slate-955 border-b border-slate-900">
                <input
                  type="text"
                  placeholder="Saring log dinas berdasarkan Nama Petugas / Nomor Lencana..."
                  value={logSearchQuery}
                  onChange={(e) => setLogSearchQuery(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-850 rounded p-1.5 pl-3 text-xs text-slate-100 outline-none"
                />
              </div>

              {/* Logs List Table */}
              <div className="flex-1 overflow-y-auto" id="audit-table-print">
                {filteredLogs.length === 0 ? (
                  <div className="text-center py-20 text-slate-500 font-mono italic">
                    Tidak ada catatan dinas yang cocok dengan filter saringan Anda.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left font-mono text-[10.5px] border-collapse">
                      <thead>
                        <tr className="bg-slate-950 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-850">
                          <th className="p-3">Petugas</th>
                          <th className="p-3 text-center">Tanggal</th>
                          <th className="p-3 text-center font-bold text-emerald-400">Masuk Dinas</th>
                          <th className="p-3 text-center font-bold text-rose-450">Keluar Dinas</th>
                          <th className="p-3 text-right">Durasi Patroli</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-850/40">
                        {filteredLogs.map((rec) => {
                          const durationMins = rec.dutyOffTime ? calculateDurationMinutes(rec.dutyOnTime, rec.dutyOffTime) : 0;
                          const hrs = Math.floor(durationMins / 60);
                          const mins = Math.round(durationMins % 60);
                          
                          return (
                            <tr key={rec.id} className="hover:bg-slate-950/40 transition-colors">
                              <td className="p-3 text-left">
                                <div className="font-bold text-slate-205">{rec.name}</div>
                                <div className="text-[9px] text-slate-500 uppercase">{rec.rank} | <span className="text-sky-400 font-bold">LSPD-{rec.badgeNumber}</span></div>
                              </td>
                              <td className="p-3 text-center text-slate-400">{rec.date}</td>
                              <td className="p-3 text-center text-emerald-400 font-bold">{rec.dutyOnTime}</td>
                              <td className="p-3 text-center text-rose-450">{rec.dutyOffTime || 'SEDANG DINAS'}</td>
                              <td className="p-3 text-right text-slate-200 font-bold font-mono">
                                {rec.dutyOffTime ? (
                                  <span>{hrs > 0 ? `${hrs}j ${mins}m` : `${mins}m`}</span>
                                ) : (
                                  <span className="text-[9px] bg-emerald-950 text-emerald-400 border border-emerald-900 px-1.5 py-0.2 rounded font-mono uppercase font-bold tracking-wider animate-pulse">AKTIF</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {editingOfficerBadge && (() => {
        const targetOfficer = registeredOfficers.find(o => o.badgeNumber === editingOfficerBadge);
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 max-w-md w-full text-left font-mono space-y-4 shadow-2xl relative">
              <div className="border-b border-slate-800 pb-3 flex items-center justify-between text-sky-400">
                <div className="flex items-center space-x-2">
                  <Shield className="w-5 h-5 text-sky-400" />
                  <h3 className="text-sm font-bold uppercase tracking-widest text-slate-100">EDIT JABATAN ANGGOTA</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingOfficerBadge(null)}
                  className="text-slate-500 hover:text-slate-350 font-bold text-xs"
                >
                  ✕
                </button>
              </div>

              {targetOfficer && (
                <div className="flex items-center space-x-3.5 bg-slate-950 p-3 rounded border border-slate-850/50">
                  {targetOfficer.avatar ? (
                    <img 
                      src={targetOfficer.avatar} 
                      alt={targetOfficer.name} 
                      className="w-10 h-10 rounded object-cover border border-slate-800"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="p-2 rounded bg-slate-900 text-slate-400 border border-slate-800">
                      <Shield className="w-5 h-5" />
                    </div>
                  )}
                  <div>
                    <h4 className="text-xs font-bold text-slate-100">{targetOfficer.name}</h4>
                    <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                      Lencana: <span className="text-sky-400 font-bold">LSPD-{targetOfficer.badgeNumber}</span>
                    </p>
                  </div>
                </div>
              )}

              <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
                {/* Rank Select */}
                <div className="space-y-1">
                  <label className="block text-[10px] text-slate-455 uppercase font-bold">Pangkat Anggota (Rank Assigned)</label>
                  <select
                    value={editRank}
                    onChange={(e) => setEditRank(e.target.value as OfficerRank)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500 p-2 rounded outline-none cursor-pointer font-mono"
                    required
                  >
                    <option value={OfficerRank.CADET}>Cadet (Kadet)</option>
                    <option value={OfficerRank.OFFICER}>Police Officer (Petugas)</option>
                    <option value={OfficerRank.SERGEANT}>Sergeant (Sersan)</option>
                    <option value={OfficerRank.LIEUTENANT}>Lieutenant (Letnan)</option>
                    <option value={OfficerRank.CAPTAIN}>Captain (Kapten)</option>
                    <option value={OfficerRank.COMMANDER}>Commander (Komandan)</option>
                    <option value={OfficerRank.DEPUTY_CHIEF}>Deputy Chief of Police (Deputi COP)</option>
                    <option value={OfficerRank.CHIEF}>Chief of Police (Kepala Polisi / COP)</option>
                    <option value={OfficerRank.GOVERNMENT}>Government (Pemerintah)</option>
                  </select>
                </div>

                {/* Division Select */}
                <div className="space-y-1">
                  <label className="block text-[10px] text-slate-455 uppercase font-bold">Divisi Departemen (Division)</label>
                  <select
                    value={editDivision}
                    onChange={(e) => setEditDivision(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500 p-2 rounded outline-none cursor-pointer font-mono text-xs text-slate-100"
                  >
                    <option value="">-- Tanpa Divisi (No Division) --</option>
                    <option value={OfficerDivision.PATROL_TRAFFIC}>Patrol Traffic (Patroli Lalu Lintas)</option>
                    <option value={OfficerDivision.SWAT}>SWAT (Special Weapons and Tactics)</option>
                    <option value={OfficerDivision.CIB}>Criminal Investigation Bureau (CIB / Reserse)</option>
                    <option value={OfficerDivision.INTERNAL_AFFAIRS}>Internal Affairs (IA / Investigasi Internal)</option>
                    <option value={OfficerDivision.TRD}>Training & Recruitment Division (TRD)</option>
                    <option value={OfficerDivision.PUBLIC_ADMIN}>Public Administration (Humas & Adum)</option>
                  </select>
                </div>

                <div className="flex space-x-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditingOfficerBadge(null)}
                    className="flex-1 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-400 py-2.5 font-bold uppercase rounded transition-colors cursor-pointer text-center"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-sky-500 hover:bg-sky-400 text-slate-955 py-2.5 font-bold uppercase rounded flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Simpan</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}

      {/* SEKSI UNTUK CETAK LOG ABSENSI SECARA NYATA (HANYA MUNCUL SAAT PRINT) */}
      {createPortal(
        <div className="printable-area hidden print:block text-black bg-white p-8 font-mono text-xs leading-relaxed">
          {/* Header LSPD dengan Stempel Waktu */}
          <div className="border-b-4 border-double border-black pb-4 mb-5">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <img src={lspdLogo} alt="LSPD Emblem" className="w-16 h-16 object-contain border border-black rounded p-0.5" referrerPolicy="no-referrer" />
                <div className="text-left">
                  <h1 className="text-lg font-black tracking-wider uppercase text-black font-mono">LOS SANTOS POLICE DEPARTMENT</h1>
                  <p className="text-[10px] uppercase font-bold text-black font-mono">SISTEM INTEGRASI REKOR KEPOLISIAN - MOBILE DATA TERMINAL</p>
                  <p className="text-[8.5px] text-gray-700 font-bold uppercase tracking-wide">DIVISI SUMBER DAYA MANUSIA & LOGISTIK PATROLI RESMI</p>
                </div>
              </div>
              <div className="text-right border border-black p-2 bg-gray-50 rounded min-w-[210px] font-mono">
                <div className="text-[8px] uppercase font-bold text-gray-600">STEMPEL WAKTU CETAK DOKUMEN</div>
                <div className="text-[10px] font-black text-black">{new Date().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'medium' })}</div>
                <div className="text-[7.5px] text-gray-500 mt-0.5">STATUS: RESMI • DOKUMEN INTERNAL</div>
              </div>
            </div>
          </div>

          <div className="text-center mb-5 border-b border-black pb-3">
            <h2 className="text-xs font-black underline uppercase tracking-widest text-black font-mono">
              REKAPITULASI ABSENSI & LAPORAN MINGGUAN PATROLI PETUGAS
            </h2>
            <div className="flex items-center justify-center gap-4 text-[9.5px] text-gray-700 font-mono mt-1 font-semibold">
              <span>PERIODE: <strong className="text-black">{selectedMonthFilter === 'all' ? 'Semua Log (7 Hari Terakhir)' : selectedMonthFilter === 'current' ? '3 Hari Terakhir' : '4 - 7 Hari Lalu'}</strong></span>
              <span>•</span>
              <span>TOTAL REKOR: <strong className="text-black">{filteredLogs.length} Entri</strong></span>
              <span>•</span>
              <span>KLASIFIKASI: <strong className="text-black">LAPORAN BERKALA DINAS LSPD</strong></span>
            </div>
          </div>

          <table className="w-full text-[10px] border-collapse border border-black text-left mb-6">
            <thead>
              <tr className="bg-gray-100 text-black border-b border-black font-bold uppercase">
                <th className="border border-black p-2">Petugas / Lencana</th>
                <th className="border border-black p-2 text-center">Tanggal</th>
                <th className="border border-black p-2 text-center text-emerald-700 font-bold">Masuk Dinas</th>
                <th className="border border-black p-2 text-center text-rose-700 font-bold">Keluar Dinas</th>
                <th className="border border-black p-2 text-right">Durasi Patroli</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((rec) => {
                const durationMins = rec.dutyOffTime ? calculateDurationMinutes(rec.dutyOnTime, rec.dutyOffTime) : 0;
                const hrs = Math.floor(durationMins / 60);
                const mins = Math.round(durationMins % 60);
                
                return (
                  <tr key={rec.id} className="border-b border-black">
                    <td className="border border-black p-2">
                      <div className="font-bold text-black">{rec.name}</div>
                      <div className="text-[8.5px] text-gray-700 font-mono">LSPD-{rec.badgeNumber} | {rec.rank}</div>
                    </td>
                    <td className="border border-black p-2 text-center font-mono">{rec.date}</td>
                    <td className="border border-black p-2 text-center text-emerald-700 font-bold font-mono">{rec.dutyOnTime}</td>
                    <td className="border border-black p-2 text-center text-rose-700 font-mono">{rec.dutyOffTime || 'SEDANG DINAS'}</td>
                    <td className="border border-black p-2 text-right font-bold font-mono">
                      {rec.dutyOffTime ? `${hrs > 0 ? `${hrs}j ${mins}m` : `${mins}m`}` : 'AKTIF'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Garis Tanda Tangan untuk Petugas Pelaporan */}
          <div className="mt-8 pt-4 grid grid-cols-2 gap-8 text-center avoid-break">
            <div className="border border-black p-3.5 bg-gray-50/60 rounded flex flex-col justify-between">
              <div>
                <p className="text-black uppercase font-bold text-[9px] tracking-wider font-mono">PETUGAS PELAPOR / PENANGGUNG JAWAB</p>
                <p className="text-[8px] text-gray-600 italic mt-0.5">Memverifikasi keabsahan data jam dinas patroli</p>
              </div>
              <div className="my-8">
                <div className="w-48 mx-auto border-b-2 border-black"></div>
              </div>
              <div>
                <p className="font-black uppercase text-[11px] text-black font-mono">{currentOfficer?.name || 'ADMIN LSPD'}</p>
                <p className="text-[9px] text-gray-800 font-mono font-bold">PERWIRA PENGAWAS HARIAN</p>
                <p className="text-[8.5px] text-gray-650 font-mono">LENCANA: LSPD-{currentOfficer?.badgeNumber} • TGL: {new Date().toLocaleDateString('id-ID', { dateStyle: 'long' })}</p>
              </div>
            </div>

            <div className="border border-black p-3.5 bg-gray-50/60 rounded flex flex-col justify-between">
              <div>
                <p className="text-black uppercase font-bold text-[9px] tracking-wider font-mono">DIVISI ADMINISTRASI & ROSTER LSPD</p>
                <p className="text-[8px] text-gray-600 italic mt-0.5">Pengesahan arsip internal kepolisian</p>
              </div>
              <div className="my-8">
                <div className="w-48 mx-auto border-b-2 border-black"></div>
              </div>
              <div>
                <p className="font-black uppercase text-[11px] text-black font-mono">LOS SANTOS POLICE DEPT</p>
                <p className="text-[9px] text-gray-800 font-mono font-bold">HUMAN RESOURCES & PAYROLL DIVISION</p>
                <p className="text-[8.5px] text-gray-650 font-mono">STATUS: VALIDASI OTOMATIS MDT CORE</p>
              </div>
            </div>
          </div>

          {/* Bagian Disclaimer di Bagian Bawah untuk Pencatatan Resmi */}
          <div className="mt-6 border-2 border-black p-3.5 bg-gray-100 rounded text-black text-[8.5px] leading-relaxed text-justify avoid-break font-sans">
            <div className="font-bold uppercase tracking-wider text-[9px] font-mono border-b border-black pb-1 mb-1.5 flex items-center justify-between">
              <span>DISCLAIMER & KLAUSUL HUKUM PENCATATAN RESMI (OFFICIAL RECORD NOTICE)</span>
              <span className="font-mono text-[8px] text-gray-600">REF: MDT-LSPD-ATT-DOC</span>
            </div>
            <p className="mb-1 text-gray-900">
              <strong>1. KEKUATAN HUKUM:</strong> Dokumen Rekapitulasi Absensi dan Log Patroli Mingguan ini diterbitkan secara sah dan tersinkronisasi langsung dengan pangkalan data Mobile Data Terminal (MDT) Kepolisian Kota Los Santos. Seluruh jam tugas dan penugasan merupakan catatan resmi kedinasan.
            </p>
            <p className="mb-1 text-gray-900">
              <strong>2. LARANGAN PEMALSUAN:</strong> Dilarang keras memanipulasi, mengubah, atau menduplikasi berkas absensi tanpa wewenang tertulis dari High Command / Chief of Police. Pelanggaran terhadap integritas absensi kedinasan akan dikenakan sanksi kode etik disiplin dan pencabutan lencana.
            </p>
            <p className="text-gray-900">
              <strong>3. PENCATATAN SISTEM:</strong> Rekaman patroli ini tersimpan permanen di basis data LSPD sebagai instrumen audit kedisiplinan dan perhitungan insentif operasional.
            </p>
            <div className="border-t border-gray-400 mt-1.5 pt-1 text-[7.5px] text-gray-600 font-mono flex justify-between">
              <span>KODE INTEGRITAS ELEKTRONIK: MDT-LSPD-ROSTER-VERIFIED</span>
              <span>DOKUMEN RESMI KEPOLISIAN KOTA LOS SANTOS</span>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* MODAL KONFIRMASI HAPUS ANGGOTA */}
      {officerToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 max-w-sm w-full text-left font-mono space-y-4 shadow-2xl">
            <div className="text-rose-500 flex items-center space-x-2 border-b border-slate-800 pb-2.5">
              <UserMinus className="w-5 h-5" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-rose-450">PEMBERHENTIAN ANGGOTA</h4>
            </div>
            <p className="text-xs text-slate-350 leading-relaxed">
              Apakah Anda yakin ingin menghapus/memensiunkan petugas <span className="text-rose-400 font-bold">LSPD-{officerToDelete.badge} ({officerToDelete.name})</span>?
              Mereka tidak akan dapat mengakses MDTerminal lagi.
            </p>
            <div className="flex space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setOfficerToDelete(null)}
                className="flex-1 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-400 py-2 font-bold uppercase rounded text-[11px] cursor-pointer text-center"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  removeOfficer(officerToDelete.badge);
                  setOfficerToDelete(null);
                }}
                className="flex-1 bg-rose-600 hover:bg-rose-500 text-white py-2 font-bold uppercase rounded text-[11px] cursor-pointer text-center"
              >
                Hapus Anggota
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL KONFIRMASI RESET ABSENSI */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 max-w-sm w-full text-left font-mono space-y-4 shadow-2xl">
            <div className="text-amber-500 flex items-center space-x-2 border-b border-slate-800 pb-2.5">
              <RefreshCw className="w-5 h-5 animate-spin" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-450">RESET REKAP ABSENSI</h4>
            </div>
            <p className="text-xs text-slate-350 leading-relaxed">
              <span className="text-amber-400 font-bold">PERINGATAN PROTOKOL LSPD:</span> Apakah Anda yakin ingin melakukan <span className="text-red-400 font-bold">RESET HARIAN</span> pada semua lembaran absen LSPD? Semua data hari ini akan dihapus secara permanen.
            </p>
            <div className="flex space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-400 py-2 font-bold uppercase rounded text-[11px] cursor-pointer text-center"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  resetAttendance();
                  setShowResetConfirm(false);
                }}
                className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-950 py-2 font-bold uppercase rounded text-[11px] cursor-pointer text-center"
              >
                RESET SEKARANG
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CUSTOM ALERT */}
      {customAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 max-w-sm w-full text-left font-mono space-y-4 shadow-2xl">
            <div className="text-sky-400 flex items-center space-x-2 border-b border-slate-800 pb-2.5">
              <Shield className="w-5 h-5" />
              <h4 className="text-xs font-bold uppercase tracking-wider">{customAlert.title}</h4>
            </div>
            <p className="text-xs text-slate-350 leading-relaxed">
              {customAlert.message}
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setCustomAlert(null)}
                className="w-full bg-sky-500 hover:bg-sky-400 text-slate-950 py-2 font-bold uppercase rounded text-[11px] cursor-pointer text-center"
              >
                Mengerti
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SCREEN MODAL FOR MONTHLY PATROL LOG PRINT PREVIEW */}
      {showLogsPrintPreview && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/90 backdrop-blur-md p-4 overflow-y-auto print:hidden">
          {/* Top Control Bar */}
          <div className="bg-slate-900 border border-slate-800 rounded-t-lg p-4 w-full max-w-3xl flex flex-wrap items-center justify-between gap-3 shadow-xl text-left font-mono">
            <div className="flex items-center space-x-2">
              <Printer className="w-5 h-5 text-sky-400 animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-100">Pratinjau Absensi LSPD</span>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={async () => {
                  const logRows = filteredLogs.map((rec) => {
                    const durationSecs = rec.dutyOffTime ? calculateDurationMinutes(rec.dutyOnTime, rec.dutyOffTime) : 0;
                    const hrs = Math.floor(durationSecs / 60);
                    const mins = Math.floor(durationSecs % 60);
                    const durationStr = rec.dutyOffTime ? `${hrs}j ${mins}m` : 'SEDANG DINAS';
                    return `LSPD-${rec.badgeNumber} | ${rec.name.padEnd(20)} | ${rec.date} | ${rec.dutyOnTime.padEnd(8)} - ${(rec.dutyOffTime || 'SEDANG').padEnd(8)} | Durasi: ${durationStr}`;
                  }).join('\n');
                  const text = `=== LOS SANTOS POLICE DEPARTMENT ===\nLAPORAN ABSENSI & LOG PATROLI PETUGAS LSPD\n\nPeriode: ${selectedMonthFilter === 'all' ? 'Semua Log (7 Hari)' : selectedMonthFilter === 'current' ? '3 Hari Terakhir' : '4 - 7 Hari Lalu'}\nTanggal Ekspor: ${new Date().toLocaleDateString('id-ID')}\n\nREKAP LOG ABSENSI PETUGAS:\n-------------------------------------------------------------\n${logRows}\n-------------------------------------------------------------\nLOS SANTOS POLICE DEPARTMENT SECURITY UTILITY`;
                  
                  const copied = await copyToClipboard(text);
                  if (copied) {
                    setCopiedLogsSuccess(true);
                    setTimeout(() => setCopiedLogsSuccess(false), 2000);
                  } else {
                    setManualCopyLogsText(text);
                  }
                }}
                className="bg-sky-600 hover:bg-sky-550 text-slate-950 font-bold text-xs px-3.5 py-2 rounded cursor-pointer flex items-center gap-1.5 transition-colors uppercase"
              >
                {copiedLogsSuccess ? '✅ BERHASIL DISALIN!' : '📋 SALIN LOG (DISCORD)'}
              </button>
              
              <button
                onClick={() => {
                  try {
                    window.print();
                  } catch (e) {
                    console.error("Print blocked", e);
                  }
                }}
                className="bg-emerald-600 hover:bg-emerald-550 text-white font-bold text-xs px-3.5 py-2 rounded cursor-pointer flex items-center gap-1.5 transition-colors uppercase"
              >
                <Printer className="w-3.5 h-3.5" />
                Cetak Fisik
              </button>
              
              <button
                onClick={() => setShowLogsPrintPreview(false)}
                className="bg-slate-850 hover:bg-slate-800 border border-slate-700 text-slate-300 font-bold text-xs px-3 py-2 rounded cursor-pointer flex items-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Guide Note */}
          <div className="bg-slate-900 border-x border-slate-850 p-2.5 text-[10px] text-amber-400 font-mono text-center w-full max-w-3xl">
            💡 <span className="font-bold text-amber-450">PEMBERITAHUAN:</span> Jika printer fisik tidak merespon di dalam frame, silakan klik tombol <span className="underline">"Open in New Tab"</span> di pojok kanan atas MDT Anda untuk membuka mode cetak langsung.
          </div>

          {/* Simulated A4 Sheet */}
          <div className="bg-white text-black p-6 sm:p-8 font-mono text-[11px] leading-relaxed w-full max-w-3xl h-[65vh] overflow-y-auto shadow-2xl border-x border-b border-slate-800 text-left">
            {/* Header Kepolisian LSPD dengan Logo & Stempel Waktu */}
            <div className="border-b-4 border-double border-black pb-4 mb-5">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <img src={lspdLogo} alt="LSPD Emblem" className="w-16 h-16 object-contain border border-black rounded p-0.5 shrink-0" referrerPolicy="no-referrer" />
                  <div className="text-left">
                    <h1 className="text-base sm:text-lg font-black tracking-wider uppercase text-black font-mono">LOS SANTOS POLICE DEPARTMENT</h1>
                    <p className="text-[10px] uppercase font-bold text-black font-mono">SISTEM INTEGRASI REKOR KEPOLISIAN - MOBILE DATA TERMINAL</p>
                    <p className="text-[8.5px] text-gray-700 font-bold uppercase tracking-wide">DIVISI SUMBER DAYA MANUSIA & LOGISTIK PATROLI RESMI</p>
                  </div>
                </div>
                <div className="text-right border border-black p-2 bg-gray-50 rounded min-w-[210px] font-mono self-stretch sm:self-auto">
                  <div className="text-[8px] uppercase font-bold text-gray-600">STEMPEL WAKTU CETAK DOKUMEN</div>
                  <div className="text-[10px] font-black text-black">{new Date().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'medium' })}</div>
                  <div className="text-[7.5px] text-gray-500 mt-0.5">STATUS: RESMI • DOKUMEN INTERNAL</div>
                </div>
              </div>
            </div>

            <div className="text-center mb-5 border-b border-black pb-3">
              <h2 className="text-xs font-black underline uppercase tracking-widest text-black font-mono">
                REKAPITULASI ABSENSI & LAPORAN MINGGUAN PATROLI PETUGAS
              </h2>
              <div className="flex flex-wrap items-center justify-center gap-3 text-[9.5px] text-gray-700 font-mono mt-1 font-semibold">
                <span>PERIODE: <strong className="text-black">{selectedMonthFilter === 'all' ? 'Semua Log (7 Hari Terakhir)' : selectedMonthFilter === 'current' ? '3 Hari Terakhir' : '4 - 7 Hari Lalu'}</strong></span>
                <span>•</span>
                <span>TOTAL REKOR: <strong className="text-black">{filteredLogs.length} Entri</strong></span>
                <span>•</span>
                <span>KLASIFIKASI: <strong className="text-black">LAPORAN BERKALA DINAS LSPD</strong></span>
              </div>
            </div>

            {/* Recalculating totals of shown log */}
            <table className="w-full text-[10px] border-collapse border border-black text-left mb-6">
              <thead>
                <tr className="bg-gray-100 text-black border-b border-black font-bold uppercase">
                  <th className="border border-black p-2 text-black">Petugas / Lencana</th>
                  <th className="border border-black p-2 text-center text-black">Tanggal</th>
                  <th className="border border-black p-2 text-center text-emerald-700 font-bold">Masuk Dinas</th>
                  <th className="border border-black p-2 text-center text-rose-700 font-bold">Keluar Dinas</th>
                  <th className="border border-black p-2 text-right text-black">Durasi Kerja</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="border border-black p-4 text-center italic text-gray-500">
                      Tidak ada catatan absensi dalam filter saat ini.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((rec) => {
                    const durationSecs = rec.dutyOffTime ? calculateDurationMinutes(rec.dutyOnTime, rec.dutyOffTime) : 0;
                    const hrs = Math.floor(durationSecs / 60);
                    const mins = Math.floor(durationSecs % 60);
                    return (
                      <tr key={rec.id} className="border-b border-black">
                        <td className="border border-black p-2">
                          <div className="font-bold text-black">{rec.name}</div>
                          <div className="text-[8.5px] text-gray-700 font-mono">LSPD-{rec.badgeNumber} | {rec.rank}</div>
                        </td>
                        <td className="border border-black p-2 text-center text-black font-mono">{rec.date}</td>
                        <td className="border border-black p-2 text-center text-emerald-700 font-bold font-mono">{rec.dutyOnTime}</td>
                        <td className="border border-black p-2 text-center text-rose-700 font-mono">{rec.dutyOffTime || 'SEDANG DINAS'}</td>
                        <td className="border border-black p-2 text-right font-bold text-black font-mono">
                          {rec.dutyOffTime ? `${hrs > 0 ? `${hrs}j ${mins}m` : `${mins}m`}` : 'AKTIF'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>

            {/* Garis Tanda Tangan untuk Petugas Pelaporan */}
            <div className="mt-8 pt-4 grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8 text-center avoid-break">
              <div className="border border-black p-3.5 bg-gray-50/60 rounded flex flex-col justify-between">
                <div>
                  <p className="text-black uppercase font-bold text-[9px] tracking-wider font-mono">PETUGAS PELAPOR / PENANGGUNG JAWAB</p>
                  <p className="text-[8px] text-gray-600 italic mt-0.5">Memverifikasi keabsahan data jam dinas patroli</p>
                </div>
                <div className="my-8">
                  <div className="w-48 mx-auto border-b-2 border-black"></div>
                </div>
                <div>
                  <p className="font-black uppercase text-[11px] text-black font-mono">{currentOfficer?.name || 'ADMIN LSPD'}</p>
                  <p className="text-[9px] text-gray-800 font-mono font-bold">PERWIRA PENGAWAS HARIAN</p>
                  <p className="text-[8.5px] text-gray-650 font-mono">LENCANA: LSPD-{currentOfficer?.badgeNumber} • TGL: {new Date().toLocaleDateString('id-ID', { dateStyle: 'long' })}</p>
                </div>
              </div>

              <div className="border border-black p-3.5 bg-gray-50/60 rounded flex flex-col justify-between">
                <div>
                  <p className="text-black uppercase font-bold text-[9px] tracking-wider font-mono">DIVISI ADMINISTRASI & ROSTER LSPD</p>
                  <p className="text-[8px] text-gray-600 italic mt-0.5">Pengesahan arsip internal kepolisian</p>
                </div>
                <div className="my-8">
                  <div className="w-48 mx-auto border-b-2 border-black"></div>
                </div>
                <div>
                  <p className="font-black uppercase text-[11px] text-black font-mono">LOS SANTOS POLICE DEPT</p>
                  <p className="text-[9px] text-gray-800 font-mono font-bold">HUMAN RESOURCES & PAYROLL DIVISION</p>
                  <p className="text-[8.5px] text-gray-650 font-mono">STATUS: VALIDASI OTOMATIS MDT CORE</p>
                </div>
              </div>
            </div>

            {/* Bagian Disclaimer di Bagian Bawah untuk Pencatatan Resmi */}
            <div className="mt-6 border-2 border-black p-3.5 bg-gray-100 rounded text-black text-[8.5px] leading-relaxed text-justify avoid-break font-sans">
              <div className="font-bold uppercase tracking-wider text-[9px] font-mono border-b border-black pb-1 mb-1.5 flex items-center justify-between">
                <span>DISCLAIMER & KLAUSUL HUKUM PENCATATAN RESMI (OFFICIAL RECORD NOTICE)</span>
                <span className="font-mono text-[8px] text-gray-600">REF: MDT-LSPD-ATT-DOC</span>
              </div>
              <p className="mb-1 text-gray-900">
                <strong>1. KEKUATAN HUKUM:</strong> Dokumen Rekapitulasi Absensi dan Log Patroli Mingguan ini diterbitkan secara sah dan tersinkronisasi langsung dengan pangkalan data Mobile Data Terminal (MDT) Kepolisian Kota Los Santos. Seluruh jam tugas dan penugasan merupakan catatan resmi kedinasan.
              </p>
              <p className="mb-1 text-gray-900">
                <strong>2. LARANGAN PEMALSUAN:</strong> Dilarang keras memanipulasi, mengubah, atau menduplikasi berkas absensi tanpa wewenang tertulis dari High Command / Chief of Police. Pelanggaran terhadap integritas absensi kedinasan akan dikenakan sanksi kode etik disiplin dan pencabutan lencana.
              </p>
              <p className="text-gray-900">
                <strong>3. PENCATATAN SISTEM:</strong> Rekaman patroli ini tersimpan permanen di basis data LSPD sebagai instrumen audit kedisiplinan dan perhitungan insentif operasional.
              </p>
              <div className="border-t border-gray-400 mt-1.5 pt-1 text-[7.5px] text-gray-600 font-mono flex justify-between">
                <span>KODE INTEGRITAS ELEKTRONIK: MDT-LSPD-ROSTER-VERIFIED</span>
                <span>DOKUMEN RESMI KEPOLISIAN KOTA LOS SANTOS</span>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Fallback manual copy dialog if clipboard write is blocked */}
      {manualCopyLogsText && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 print:hidden">
          <div className="bg-slate-900 border border-slate-700 rounded-lg p-5 max-w-xl w-full shadow-2xl space-y-4 text-left font-mono">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-400" />
                Salin Log Petugas Manual (Akses Clipboard Dibatasi)
              </h3>
              <button
                type="button"
                onClick={() => setManualCopyLogsText(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-300">
              Izin clipboard otomatis dibatasi oleh frame peramban. Silakan klik teks di bawah (sudah otomatis terpilih) lalu tekan <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-sky-400 text-[11px]">Ctrl + C</kbd> atau <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-sky-400 text-[11px]">Cmd + C</kbd> untuk menyalin:
            </p>
            <textarea
              readOnly
              value={manualCopyLogsText}
              onFocus={(e) => e.currentTarget.select()}
              autoFocus
              className="w-full h-44 bg-slate-950 border border-slate-800 rounded p-3 text-xs text-slate-200 resize-none focus:outline-none focus:border-sky-500 select-all"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setManualCopyLogsText(null)}
                className="bg-sky-600 hover:bg-sky-500 text-slate-950 font-bold text-xs px-4 py-1.5 rounded"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
