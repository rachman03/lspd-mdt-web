import React, { useState, useEffect } from 'react';
import { useMdt } from '../context/MdtContext';
import { Shield, Users, Siren, FileText, AlertTriangle, PlusCircle, CheckCircle, ShieldAlert, Timer, UserX, MessageSquare, ExternalLink, Car, Scale, Edit, Camera, X, Radio, Target, GraduationCap, Megaphone, Search, Trophy, Award, Clock, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Detainee, DispatchCall, OfficerRank, OfficerDivision } from '../types';
import lspdTacticalBanner from '../assets/images/lspd_tactical_banner_1784039135073.jpg';

interface DashboardProps {
  setActiveTab: (tab: string) => void;
  setSelectedCitizenId: (id: string | null) => void;
  setEditingReportId: (id: string | null) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ setActiveTab, setSelectedCitizenId, setEditingReportId }) => {
  const {
    currentOfficer,
    citizens,
    vehicles,
    reports,
    detainees,
    dispatchCalls,
    addDispatchCall,
    updateDispatchCall,
    respondToDispatch,
    updateDetaineeStatus,
    releaseDetainee,
    registeredOfficers,
    updateOfficerDivision,
  } = useMdt();

  const isGovernment = currentOfficer?.rank === OfficerRank.GOVERNMENT;

  // New Dispatch Form state
  const [showDispatchForm, setShowDispatchForm] = useState(false);
  const [newDiscTitle, setNewDiscTitle] = useState('');
  const [newDiscLocation, setNewDiscLocation] = useState('');
  const [newDiscDesc, setNewDiscDesc] = useState('');
  const [newDiscPriority, setNewDiscPriority] = useState<'Rendah' | 'Sedang' | 'Tinggi' | 'Kritis'>('Sedang');

  // Change Cell Number modal/state
  const [editingCellDetId, setEditingCellDetId] = useState<string | null>(null);
  const [newCellNum, setNewCellNum] = useState('');

  // Limits and filters for incidents and detainees to prevent infinite scrolling
  const [dispatchSearchQuery, setDispatchSearchQuery] = useState('');
  const [dispatchFilterStatus, setDispatchFilterStatus] = useState<string>('Semua');
  const [dispatchFilterPriority, setDispatchFilterPriority] = useState<string>('Semua');
  const [dispatchLimit, setDispatchLimit] = useState<number>(5);

  const [detaineeSearchQuery, setDetaineeSearchQuery] = useState('');
  const [detaineeFilterStatus, setDetaineeFilterStatus] = useState<string>('Semua');
  const [detaineeLimit, setDetaineeLimit] = useState<number>(5);

  // Real-time monitoring board mode: 'reports' | 'detainees'
  const [monitoringMode, setMonitoringMode] = useState<'reports' | 'detainees'>('reports');
  const [reportSearchQuery, setReportSearchQuery] = useState('');
  const [reportFilterStatus, setReportFilterStatus] = useState<string>('Semua');
  const [reportLimit, setReportLimit] = useState<number>(5);

  // Listen for real-time report creations across modules/tabs to auto-focus monitoring board
  useEffect(() => {
    const handleReportCreated = () => {
      setMonitoringMode('reports');
      setReportFilterStatus('Semua');
      setReportSearchQuery('');
    };
    window.addEventListener('lspd_report_created', handleReportCreated);
    return () => window.removeEventListener('lspd_report_created', handleReportCreated);
  }, []);

  // Filter and sort reports chronologically (newest first, highest sequential ID first)
  const filteredReports = reports.filter((rep) => {
    const query = reportSearchQuery.trim().toLowerCase();
    const matchesSearch = !query ||
      rep.id.toLowerCase().includes(query) ||
      rep.title.toLowerCase().includes(query) ||
      rep.suspectName.toLowerCase().includes(query) ||
      rep.officerName.toLowerCase().includes(query) ||
      (rep.reporterName && rep.reporterName.toLowerCase().includes(query));

    const matchesStatus = reportFilterStatus === 'Semua' || rep.status === reportFilterStatus;
    return matchesSearch && matchesStatus;
  });

  const sortedReports = [...filteredReports].sort((a, b) => {
    const timeA = new Date(a.date).getTime();
    const timeB = new Date(b.date).getTime();
    if (!isNaN(timeA) && !isNaN(timeB) && timeB !== timeA) {
      return timeB - timeA;
    }
    return b.id.localeCompare(a.id, undefined, { numeric: true });
  });

  const limitedReports = reportLimit === 0 ? sortedReports : sortedReports.slice(0, reportLimit);

  // Filter detainees
  const filteredDetainees = detainees.filter((det) => {
    const query = detaineeSearchQuery.trim().toLowerCase();
    const matchesSearch = !query || 
      det.citizenName.toLowerCase().includes(query) || 
      det.id.toLowerCase().includes(query) ||
      det.cellNumber.toLowerCase().includes(query) ||
      det.arrestingOfficer.toLowerCase().includes(query);
    
    const matchesStatus = detaineeFilterStatus === 'Semua' || 
      (detaineeFilterStatus === 'Bebas' && (det.status === 'Bebas' || det.remainingTime === 0)) ||
      (det.status === detaineeFilterStatus && det.remainingTime > 0);
      
    return matchesSearch && matchesStatus;
  });
  const limitedDetainees = detaineeLimit === 0 ? filteredDetainees : filteredDetainees.slice(0, detaineeLimit);

  // Filter dispatch
  const filteredDispatchCalls = dispatchCalls.filter((call) => {
    const query = dispatchSearchQuery.trim().toLowerCase();
    const matchesSearch = !query ||
      call.title.toLowerCase().includes(query) ||
      call.description.toLowerCase().includes(query) ||
      call.location.toLowerCase().includes(query) ||
      call.id.toLowerCase().includes(query);
      
    const matchesStatus = dispatchFilterStatus === 'Semua' || call.status === dispatchFilterStatus;
    const matchesPriority = dispatchFilterPriority === 'Semua' || call.priority === dispatchFilterPriority;
    return matchesSearch && matchesStatus && matchesPriority;
  });
  const limitedDispatchCalls = dispatchLimit === 0 ? filteredDispatchCalls : filteredDispatchCalls.slice(0, dispatchLimit);

  // Count wanted citizens
  const wantedCount = citizens.filter((c) => c.isWanted).length;
  // Count stolen vehicles
  const stolenCount = vehicles.filter((v) => v.isStolen).length;
  // Active dispatch count
  const activeDispatchCount = dispatchCalls.filter((d) => d.status !== 'Selesai').length;

  const handleCreateDispatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDiscTitle.trim() || !newDiscLocation.trim() || !newDiscDesc.trim()) return;

    addDispatchCall({
      title: newDiscTitle,
      location: newDiscLocation,
      description: newDiscDesc,
      priority: newDiscPriority,
    });

    setNewDiscTitle('');
    setNewDiscLocation('');
    setNewDiscDesc('');
    setNewDiscPriority('Sedang');
    setShowDispatchForm(false);
  };

  const handleEditCellSubmit = (detId: string) => {
    if (!newCellNum.trim()) return;
    updateDetaineeStatus(detId, 'Dalam Sel', newCellNum);
    setEditingCellDetId(null);
    setNewCellNum('');
  };

  const wantedCitizens = citizens.filter((c) => c.isWanted);
  const stolenVehicles = vehicles.filter((v) => v.isStolen);

  return (
    <div className="space-y-6">
      {/* 1. IMMERSIVE LSPD GREETING & RADAR STATUS BAR */}
      <div className="border border-slate-800 rounded-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-lg shadow-black/20 relative overflow-hidden min-h-[120px] p-6">
        {/* Cinematic Background Banner */}
        <div className="absolute inset-0 z-0">
          <img 
            src={lspdTacticalBanner} 
            alt="LSPD Operations" 
            className="w-full h-full object-cover brightness-[0.25] contrast-[1.1] scale-105"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 to-transparent"></div>
        </div>

        <div className="flex items-center space-x-4 relative z-10">
          <div className="p-3.5 bg-sky-500/10 border border-sky-500/30 rounded-lg text-sky-400 shadow shadow-sky-500/10 backdrop-blur-sm">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h2 className="text-sm font-extrabold font-mono text-white flex flex-wrap items-center gap-2">
              DASHBOARD SENTRAL OPERASI LSPD <span className="text-[9px] bg-sky-500/20 text-sky-400 border border-sky-500/30 px-2 py-0.5 rounded uppercase font-bold tracking-wider">MDT v3.5-Active</span>
            </h2>
            <p className="text-[11.5px] text-slate-300 mt-1 leading-relaxed max-w-2xl">
              Selamat bertugas, <span className="text-sky-300 font-bold">{currentOfficer?.rank} {currentOfficer?.name}</span>. Seluruh log akses, intelijen warga, arsip insiden, dan penindakan tersinkronisasi langsung ke database terpusat kepolisian.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 font-mono text-[10px] relative z-10 self-end md:self-center bg-slate-950/75 border border-slate-800/80 px-3 py-1.5 rounded-md backdrop-blur-sm">
          <span className="text-slate-500 font-bold">DEPT INTEGRASI:</span>
          <span className="text-sky-400 font-black tracking-wide uppercase">
            SAN ANDREAS POLICE
          </span>
        </div>
      </div>

      {/* 2. ALL POINTS BULLETIN (APB) SYSTEM */}
      {(wantedCitizens.length > 0 || stolenVehicles.length > 0) && (
        <div className="bg-red-950/20 border-2 border-red-900/60 rounded-lg p-4 shadow-lg shadow-red-950/5 relative overflow-hidden" id="apb-tactical-ticker">
          {/* Neon blinking light indicator */}
          <div className="absolute -right-12 -top-12 w-28 h-28 bg-red-600/10 rounded-full blur-2xl pointer-events-none"></div>
          
          <div className="flex items-center justify-between border-b border-red-900/40 pb-2 mb-3">
            <div className="flex items-center space-x-2.5 text-red-400">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
              </span>
              <h3 className="text-xs font-black font-mono tracking-widest uppercase flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-red-500" /> ALL POINTS BULLETIN (APB) // KOTA LOS SANTOS
              </h3>
            </div>
            <span className="text-[9px] font-mono font-bold bg-red-950 border border-red-900 text-red-400 px-2 py-0.5 rounded uppercase animate-pulse">
              DPO & KENDARAAN DICURI
            </span>
          </div>

          {/* APB Grid items */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {/* Wanted Citizens */}
            {wantedCitizens.map((c) => (
              <div 
                key={c.id}
                onClick={() => {
                  setSelectedCitizenId(c.id);
                  setActiveTab('citizens');
                }}
                className="bg-slate-955/90 border border-red-900/30 hover:border-red-600/60 p-2.5 rounded flex items-center space-x-3 cursor-pointer transition-all hover:bg-slate-950 group"
              >
                <div className="relative shrink-0">
                  <img 
                    src={c.avatar && c.avatar.trim() !== "" ? c.avatar : "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100"} 
                    alt={c.firstName}
                    className="w-10 h-10 rounded object-cover border border-red-900/40 group-hover:scale-102 transition-transform"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute -bottom-1 -right-1 bg-red-600 text-slate-950 font-black font-mono text-[7px] px-1 rounded uppercase">DPO</div>
                </div>
                <div className="min-w-0 font-mono">
                  <h4 className="text-[11px] font-bold text-red-400 truncate group-hover:underline">
                    {c.firstName} {c.lastName}
                  </h4>
                  <p className="text-[9px] text-slate-500 truncate">NIK: {c.id}</p>
                  <p className="text-[9px] text-amber-500 truncate mt-0.5 italic">" {c.wantedReason || 'Lirik DPO'} "</p>
                </div>
              </div>
            ))}

            {/* Stolen Vehicles */}
            {stolenVehicles.map((v) => (
              <div 
                key={v.id}
                onClick={() => {
                  setActiveTab('vehicles');
                }}
                className="bg-slate-955/90 border border-amber-900/30 hover:border-amber-600/60 p-2.5 rounded flex items-center space-x-3 cursor-pointer transition-all hover:bg-slate-950 group"
              >
                <div className="w-10 h-10 rounded bg-amber-950/40 border border-amber-900/40 flex items-center justify-center text-amber-500 shrink-0">
                  <Car className="w-5 h-5" />
                </div>
                <div className="min-w-0 font-mono">
                  <span className="text-[9px] bg-amber-950 text-amber-400 border border-amber-900/60 px-1.5 py-0.2 rounded font-bold uppercase block w-max mb-0.5">
                    PLAT DICURI
                  </span>
                  <h4 className="text-[11px] font-bold text-slate-205 text-slate-200 truncate group-hover:underline">
                    {v.plate} - {v.model}
                  </h4>
                  <p className="text-[9px] text-slate-500 truncate">Pemilik: {v.ownerName}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dashboard Top Console Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4" id="dashboard-system-console">
        {/* Left Column: Stats & Tactical Status (Span 2) */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Stat 1: Anggota Aktif */}
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg flex items-center justify-between shadow-sm">
            <div>
              <p className="text-[10px] text-slate-500 font-mono tracking-wider">UNIT DINAS AKTIF</p>
              <h3 className="text-lg font-extrabold font-mono text-cyan-400 mt-1">LSPD-{currentOfficer?.badgeNumber ?? 'PD-01'}</h3>
              <p className="text-[10px] text-slate-400 font-mono mt-0.5 truncate max-w-[200px]">
                {currentOfficer?.rank} // {currentOfficer?.name}
              </p>
            </div>
            <div className="p-2.5 bg-cyan-950/40 border border-cyan-800/60 rounded text-cyan-400 shrink-0">
              <Users className="w-4 h-4" />
            </div>
          </div>


          {/* Stat 2: Laporan Lapangan */}
          <div 
            onClick={() => setMonitoringMode('reports')}
            className={`p-4 rounded-lg flex items-center justify-between shadow-sm cursor-pointer transition-all border ${
              monitoringMode === 'reports'
                ? 'bg-slate-900 border-sky-500/60 shadow-sky-950/40 ring-1 ring-sky-500/30'
                : 'bg-slate-900 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div>
              <div className="flex items-center space-x-1.5">
                <p className="text-[10px] text-slate-500 font-mono tracking-wider">LAPORAN LAPANGAN</p>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              </div>
              <h3 className="text-xl font-extrabold font-mono text-sky-400 mt-1">
                {reports.length} Kasus
              </h3>
              <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                {reports.filter(r => r.status === 'Selesai').length} Selesai • {reports.filter(r => r.status === 'Penyelidikan').length} Lidik
              </p>
            </div>
            <div className="p-2.5 bg-sky-950/40 border border-sky-800/60 rounded text-sky-400 shrink-0">
              <FileText className="w-4 h-4" />
            </div>
          </div>

          {/* Stat 3: Tahanan Aktif */}
          <div 
            onClick={() => setMonitoringMode('detainees')}
            className={`p-4 rounded-lg flex items-center justify-between shadow-sm cursor-pointer transition-all border ${
              monitoringMode === 'detainees'
                ? 'bg-slate-900 border-amber-500/60 shadow-amber-950/40 ring-1 ring-amber-500/30'
                : 'bg-slate-900 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div>
              <p className="text-[10px] text-slate-500 font-mono tracking-wider">TAHANAN DI SEL</p>
              <h3 className="text-xl font-extrabold font-mono text-amber-500 mt-1">
                {detainees.filter((d) => d.status !== 'Bebas').length} Jiwa
              </h3>
              <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                {wantedCount} buronan APB terlacak
              </p>
            </div>
            <div className="p-2.5 bg-amber-950/40 border border-amber-800/60 rounded text-amber-500 shrink-0">
              <Timer className="w-4 h-4 animate-pulse" />
            </div>
          </div>

          {/* Stat 3: Panggilan Dispatch Aktif */}
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg flex items-center justify-between shadow-sm">
            <div>
              <p className="text-[10px] text-slate-500 font-mono tracking-wider">DISPATCH 911 AKTIF</p>
              <h3 className="text-xl font-extrabold font-mono text-rose-500 mt-1">{activeDispatchCount} Insiden</h3>
              <p className="text-[10px] text-slate-400 font-mono mt-0.5">Aktif memerlukan respon unit</p>
            </div>
            <div className="p-2.5 bg-rose-950/40 border border-rose-800/60 rounded text-rose-500 shrink-0">
              <Siren className="w-4 h-4 text-rose-500" />
            </div>
          </div>

          {/* Stat 4: Wanted List APB */}
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg flex items-center justify-between shadow-sm">
            <div>
              <p className="text-[10px] text-slate-500 font-mono tracking-wider">BURONAN AKTIF (APB)</p>
              <h3 className="text-xl font-extrabold font-mono text-red-500 mt-1">{wantedCount} Suspek</h3>
              <p className="text-[10px] text-slate-400 font-mono mt-0.5">{stolenCount} mobil dicuri terlacak</p>
            </div>
            <div className="p-2.5 bg-red-950/40 border border-red-800/60 rounded text-red-500 animate-pulse shrink-0">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Right Column: Intelligent Quick Access Commands (Span 1) */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg flex flex-col justify-between shadow-sm">
          <div className="space-y-2.5 w-full">
            <div className="flex items-center justify-between border-b border-slate-850 pb-1.5">
              <p className="text-[10px] text-sky-400 font-bold font-mono tracking-wider uppercase flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-550 bg-emerald-500"></span>
                AKSES CEPAT TINDAKAN
              </p>
              <span className="text-[8px] font-mono bg-slate-950 border border-slate-850 text-slate-500 px-1.5 py-0.5 rounded">
                INTEGRATED
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setActiveTab('citizens')}
                className="flex items-center space-x-2 p-1.5 bg-slate-950 hover:bg-slate-850 border border-slate-855 hover:border-sky-500/30 rounded text-left group transition-all text-xs cursor-pointer"
              >
                <div className="p-1 bg-sky-950/70 border border-sky-900/50 text-sky-400 rounded group-hover:scale-105 transition-transform shrink-0">
                  <Users className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0 leading-tight">
                  <h4 className="font-bold text-slate-205 text-[10px] text-slate-200">Cari NIK</h4>
                  <p className="text-[8px] text-slate-500 font-mono truncate">Data Warga</p>
                </div>
              </button>

              <button
                onClick={() => setActiveTab('vehicles')}
                className="flex items-center space-x-2 p-1.5 bg-slate-950 hover:bg-slate-850 border border-slate-855 hover:border-amber-500/30 rounded text-left group transition-all text-xs cursor-pointer"
              >
                <div className="p-1 bg-amber-950/70 border border-amber-900/50 text-amber-455 rounded group-hover:scale-105 transition-transform shrink-0">
                  <Car className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0 leading-tight">
                  <h4 className="font-bold text-slate-205 text-[10px] text-slate-200">Check Plat</h4>
                  <p className="text-[8px] text-slate-500 font-mono truncate">Kendaraan</p>
                </div>
              </button>

              {!isGovernment && (
                <>
                  <button
                    onClick={() => setActiveTab('reports')}
                    className="flex items-center space-x-2 p-1.5 bg-slate-950 hover:bg-slate-850 border border-slate-855 hover:border-rose-500/30 rounded text-left group transition-all text-xs cursor-pointer"
                  >
                    <div className="p-1 bg-rose-955/70 border border-rose-900/50 text-rose-455 rounded group-hover:scale-105 transition-transform shrink-0">
                      <FileText className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0 leading-tight">
                      <h4 className="font-bold text-slate-205 text-[10px] text-slate-200">Buka Kasus</h4>
                      <p className="text-[8px] text-slate-500 font-mono truncate">Buat 10-15</p>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setShowDispatchForm(true);
                      setTimeout(() => {
                        document.getElementById('show-dispatch-form-btn')?.scrollIntoView({ behavior: 'smooth' });
                      }, 150);
                    }}
                    className="flex items-center space-x-2 p-1.5 bg-slate-950 hover:bg-slate-850 border border-slate-855 hover:border-red-500/30 rounded text-left group transition-all text-xs cursor-pointer"
                  >
                    <div className="p-1 bg-red-950/70 border border-red-900/50 text-red-400 rounded group-hover:scale-105 transition-transform shrink-0">
                      <Siren className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0 leading-tight">
                      <h4 className="font-bold text-slate-205 text-[10px] text-slate-200">Lapor 911</h4>
                      <p className="text-[8px] text-slate-500 font-mono truncate">Patroli</p>
                    </div>
                  </button>
                </>
              )}

              <button
                onClick={() => setActiveTab('roster')}
                className="col-span-2 flex items-center justify-center space-x-2 py-1 bg-slate-950 hover:bg-slate-850 border border-slate-850 hover:border-slate-750 text-slate-350 hover:text-slate-200 rounded transition-all text-[9.5px] font-mono font-bold cursor-pointer"
              >
                <Scale className="w-3.5 h-3.5 text-slate-500" />
                <span>LIHAT ANGGOTA AKTIF LSPD</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Prisoners Monitor and Dispatch Callouts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6" id="dashboard-core-grids">
        
        {/* Left Column: REAL-TIME MONITORING BOARD (Field Reports & Detainees) */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden shadow-lg flex flex-col">
          <div className="bg-gradient-to-r from-slate-850 to-slate-900 px-4 py-3 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center space-x-2">
              <span className={`w-2.5 h-2.5 rounded-full ${monitoringMode === 'reports' ? 'bg-sky-400' : 'bg-amber-400'} animate-pulse`}></span>
              <h2 className="text-sm font-bold font-mono text-slate-200 uppercase tracking-widest">
                Papan Pemantauan LSPD
              </h2>
              <span className="text-[9px] bg-emerald-950/70 border border-emerald-850 text-emerald-400 px-1.5 py-0.5 rounded font-mono font-bold uppercase tracking-wider">
                REAL-TIME
              </span>
            </div>

            {/* Sub-view switcher tabs */}
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-md border border-slate-800 text-[10px] font-mono">
              <button
                type="button"
                onClick={() => setMonitoringMode('reports')}
                className={`px-2.5 py-1 rounded font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  monitoringMode === 'reports'
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>LAPORAN LAPANGAN</span>
                <span className={`px-1.5 py-0.2 text-[8.5px] font-bold rounded ${monitoringMode === 'reports' ? 'bg-sky-800 text-white' : 'bg-slate-800 text-slate-300'}`}>
                  {reports.length}
                </span>
              </button>
              
              <button
                type="button"
                onClick={() => setMonitoringMode('detainees')}
                className={`px-2.5 py-1 rounded font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  monitoringMode === 'detainees'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <Timer className="w-3.5 h-3.5" />
                <span>TAHANAN & SEL</span>
                <span className={`px-1.5 py-0.2 text-[8.5px] font-bold rounded ${monitoringMode === 'detainees' ? 'bg-amber-800 text-white' : 'bg-slate-800 text-slate-300'}`}>
                  {detainees.filter(d => d.status !== 'Bebas').length}
                </span>
              </button>
            </div>
          </div>

          {monitoringMode === 'reports' ? (
            <>
              {/* Interactive Search & Filter Bar for Reports */}
              <div className="bg-slate-950 p-3 border-b border-slate-850 space-y-2">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-500" />
                    <input
                      type="text"
                      placeholder="Cari nomor kasus (REP-01), judul, tersangka, penyidik..."
                      value={reportSearchQuery}
                      onChange={(e) => setReportSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-800 focus:border-sky-500 text-xs text-slate-100 rounded outline-none font-mono"
                    />
                    {reportSearchQuery && (
                      <button
                        onClick={() => setReportSearchQuery('')}
                        className="absolute right-2.5 top-2 hover:text-slate-200 text-slate-500 font-bold px-1 text-xs cursor-pointer"
                      >
                        ×
                      </button>
                    )}
                  </div>
                  <select
                    value={reportLimit}
                    onChange={(e) => setReportLimit(Number(e.target.value))}
                    className="bg-slate-900 border border-slate-800 text-slate-300 px-2.5 py-1.5 rounded text-xs font-mono outline-none cursor-pointer hover:border-slate-700"
                  >
                    <option value={5}>Limit: 5</option>
                    <option value={10}>Limit: 10</option>
                    <option value={20}>Limit: 20</option>
                    <option value={0}>Semua</option>
                  </select>
                  {!isGovernment && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingReportId(null);
                        setActiveTab('reports');
                      }}
                      className="px-2.5 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded text-xs font-mono font-bold flex items-center gap-1 shrink-0 transition-colors cursor-pointer"
                      title="Buat Laporan Lapangan Baru"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Buat Baru</span>
                    </button>
                  )}
                </div>
                
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap gap-1 font-mono text-[9px]">
                    {['Semua', 'Selesai', 'Penyelidikan', 'DPO'].map((status) => (
                      <button
                        key={status}
                        onClick={() => setReportFilterStatus(status)}
                        className={`px-2 py-1 rounded transition-all cursor-pointer border ${
                          reportFilterStatus === status
                            ? 'bg-sky-500/15 text-sky-400 border-sky-500/30 font-bold'
                            : 'bg-slate-900 text-slate-450 border-slate-850 hover:border-slate-800'
                        }`}
                      >
                        {status === 'Selesai' ? 'SELESAI (10-15)' : status.toUpperCase()}
                      </button>
                    ))}
                  </div>
                  <span className="text-[9px] font-mono text-slate-500 uppercase">
                    Tampil: {limitedReports.length} / {filteredReports.length} Laporan
                  </span>
                </div>
              </div>

              <div className="p-4 flex-1 space-y-3 overflow-y-auto max-h-[480px] custom-scrollbar" style={{ minHeight: '340px' }}>
                {reports.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center p-8 text-center border border-dashed border-slate-805 rounded">
                    <FileText className="w-8 h-8 text-slate-700 mb-2" />
                    <p className="text-xs text-slate-500 font-mono font-semibold">BELUM ADA LAPORAN LAPANGAN</p>
                    <p className="text-[10px] text-slate-600 font-sans mt-1">
                      Laporan kasus yang Anda kirim akan langsung tampil real-time di sini.
                    </p>
                    {!isGovernment && (
                      <button
                        onClick={() => {
                          setEditingReportId(null);
                          setActiveTab('reports');
                        }}
                        className="mt-3 px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer"
                      >
                        <PlusCircle className="w-3.5 h-3.5" />
                        Buat Laporan Lapangan Sekarang
                      </button>
                    )}
                  </div>
                ) : filteredReports.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center p-8 text-center border border-dashed border-slate-805 rounded">
                    <Search className="w-8 h-8 text-slate-700 mb-2" />
                    <p className="text-xs text-slate-500 font-mono font-semibold">TIDAK ADA LAPORAN YANG COCOK</p>
                    <p className="text-[10px] text-slate-600 font-sans mt-1">
                      Coba ubah kata kunci pencarian atau reset filter status ({reports.length} total laporan tersimpan).
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setReportFilterStatus('Semua');
                        setReportSearchQuery('');
                      }}
                      className="mt-3 px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Reset Filter & Tampilkan Semua
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {limitedReports.map((rep) => {
                      const caseNum = rep.id.replace(/^REP-/, '');
                      const isRecent = Date.now() - new Date(rep.date).getTime() < 15 * 60 * 1000;
                      return (
                        <motion.div
                          key={rep.id}
                          layout
                          className="border border-slate-800 p-3.5 rounded bg-slate-950/70 hover:bg-slate-950 transition-colors flex flex-col space-y-2.5"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="flex items-center space-x-2 flex-wrap">
                              <span className="px-2 py-0.5 rounded font-mono font-bold text-xs bg-sky-950/90 text-sky-400 border border-sky-800">
                                Kasus #{caseNum} ({rep.id})
                              </span>

                              {isRecent && (
                                <span className="px-1.5 py-0.5 rounded font-mono font-bold text-[8.5px] bg-emerald-950 text-emerald-300 border border-emerald-600 animate-pulse flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                                  REAL-TIME
                                </span>
                              )}

                              <span className={`text-[9px] font-bold font-mono px-2 py-0.5 rounded uppercase border ${
                                rep.status === 'Selesai'
                                  ? 'bg-emerald-955/60 text-emerald-400 border-emerald-800'
                                  : rep.status === 'DPO'
                                  ? 'bg-rose-955/80 text-rose-400 border-rose-800 animate-pulse'
                                  : 'bg-amber-955/60 text-amber-400 border-amber-800'
                              }`}>
                                {rep.status}
                              </span>

                              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
                                {rep.type === 'Citizen' ? 'Laporan Warga' : '10-15 LSPD'}
                              </span>
                            </div>

                            <span className="text-[10px] font-mono text-slate-500 flex items-center gap-1">
                              <Clock className="w-3 h-3 text-slate-600" />
                              {new Date(rep.date).toLocaleString('id-ID', {
                                dateStyle: 'short',
                                timeStyle: 'short',
                              })}
                            </span>
                          </div>

                          <div>
                            <h4 className="text-sm font-bold text-slate-100">
                              {rep.title}
                            </h4>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-[11px] font-mono text-slate-400">
                              <span className="text-slate-300">
                                <span className="text-slate-500">Tersangka:</span>{' '}
                                <strong className="text-amber-400">{rep.suspectName || 'Lidik'}</strong>
                              </span>
                              <span className="text-slate-400">
                                <span className="text-slate-500">Penyidik:</span> {rep.officerName}
                              </span>
                              {rep.location && (
                                <span className="text-slate-400 truncate max-w-[180px]">
                                  <span className="text-slate-500">Lokasi:</span> {rep.location}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Penalties and Charges Overview */}
                          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-850/60 text-[10px] font-mono">
                            <div className="flex items-center gap-3">
                              <span className="text-emerald-400 font-bold">
                                Denda: ${rep.totalFine ? rep.totalFine.toLocaleString() : 0}
                              </span>
                              <span className="text-amber-400 font-bold">
                                Hukuman: {rep.totalJailTime || 0} Bln/Mnt
                              </span>
                              <span className="text-slate-500">
                                {rep.charges?.length || 0} Dakwaan
                              </span>
                            </div>

                            <div className="flex items-center space-x-1.5 ml-auto">
                              {!isGovernment && (
                                <button
                                  onClick={() => {
                                    setEditingReportId(rep.id);
                                    setActiveTab('reports');
                                  }}
                                  className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded text-[10px] font-mono border border-slate-800 transition-colors cursor-pointer"
                                  title="Edit Laporan Ini"
                                >
                                  Edit
                                </button>
                              )}
                              <button
                                onClick={() => setActiveTab('cases')}
                                className="px-2 py-1 bg-sky-950/60 hover:bg-sky-900 text-sky-400 hover:text-sky-200 rounded text-[10px] font-mono border border-sky-800/80 transition-colors cursor-pointer"
                                title="Buka Arsip Kasus Lengkap"
                              >
                                Buka Arsip
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              {/* Interactive Search & Filter Bar */}
              <div className="bg-slate-950 p-3 border-b border-slate-850 space-y-2">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Cari tahanan, petugas penangkap..."
                  value={detaineeSearchQuery}
                  onChange={(e) => setDetaineeSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-800 focus:border-sky-500 text-xs text-slate-100 rounded outline-none font-mono"
                />
                {detaineeSearchQuery && (
                  <button
                    onClick={() => setDetaineeSearchQuery('')}
                    className="absolute right-2.5 top-2 hover:text-slate-200 text-slate-500 font-bold px-1 text-xs"
                  >
                    ×
                  </button>
                )}
              </div>
              <select
                value={detaineeLimit}
                onChange={(e) => setDetaineeLimit(Number(e.target.value))}
                className="bg-slate-900 border border-slate-800 text-slate-300 px-2.5 py-1.5 rounded text-xs font-mono outline-none cursor-pointer hover:border-slate-700"
              >
                <option value={5}>Limit: 5</option>
                <option value={10}>Limit: 10</option>
                <option value={20}>Limit: 20</option>
                <option value={0}>Semua</option>
              </select>
            </div>
            
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap gap-1 font-mono text-[9px]">
                {['Semua', 'Dalam Sel', 'Interogasi', 'Isolasi', 'Bebas'].map((status) => (
                  <button
                    key={status}
                    onClick={() => setDetaineeFilterStatus(status)}
                    className={`px-2 py-1 rounded transition-all cursor-pointer border ${
                      detaineeFilterStatus === status
                        ? 'bg-amber-500/15 text-amber-400 border-amber-500/30 font-bold'
                        : 'bg-slate-900 text-slate-450 border-slate-850 hover:border-slate-800'
                    }`}
                  >
                    {status === 'Bebas' ? 'BEBAS / PAROLE' : status.toUpperCase()}
                  </button>
                ))}
              </div>
              <span className="text-[9px] font-mono text-slate-500 uppercase">
                Tampil: {limitedDetainees.length} / {filteredDetainees.length}
              </span>
            </div>
          </div>

          <div className="p-4 flex-1 space-y-3 overflow-y-auto max-h-[480px] custom-scrollbar" style={{ minHeight: '340px' }}>
            {detainees.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center p-8 text-center border border-dashed border-slate-805 rounded">
                <Shield className="w-8 h-8 text-slate-700 mb-2" />
                <p className="text-xs text-slate-500 font-mono font-semibold">TIDAK ADA TAHANAN AKTIF</p>
                <p className="text-[10px] text-slate-600 font-sans mt-1">
                  Gunakan tab "Buat Laporan" untuk memproses tersangka masuk tahanan secara otomatis.
                </p>
              </div>
            ) : filteredDetainees.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center p-8 text-center border border-dashed border-slate-805 rounded">
                <Search className="w-8 h-8 text-slate-700 mb-2" />
                <p className="text-xs text-slate-500 font-mono font-semibold">TIDAK ADA HASIL COCOK</p>
                <p className="text-[10px] text-slate-600 font-sans mt-1">
                  Coba ubah kata kunci pencarian atau matikan filter status.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {limitedDetainees.map((det) => {
                  const isReleased = det.status === 'Bebas' || det.remainingTime === 0;
                  return (
                    <motion.div
                      key={det.id}
                      layout
                      className={`border p-3.5 rounded bg-slate-950/60 hover:bg-slate-950 transition-colors ${
                        isReleased
                          ? 'border-emerald-950/80 bg-emerald-950/5'
                          : det.status === 'Isolasi'
                          ? 'border-indigo-900 bg-indigo-950/10'
                          : det.status === 'Interogasi'
                          ? 'border-sky-900 bg-sky-950/10'
                          : 'border-slate-800'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        {/* Detainee details */}
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <span
                              onClick={() => {
                                setSelectedCitizenId(det.citizenId);
                                setActiveTab('citizens');
                              }}
                              className="text-xs font-bold text-slate-100 hover:text-sky-400 hover:underline cursor-pointer flex items-center gap-1 font-mono"
                            >
                              {det.citizenName}
                              <ExternalLink className="w-3 h-3 text-slate-500" />
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                              {det.id}
                            </span>
                          </div>
                          
                          <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] font-mono text-slate-400">
                            <span>Lencana: <span className="text-slate-300">{det.cellNumber}</span></span>
                            <span>Denda: <span className="text-amber-500/90">${det.fine.toLocaleString()}</span></span>
                            <span>Penangkap: <span className="text-slate-300">{det.arrestingOfficer}</span></span>
                          </div>
                        </div>

                        {/* Status badge with simulation clock */}
                        <div className="flex items-center space-x-3 text-right">
                          <div className="font-mono">
                            {isReleased ? (
                              <span className="text-[10px] text-emerald-400 bg-emerald-950/50 border border-emerald-900/60 px-2.5 py-1 rounded select-none animate-pulse flex items-center gap-1 font-bold">
                                <CheckCircle className="w-3.5 h-3.5" /> BEBAS / PAROLE MAKSIMAL
                              </span>
                            ) : (
                              <div className="flex flex-col items-end">
                                <span className={`text-[10px] px-2 py-0.5 rounded border font-semibold ${
                                  det.status === 'Dalam Sel' ? 'border-amber-900/80 text-amber-400 bg-amber-950/30' :
                                  det.status === 'Interogasi' ? 'border-sky-900/80 text-sky-400 bg-sky-950/30' :
                                  'border-indigo-900/80 text-indigo-400 bg-indigo-950/30'
                                }`}>
                                  {det.status}
                                </span>
                                <span className="text-xs text-rose-400 mt-1 flex items-center gap-1 font-semibold">
                                  <Timer className="w-3 h-3 text-rose-500 shrink-0" />
                                  {Math.floor(det.remainingTime / 60)}m {det.remainingTime % 60}s sisa
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Interactive Officer Actions on Prisoner */}
                      <div className="flex flex-wrap gap-1.5 mt-3 pt-2.5 border-t border-slate-900">
                        {isGovernment ? (
                          <span className="text-[10px] font-mono text-slate-500 italic">
                            Akses Khusus Polisi: Hanya Anggota LSPD yang dapat berinteraksi dengan tahanan.
                          </span>
                        ) : !isReleased ? (
                          <>
                            <button
                              onClick={() => updateDetaineeStatus(det.id, 'Dalam Sel')}
                              disabled={det.status === 'Dalam Sel'}
                              className={`px-2 py-1 rounded text-[10px] font-mono tracking-wider transition-all cursor-pointer ${
                                det.status === 'Dalam Sel'
                                  ? 'bg-slate-900 text-slate-500 border border-slate-805'
                                  : 'bg-amber-955/50 text-amber-400 border border-amber-900 hover:bg-amber-900 hover:text-slate-100'
                              }`}
                            >
                              Pindahkan Sel
                            </button>
                            <button
                              onClick={() => updateDetaineeStatus(det.id, 'Interogasi')}
                              disabled={det.status === 'Interogasi'}
                              className={`px-2 py-1 rounded text-[10px] font-mono tracking-wider transition-all cursor-pointer ${
                                det.status === 'Interogasi'
                                  ? 'bg-slate-900 text-slate-500 border border-slate-805'
                                  : 'bg-sky-950/50 text-sky-400 border border-sky-900 hover:bg-sky-900 hover:text-slate-100'
                              }`}
                            >
                              Interogasi
                            </button>
                            <button
                              onClick={() => updateDetaineeStatus(det.id, 'Isolasi')}
                              disabled={det.status === 'Isolasi'}
                              className={`px-2 py-1 rounded text-[10px] font-mono tracking-wider transition-all cursor-pointer ${
                                det.status === 'Isolasi'
                                  ? 'bg-slate-900 text-slate-500 border border-slate-805'
                                  : 'bg-indigo-955/50 text-indigo-400 border border-indigo-900 hover:bg-indigo-900 hover:text-slate-100'
                              }`}
                            >
                              Sel Isolasi (Solitary)
                            </button>
                            <button
                              onClick={() => {
                                setEditingCellDetId(det.id);
                                setNewCellNum(det.cellNumber);
                              }}
                              className="px-2 py-1 rounded text-[10px] font-mono tracking-wider bg-slate-900/80 text-slate-355 border border-slate-800 hover:bg-slate-800 hover:text-slate-100 cursor-pointer"
                            >
                              Ubah No Sel
                            </button>
                            <button
                              onClick={() => updateDetaineeStatus(det.id, 'Bebas')}
                              className="px-2 py-1 rounded text-[10px] font-mono font-bold tracking-wider bg-rose-950/60 text-rose-400 border border-rose-900/60 hover:bg-rose-900 hover:text-slate-150 cursor-pointer ml-auto"
                            >
                              Parole / Bebaskan
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => releaseDetainee(det.id)}
                            className="px-2.5 py-1 rounded text-[10px] font-mono font-bold tracking-wider bg-slate-900 text-slate-400 border border-slate-800 hover:bg-slate-800 hover:text-slate-100 cursor-pointer ml-auto"
                          >
                            Hapus dari Papan Monitor
                          </button>
                        )}
                      </div>

                      {/* Editing Cell Inline Panel */}
                      {editingCellDetId === det.id && (
                        <div className="mt-3 p-2 bg-slate-950 border border-slate-800 rounded flex items-center space-x-2 font-mono">
                          <span className="text-[10px] text-slate-400">Sel Baru:</span>
                          <input
                            type="text"
                            value={newCellNum}
                            onChange={(e) => setNewCellNum(e.target.value)}
                            className="bg-slate-900 border border-slate-805 text-xs text-slate-100 px-2 py-0.5 rounded max-w-[120px] outline-none"
                            placeholder="cth. Sel B-5"
                          />
                          <button
                            onClick={() => handleEditCellSubmit(det.id)}
                            className="bg-sky-500 text-slate-900 text-[10px] font-bold px-2 py-0.5 rounded cursor-pointer"
                          >
                            Simpan
                          </button>
                          <button
                            onClick={() => setEditingCellDetId(null)}
                            className="text-slate-450 hover:text-slate-200 text-[10px]"
                          >
                            Batal
                          </button>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
            </>
          )}
        </div>

        {/* Right Column: EMERGENCY DISPATCH (911 CALLOUT BOARD) */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden shadow-lg flex flex-col">
          <div className="bg-gradient-to-r from-slate-850 to-slate-900 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-pulse"></span>
              <h2 className="text-sm font-bold font-mono text-slate-200 uppercase tracking-widest">Pusat Panggilan Darurat 911 / Patroli</h2>
            </div>
            {!isGovernment && (
              <button
                id="show-dispatch-form-btn"
                onClick={() => setShowDispatchForm(!showDispatchForm)}
                className="px-2 py-0.5 bg-rose-955 hover:bg-rose-900 text-rose-455 hover:text-rose-100 border border-rose-900 rounded text-[10px] font-mono tracking-wide flex items-center gap-1 cursor-pointer transition-colors"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                BUAT LAPOR DISPATCH
              </button>
            )}
          </div>

          {/* Interactive Search & Multi-Filters Panel */}
          <div className="bg-slate-950 p-3 border-b border-slate-850 space-y-2 font-mono">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Cari laporan, lokasi, deskripsi..."
                  value={dispatchSearchQuery}
                  onChange={(e) => setDispatchSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-800 focus:border-rose-500 text-xs text-slate-100 rounded outline-none"
                />
                {dispatchSearchQuery && (
                  <button
                    onClick={() => setDispatchSearchQuery('')}
                    className="absolute right-2.5 top-2 hover:text-slate-200 text-slate-500 font-bold px-1 text-xs"
                  >
                    ×
                  </button>
                )}
              </div>
              <select
                value={dispatchLimit}
                onChange={(e) => setDispatchLimit(Number(e.target.value))}
                className="bg-slate-900 border border-slate-800 text-slate-300 px-2.5 py-1.5 rounded text-xs outline-none cursor-pointer hover:border-slate-700"
              >
                <option value={5}>Limit: 5</option>
                <option value={10}>Limit: 10</option>
                <option value={20}>Limit: 20</option>
                <option value={0}>Semua</option>
              </select>
            </div>

            {/* Double filter row: Status & Priority */}
            <div className="flex flex-col gap-1.5 text-[8.5px]">
              <div className="flex flex-wrap items-center gap-1">
                <span className="text-slate-550 uppercase font-bold text-[8px] mr-1">STATUS:</span>
                {['Semua', 'Aktif', 'Merespon', 'Selesai'].map((status) => (
                  <button
                    key={status}
                    onClick={() => setDispatchFilterStatus(status)}
                    className={`px-1.5 py-0.5 rounded transition-all cursor-pointer border ${
                      dispatchFilterStatus === status
                        ? 'bg-rose-500/15 text-rose-400 border-rose-500/30 font-bold'
                        : 'bg-slate-900 text-slate-450 border-slate-850 hover:border-slate-800'
                    }`}
                  >
                    {status.toUpperCase()}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-1">
                  <span className="text-slate-550 uppercase font-bold text-[8px] mr-1">PRIORITAS:</span>
                  {['Semua', 'Kritis', 'Tinggi', 'Sedang', 'Rendah'].map((prio) => (
                    <button
                      key={prio}
                      onClick={() => setDispatchFilterPriority(prio)}
                      className={`px-1.5 py-0.5 rounded transition-all cursor-pointer border ${
                        dispatchFilterPriority === prio
                          ? 'bg-rose-500/15 text-rose-450 border-rose-500/30 font-bold'
                          : 'bg-slate-900 text-slate-450 border-slate-850 hover:border-slate-800'
                      }`}
                    >
                      {prio.toUpperCase()}
                    </button>
                  ))}
                </div>
                <span className="text-[9px] font-mono text-slate-550 uppercase">
                  Tampil: {limitedDispatchCalls.length} / {filteredDispatchCalls.length}
                </span>
              </div>
            </div>
          </div>

          <div className="p-4 flex-1 space-y-4 overflow-y-auto max-h-[480px] custom-scrollbar" style={{ minHeight: '340px' }}>
            {/* New Dispatch Callout Form */}
            {showDispatchForm && (
              <motion.form
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                onSubmit={handleCreateDispatch}
                className="p-3.5 border border-rose-900/50 bg-rose-950/10 rounded-lg space-y-3 font-mono"
              >
                <h3 className="text-xs font-bold text-rose-400">INPUT INSIDEN LAPOR BARU</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-slate-400 uppercase">Insiden / Laporan</label>
                    <input
                      type="text"
                      placeholder="cth. Perkelahian Gang"
                      value={newDiscTitle}
                      onChange={(e) => setNewDiscTitle(e.target.value)}
                      className="w-full mt-1 bg-slate-950 border border-slate-800 focus:border-rose-700 p-1.5 text-xs text-slate-100 rounded outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 uppercase">Lokasi Kejadian</label>
                    <input
                      type="text"
                      placeholder="cth. Mirror Park"
                      value={newDiscLocation}
                      onChange={(e) => setNewDiscLocation(e.target.value)}
                      className="w-full mt-1 bg-slate-950 border border-slate-800 focus:border-rose-700 p-1.5 text-xs text-slate-100 rounded outline-none"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-slate-400 uppercase">Prioritas</label>
                    <select
                      value={newDiscPriority}
                      onChange={(e) => setNewDiscPriority(e.target.value as any)}
                      className="w-full mt-1 bg-slate-950 border border-slate-800 p-1.5 text-xs text-slate-100 rounded cursor-pointer outline-none"
                    >
                      <option value="Rendah">Rendah (Kode 1)</option>
                      <option value="Sedang">Sedang (Kode 2)</option>
                      <option value="Tinggi">Tinggi (Kode 3)</option>
                      <option value="Kritis">Kritis (Tembakan Berlangsung)</option>
                    </select>
                  </div>
                  <div className="flex items-end gap-2">
                    <button
                      type="submit"
                      className="w-full bg-rose-600 hover:bg-rose-500 text-slate-950 text-xs font-bold py-2 rounded cursor-pointer transition-colors"
                    >
                      Kirim ke Dispatcher
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowDispatchForm(false)}
                      className="border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs py-2 px-3 rounded cursor-pointer"
                    >
                      Batal
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 uppercase">Kronologis Singkat</label>
                  <textarea
                    placeholder="Masukkan deskripsi berupa pelaku, senjata, atau kendaraan terlihat..."
                    value={newDiscDesc}
                    onChange={(e) => setNewDiscDesc(e.target.value)}
                    className="w-full mt-1 bg-slate-950 border border-slate-800 focus:border-rose-700 p-1.5 text-xs text-slate-100 rounded outline-none h-16 resize-none"
                    required
                  />
                </div>
              </motion.form>
            )}

            {/* Dispatch Tickets Queue */}
            {dispatchCalls.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center p-8 text-center border border-dashed border-slate-805 rounded font-mono">
                <Siren className="w-8 h-8 text-slate-700 mb-2" />
                <p className="text-xs text-slate-500 font-semibold">TIDAK ADA PANGGILAN DISPATCH AKTIF</p>
                <p className="text-[10px] text-slate-600 font-sans mt-1">
                  Pusat komunikasi tenang. Seluruh unit sedang melakukan patroli wilayah.
                </p>
              </div>
            ) : filteredDispatchCalls.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center p-8 text-center border border-dashed border-slate-805 rounded font-mono">
                <Search className="w-8 h-8 text-slate-700 mb-2" />
                <p className="text-xs text-slate-500 font-semibold">TIDAK ADA INSIDEN COCOK</p>
                <p className="text-[10px] text-slate-600 font-sans mt-1">
                  Ubah kata kunci pencarian atau bersihkan filter prioritas & status.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {limitedDispatchCalls.map((call) => (
                <div
                  key={call.id}
                  className={`border rounded p-3.5 font-mono ${
                    call.status === 'Selesai'
                      ? 'border-slate-805 bg-slate-950/20 opacity-60'
                      : call.priority === 'Kritis'
                      ? 'border-red-900 bg-red-950/15'
                      : call.priority === 'Tinggi'
                      ? 'border-rose-955 bg-rose-950/5'
                      : 'border-slate-800 bg-slate-950/40'
                  }`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase border ${
                          call.priority === 'Kritis' ? 'bg-red-950/80 text-red-400 border-red-800 animate-pulse' :
                          call.priority === 'Tinggi' ? 'bg-rose-955 text-rose-400 border-rose-900' :
                          call.priority === 'Sedang' ? 'bg-amber-955 text-amber-400 border-amber-900' :
                          'bg-slate-900 text-slate-450 border-slate-800'
                        }`}>
                          {call.priority}
                        </span>
                        <h4 className="text-xs font-bold text-slate-100">{call.title}</h4>
                      </div>

                      <p className="text-[11px] text-slate-350 font-sans mt-2 leading-relaxed">
                        {call.description}
                      </p>

                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-slate-500 mt-2.5">
                        <span>LOKASI: <span className="text-sky-300 font-bold">{call.location}</span></span>
                        <span>DIBUAT: <span className="text-slate-400">{call.time}</span></span>
                        <span>ID: <span className="text-slate-400">{call.id}</span></span>
                      </div>
                    </div>

                    <div className="text-right flex flex-col items-end shrink-0 gap-1.5">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border select-none ${
                        call.status === 'Aktif' ? 'border-red-900/60 text-red-500 bg-red-950/10' :
                        call.status === 'Merespon' ? 'border-emerald-900/60 text-emerald-400 bg-emerald-950/20' :
                        'border-slate-800 text-slate-500'
                      }`}>
                        {call.status}
                      </span>

                      {call.status !== 'Selesai' && (
                        <div className="text-[10px] text-slate-450">
                          {call.respondingUnits.length > 0 ? (
                            <span className="text-emerald-450 font-bold">
                              Responding: {call.respondingUnits.join(', ')}
                            </span>
                          ) : (
                            <span className="text-slate-600 italic">No Units Dispatched</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions to interact with Dispatch ticket */}
                  {call.status !== 'Selesai' && (
                    <div className="flex gap-1.5 mt-3 pt-2.5 border-t border-slate-900">
                      {isGovernment ? (
                        <span className="text-[10px] font-mono text-slate-500 italic">
                          Akses Khusus Polisi: Hanya Anggota LSPD yang dapat merespon panggilan.
                        </span>
                      ) : (
                        <>
                          <button
                            onClick={() => currentOfficer && respondToDispatch(call.id, currentOfficer.badgeNumber)}
                            className={`px-2 py-1 rounded text-[10px] font-bold transition-all cursor-pointer ${
                              currentOfficer && call.respondingUnits.includes(currentOfficer.badgeNumber)
                                ? 'bg-amber-950 text-amber-400 border border-amber-900 hover:bg-slate-900'
                                : 'bg-emerald-950 text-emerald-400 border border-emerald-900 hover:bg-emerald-900 hover:text-slate-900'
                            }`}
                          >
                            {currentOfficer && call.respondingUnits.includes(currentOfficer.badgeNumber)
                              ? 'BATALKAN DINAS RESPOND'
                              : 'TANGGAPI PANGGILAN (10-97)'}
                          </button>

                          {call.status === 'Merespon' && (
                            <button
                              onClick={() => updateDispatchCall(call.id, { status: 'Selesai' })}
                              className="px-2 py-1 bg-slate-900 hover:bg-emerald-950 text-slate-400 hover:text-emerald-400 border border-slate-800 hover:border-emerald-900 rounded text-[10px] font-bold cursor-pointer ml-auto"
                            >
                              TANDAI SELESAI (10-8)
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              ))}
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
};
