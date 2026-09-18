import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useMdt } from '../context/MdtContext';
import { FileText, Search, Calendar, Users, Shield, Scale, DollarSign, Clock, ChevronDown, ChevronUp, Camera, Edit, Printer, Trash2, X, AlertCircle, CheckCircle, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CriminalReport, OfficerRank } from '../types';
import { copyToClipboard } from '../lib/clipboard';
import lspdLogo from '../assets/images/lspd_logo_1781980741624.jpg';

interface CasesArchiveProps {
  setActiveTab: (tab: string) => void;
  setEditingReportId: (id: string | null) => void;
  setSelectedCitizenId: (id: string | null) => void;
}

export const CasesArchive: React.FC<CasesArchiveProps> = ({ 
  setActiveTab, 
  setEditingReportId,
  setSelectedCitizenId 
}) => {
  const { reports, deleteReport, citizens, currentOfficer } = useMdt();
  const isCadet = currentOfficer?.rank === OfficerRank.CADET;
  const [searchQuery, setSearchQuery] = useState('');
  const [filterOfficer, setFilterOfficer] = useState('');
  const [reportToDelete, setReportToDelete] = useState<string | null>(null);
  const [reportToPrint, setReportToPrint] = useState<CriminalReport | null>(null);
  const [copiedSuccess, setCopiedSuccess] = useState(false);
  const [manualCopyText, setManualCopyText] = useState<string | null>(null);

  const handlePrint = (rep: CriminalReport) => {
    setReportToPrint(rep);
  };
  const [filterSuspect, setFilterSuspect] = useState('');
  const [sortBy, setSortBy] = useState<'id-desc' | 'id-asc' | 'date-desc' | 'date-asc'>('id-desc');
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [zoomedImage, setZoomedImage] = useState<{ url: string; caption: string } | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'citizen' | 'active' | 'resolved'>('all');

  // Count reports for stats/tabs
  const countAll = reports.length;
  const countCitizen = reports.filter(r => r.type === 'Citizen').length;
  const countActive = reports.filter(r => r.status === 'Penyelidikan' || r.status === 'DPO' || !r.status).length;
  const countResolved = reports.filter(r => r.status === 'Selesai').length;

  // Filter and Search reports
  const filteredReports = reports.filter((rep) => {
    const query = searchQuery.toLowerCase();
    const matchesQuery = 
      rep.title.toLowerCase().includes(query) ||
      rep.id.toLowerCase().includes(query) ||
      rep.description.toLowerCase().includes(query) ||
      rep.suspectName.toLowerCase().includes(query) ||
      rep.officerName.toLowerCase().includes(query) ||
      rep.officerBadge.toLowerCase().includes(query);
    
    const matchesOfficer = !filterOfficer || rep.officerName.toLowerCase().includes(filterOfficer.toLowerCase()) || rep.officerBadge.includes(filterOfficer);
    const matchesSuspect = !filterSuspect || rep.suspectName.toLowerCase().includes(filterSuspect.toLowerCase()) || rep.suspectId.includes(filterSuspect);

    let matchesCategory = true;
    if (categoryFilter === 'citizen') {
      matchesCategory = rep.type === 'Citizen';
    } else if (categoryFilter === 'active') {
      matchesCategory = rep.status === 'Penyelidikan' || rep.status === 'DPO' || !rep.status;
    } else if (categoryFilter === 'resolved') {
      matchesCategory = rep.status === 'Selesai';
    }

    return matchesQuery && matchesOfficer && matchesSuspect && matchesCategory;
  });

  // Sort reports
  const sortedReports = [...filteredReports].sort((a, b) => {
    if (sortBy === 'id-desc') {
      return b.id.localeCompare(a.id, undefined, { numeric: true, sensitivity: 'base' });
    }
    if (sortBy === 'id-asc') {
      return a.id.localeCompare(b.id, undefined, { numeric: true, sensitivity: 'base' });
    }
    if (sortBy === 'date-desc') {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    }
    if (sortBy === 'date-asc') {
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    }
    return 0;
  });

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setReportToDelete(id);
  };

  return (
    <div className="space-y-6">
      {/* HEADER SECTION */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 shadow-lg text-left">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-xl font-extrabold font-mono text-slate-100 tracking-wider uppercase flex items-center gap-2">
              <FileText className="w-6 h-6 text-sky-400 animate-pulse" /> ARSIP & REKOR KRIMINALITAS LSPD (10-15 RECORDS)
            </h1>
            <p className="text-xs text-slate-400 font-sans">
              Pusat penyimpanan berkas, berita acara pemeriksaan (BAP), mugshot tahanan, serta barang bukti kejahatan terindeks rapi.
            </p>
          </div>
          <div className="bg-slate-950 border border-slate-850 px-4 py-2 rounded text-right shrink-0">
            <span className="text-[10px] text-slate-500 font-mono block">TOTAL ARSIP BERKAS</span>
            <span className="text-lg font-bold font-mono text-sky-450">{reports.length} DOKUMEN</span>
          </div>
        </div>
      </div>

      {/* SEPARATOR CATEGORIES / QUICK TABS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 font-mono text-left">
        {[
          {
            id: 'all',
            label: 'SEMUA BERKAS',
            subLabel: 'Semua Laporan & Rekor',
            count: countAll,
            icon: FileText,
            activeColor: 'bg-slate-500/10 border-slate-400/50 text-slate-200',
            inactiveColor: 'bg-slate-900/30 border-slate-800/60 text-slate-450 hover:border-slate-700/80 hover:bg-slate-900/50',
            indicatorColor: 'bg-slate-500',
          },
          {
            id: 'citizen',
            label: 'ADUAN WARGA',
            subLabel: 'Laporan Masuk Sipil',
            count: countCitizen,
            icon: Users,
            activeColor: 'bg-amber-500/10 border-amber-450/50 text-amber-400',
            inactiveColor: 'bg-slate-900/30 border-slate-800/60 text-slate-450 hover:border-slate-700/80 hover:bg-slate-900/50',
            indicatorColor: 'bg-amber-500',
          },
          {
            id: 'active',
            label: 'KASUS AKTIF / LIDIK',
            subLabel: 'Penyelidikan & DPO',
            count: countActive,
            icon: Clock,
            activeColor: 'bg-rose-500/10 border-rose-450/50 text-rose-400',
            inactiveColor: 'bg-slate-900/30 border-slate-800/60 text-slate-450 hover:border-slate-700/80 hover:bg-slate-900/50',
            indicatorColor: 'bg-rose-500 animate-pulse',
          },
          {
            id: 'resolved',
            label: 'SELESAI / CLEAR',
            subLabel: 'Kasus Ditutup / Selesai',
            count: countResolved,
            icon: CheckCircle,
            activeColor: 'bg-emerald-500/10 border-emerald-450/50 text-emerald-400',
            inactiveColor: 'bg-slate-900/30 border-slate-800/60 text-slate-450 hover:border-slate-700/80 hover:bg-slate-900/50',
            indicatorColor: 'bg-emerald-500',
          }
        ].map((tab) => {
          const isActive = categoryFilter === tab.id;
          const IconComp = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setCategoryFilter(tab.id as any);
                setSelectedReportId(null);
              }}
              className={`border p-3.5 rounded-lg flex items-center justify-between transition-all duration-300 cursor-pointer text-left relative overflow-hidden group ${
                isActive ? tab.activeColor + ' shadow-md shadow-slate-950/40 ring-1 ring-slate-800/40' : tab.inactiveColor
              }`}
            >
              {isActive && (
                <div className={`absolute left-0 top-0 bottom-0 w-1 ${tab.indicatorColor}`} />
              )}
              
              <div className="space-y-1 z-10">
                <p className="text-[10px] font-black tracking-widest uppercase flex items-center gap-1.5">
                  <IconComp className={`w-3.5 h-3.5 ${isActive ? '' : 'text-slate-500'}`} />
                  {tab.label}
                </p>
                <p className="text-[9px] text-slate-500 group-hover:text-slate-400 transition-colors font-sans font-normal">
                  {tab.subLabel}
                </p>
              </div>

              <div className="text-right z-10 shrink-0 ml-2">
                <span className={`text-base font-bold font-mono tracking-tighter ${isActive ? 'scale-105' : 'text-slate-500'} block transition-all`}>
                  {tab.count}
                </span>
                <span className="text-[7.5px] uppercase font-black px-1 py-0.2 rounded bg-slate-950/80 border border-slate-850 text-slate-450">
                  Berkas
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* FILTER & SEARCH PANEL */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 shadow-lg text-left grid grid-cols-1 md:grid-cols-12 gap-3">
        <div className="md:col-span-4 relative">
          <label className="block text-[9px] font-bold text-slate-450 uppercase mb-1 font-mono">Cari Kasus / Judul / Deskripsi / NIK</label>
          <div className="relative">
            <input
              type="text"
              placeholder="Masukkan kata kunci pencarian..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500 rounded p-2 pl-8 text-xs text-slate-200 placeholder-slate-600 outline-none font-mono"
            />
            <Search className="w-3.5 h-3.5 text-slate-550 absolute left-2.5 top-3" />
          </div>
        </div>

        <div className="md:col-span-3">
          <label className="block text-[9px] font-bold text-slate-450 uppercase mb-1 font-mono">Filter Petugas (Nama/Badge)</label>
          <input
            type="text"
            placeholder="Cari badge / nama aparat..."
            value={filterOfficer}
            onChange={(e) => setFilterOfficer(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500 rounded p-2 text-xs text-slate-200 placeholder-slate-600 outline-none font-mono"
          />
        </div>

        <div className="md:col-span-3">
          <label className="block text-[9px] font-bold text-slate-450 uppercase mb-1 font-mono">Filter Suspek (Nama/NIK)</label>
          <input
            type="text"
            placeholder="Cari NIK / nama suspek..."
            value={filterSuspect}
            onChange={(e) => setFilterSuspect(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500 rounded p-2 text-xs text-slate-200 placeholder-slate-600 outline-none font-mono"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-[9px] font-bold text-slate-450 uppercase mb-1 font-mono">Urutan Berkas</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500 rounded p-2 text-xs text-slate-350 outline-none cursor-pointer font-sans"
          >
            <option value="id-desc">ID Kasus (Terbaru)</option>
            <option value="id-asc">ID Kasus (Terlama)</option>
            <option value="date-desc">Tanggal (Terbaru)</option>
            <option value="date-asc">Tanggal (Terlama)</option>
          </select>
        </div>
      </div>

      {/* CASES LEDGER TABLE */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden shadow-lg text-left">
        <div className="bg-slate-850 px-4 py-2 border-b border-slate-800 flex justify-between items-center">
          <span className="text-[10px] font-bold font-mono text-slate-400 uppercase tracking-widest">BERKAS ACARA KRIMINAL TERDAFTAR ({sortedReports.length} DITEMUKAN)</span>
        </div>

        <div className="p-4 space-y-2.5">
          {sortedReports.length === 0 ? (
            <div className="text-center py-12 text-slate-500 font-mono text-xs italic">
              Tidak ada dokumen kasus yang sesuai dengan filter pencarian Anda.
            </div>
          ) : (
            sortedReports.map((rep) => {
              const isSelected = selectedReportId === rep.id;
              return (
                <div
                  key={rep.id}
                  className={`border rounded transition-all duration-200 ${
                    isSelected ? 'border-sky-600 bg-slate-950/90 shadow-lg shadow-sky-950/20' : 'border-slate-800 bg-slate-950/40 hover:bg-slate-950/60'
                  }`}
                >
                  {/* Ledger Header */}
                  <div
                    onClick={() => setSelectedReportId(isSelected ? null : rep.id)}
                    className="px-4 py-3 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-start sm:items-center space-x-3 flex-1 min-w-0">
                      <span className={`text-[10.5px] font-mono font-bold border px-2 py-0.5 rounded shrink-0 ${
                        isSelected ? 'bg-sky-950 text-sky-400 border-sky-800' : 'bg-slate-900 text-slate-400 border-slate-800'
                      }`}>
                        {rep.id}
                      </span>

                      {/* STATUS & TYPE BADGES */}
                      <div className="flex flex-wrap gap-1 items-center shrink-0">
                        {rep.type === 'Citizen' ? (
                          <span className="text-[9px] bg-amber-955/40 text-amber-300 border border-amber-900/40 px-1.5 py-0.5 rounded font-bold font-mono uppercase">
                            Warga
                          </span>
                        ) : (
                          <span className="text-[9px] bg-sky-955/40 text-sky-300 border border-sky-900/40 px-1.5 py-0.5 rounded font-bold font-mono uppercase">
                            10-15 LSPD
                          </span>
                        )}
                        {rep.status === 'Penyelidikan' && (
                          <span className="text-[9px] bg-amber-955/80 text-amber-400 border border-amber-800 px-1.5 py-0.5 rounded font-bold font-mono uppercase">
                            Lidik
                          </span>
                        )}
                        {rep.status === 'DPO' && (
                          <span className="text-[9px] bg-red-955/80 text-rose-400 border border-red-900 px-1.5 py-0.5 rounded font-bold font-mono uppercase animate-pulse">
                            DPO
                          </span>
                        )}
                        {rep.status === 'Selesai' && (
                          <span className="text-[9px] bg-emerald-955/80 text-emerald-400 border border-emerald-900 px-1.5 py-0.5 rounded font-bold font-mono uppercase">
                            Selesai
                          </span>
                        )}
                      </div>

                      <div className="truncate">
                        <h4 className="text-xs font-bold text-slate-200 truncate">{rep.title}</h4>
                        <p className="text-[10px] text-slate-500 font-mono mt-0.5 truncate">
                          Suspek: <span className="text-slate-300 font-bold">{rep.suspectName}</span> | 
                          Aparat: <span className="text-slate-400">{rep.officerName} ({rep.officerBadge})</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end space-x-4 font-mono shrink-0">
                      <div className="text-[11px] text-slate-450 text-right hidden md:block">
                        <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {new Date(rep.date).toLocaleDateString('id-ID')}</span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] bg-red-950/60 border border-red-900 text-rose-350 px-2 py-0.5 rounded font-bold">
                          ${rep.totalFine.toLocaleString()}
                        </span>
                        <span className="text-[10px] bg-amber-955 border border-amber-900 text-amber-350 px-2 py-0.5 rounded font-bold">
                          {rep.totalJailTime} BULAN
                        </span>
                        {isSelected ? <ChevronUp className="w-4 h-4 text-slate-450" /> : <ChevronDown className="w-4 h-4 text-slate-455" />}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Report Details Drawer */}
                  <AnimatePresence>
                    {isSelected && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden border-t border-slate-900 bg-slate-950/80 px-5 py-5 space-y-4"
                      >
                        {/* Meta Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-4 bg-slate-900/40 p-4 rounded-lg border border-slate-900 font-mono text-[11px] text-slate-300">
                          <div className="space-y-1 border-r border-slate-900 pr-2">
                            <span className="text-[9px] text-slate-500 uppercase block">IDENTITAS SUSPEK</span>
                            <div className="space-y-0.5">
                              {rep.suspectId === 'LIDIK' ? (
                                <p className="font-bold text-amber-450 font-mono text-[10px]">🕵️ TIDAK DIKETAHUI / LIDIK</p>
                              ) : (
                                <>
                                  <p className="font-bold text-slate-100">{rep.suspectName}</p>
                                  <p className="text-slate-450">NIK: {rep.suspectId}</p>
                                  <button
                                    onClick={() => {
                                      setSelectedCitizenId(rep.suspectId);
                                      setActiveTab('citizens');
                                    }}
                                    className="mt-1 text-[9px] text-sky-400 hover:underline flex items-center gap-1 cursor-pointer font-mono"
                                  >
                                    <Users className="w-3 h-3" /> Buka Profil Suspek
                                  </button>
                                </>
                              )}
                            </div>
                          </div>

                          <div className="space-y-1 border-r border-slate-900 pr-2">
                            <span className="text-[9px] text-slate-500 uppercase block">APARAT PENYIDIK</span>
                            <div className="space-y-0.5 font-sans">
                              <p className="font-bold text-slate-100">{rep.officerName}</p>
                              <p className="text-slate-455 font-mono">Badge: {rep.officerBadge}</p>
                            </div>
                          </div>

                          {rep.type === 'Citizen' && rep.reporterName ? (() => {
                            const foundReporterCitizen = citizens.find(
                              (c) => `${c.firstName} ${c.lastName}`.toLowerCase() === rep.reporterName?.toLowerCase()
                            );
                            return (
                              <div className="space-y-1 border-r border-slate-900 pr-2">
                                <span className="text-[9px] text-amber-400 uppercase block font-mono">WARGA PELAPOR</span>
                                <p className="font-bold text-amber-300 font-sans">{rep.reporterName}</p>
                                {foundReporterCitizen ? (
                                  <div className="space-y-1">
                                    <span className="inline-flex items-center gap-1 text-[8.5px] bg-emerald-950/60 border border-emerald-900/40 text-emerald-400 px-1.5 py-0.2 rounded font-bold uppercase tracking-wider font-mono">
                                      ✓ Terdaftar Sipil
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setSelectedCitizenId(foundReporterCitizen.id);
                                        setActiveTab('citizens');
                                      }}
                                      className="text-[8px] text-sky-400 hover:underline block font-mono text-left cursor-pointer"
                                    >
                                      Buka Profil
                                    </button>
                                  </div>
                                ) : (
                                  <p className="text-[8.5px] text-slate-500 italic font-mono">Input Manual (Non-Sipil)</p>
                                )}
                              </div>
                            );
                          })() : (
                            <div className="space-y-1 border-r border-slate-900 pr-2">
                              <span className="text-[9px] text-slate-500 uppercase block">SUMBER BERKAS</span>
                              <p className="font-bold text-sky-400">10-15 LSPD Internal</p>
                              <p className="text-[9.5px] text-slate-500 italic">Laporan Kepolisian</p>
                            </div>
                          )}

                          <div className="space-y-1 border-r border-slate-900 pr-2 font-sans">
                            <span className="text-[9px] text-slate-500 uppercase block font-mono">PETUGAS PENDAMPING</span>
                            <p className="font-bold text-slate-200">
                              {rep.assistingOfficers ? rep.assistingOfficers : 'Tidak Ada'}
                            </p>
                          </div>

                          <div className="space-y-1 font-mono">
                            <span className="text-[9px] text-slate-500 uppercase block">TANGGAL REKOD</span>
                            <p className="font-bold text-slate-200">{new Date(rep.date).toLocaleString('id-ID')}</p>
                          </div>
                        </div>

                        {/* Charges breakdown */}
                        <div className="space-y-1.5">
                          <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider flex items-center gap-1">
                            <Scale className="w-3.5 h-3.5 text-sky-400" /> DAFTAR DAKWAAN & UNDANG-UNDANG PASAL:
                          </span>
                          <div className="flex flex-wrap gap-2">
                            {rep.charges.map((ch, idx) => (
                              <div
                                key={idx}
                                className="bg-slate-900 border border-slate-800 rounded p-2 flex flex-col font-mono text-[10.5px] text-slate-300 min-w-[150px] relative"
                              >
                                <span className="font-bold text-slate-200 truncate">{ch.title}</span>
                                <span className="text-[9px] text-slate-500 truncate mb-1">{ch.category}</span>
                                <div className="flex justify-between border-t border-slate-950 pt-1 mt-auto text-[9.5px]">
                                  <span className="text-red-400 font-bold">${ch.fine.toLocaleString()}</span>
                                  <span className="text-amber-400 font-bold">{ch.jailTime} Bulan</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Description Chronology */}
                        <div className="space-y-1 bg-slate-900/20 border border-slate-900 p-4 rounded-lg">
                          <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider block mb-1">BERITA ACARA KRONOLOGI (BAP):</span>
                          <p className="text-xs text-slate-300 font-sans leading-relaxed whitespace-pre-wrap">{rep.description}</p>
                        </div>

                        {/* GALLERY OR SINGLE IMAGE DISPLAY */}
                        {((rep.evidenceImages && rep.evidenceImages.length > 0) || rep.imageUrl) && (
                          <div className="space-y-2">
                            <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider flex items-center gap-1">
                              <Camera className="w-3.5 h-3.5 text-sky-400" /> ALBUM ALAT BUKTI KASUS & MUGSHOT:
                            </span>
                            
                            {rep.evidenceImages && rep.evidenceImages.length > 0 ? (
                              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3 bg-slate-900/60 p-3 rounded border border-slate-900/80">
                                {rep.evidenceImages.map((img) => (
                                  <div 
                                    key={img.id} 
                                    onClick={() => setZoomedImage({ url: img.url, caption: img.caption })}
                                    className="bg-slate-950 border border-slate-850 p-1.5 rounded-md flex flex-col space-y-1 group relative cursor-zoom-in hover:border-sky-500/50 transition-colors"
                                  >
                                    <div className="aspect-[4/3] w-full bg-slate-900 rounded overflow-hidden border border-slate-900 relative">
                                      <img
                                        src={img.url}
                                        alt={img.caption}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                        referrerPolicy="no-referrer"
                                        onError={(e) => {
                                          e.currentTarget.src = 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&q=80&w=300';
                                        }}
                                      />
                                      <span className={`absolute top-0.5 left-0.5 text-[7px] px-1.5 py-0.2 rounded font-bold font-mono uppercase tracking-wider ${
                                        img.type === 'mugshot' 
                                          ? 'bg-amber-500 text-slate-950' 
                                          : img.type === 'evidence' 
                                            ? 'bg-rose-500 text-slate-50' 
                                            : 'bg-slate-700 text-slate-100'
                                      }`}>
                                        {img.type === 'mugshot' ? 'Mugshot' : img.type === 'evidence' ? 'Bukti' : 'Lainnya'}
                                      </span>
                                    </div>
                                    <div className="px-0.5 text-left truncate">
                                      <p className="text-[9.5px] font-sans text-slate-300 font-bold truncate" title={img.caption}>{img.caption}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              // Fallback for legacy report imageUrl
                              <div 
                                onClick={() => setZoomedImage({ url: rep.imageUrl!, caption: 'Foto Kasus Utama' })}
                                className="bg-slate-900 border border-slate-805 p-2 rounded-lg max-w-xs cursor-pointer hover:border-sky-500/50 transition-colors inline-block"
                              >
                                <div className="bg-slate-950 border border-slate-900 rounded p-1">
                                  <img
                                    src={rep.imageUrl}
                                    alt="Barang Bukti / TKP"
                                    className="w-full h-32 object-cover rounded"
                                    referrerPolicy="no-referrer"
                                    onError={(e) => {
                                      e.currentTarget.style.display = 'none';
                                    }}
                                  />
                                </div>
                                <p className="text-[9px] text-slate-500 mt-1 italic text-center font-mono">Foto Kasus Utama (Klik untuk Zoom)</p>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Control Actions */}
                        <div className="pt-3 border-t border-slate-900 flex justify-between gap-3 font-mono">
                          {!isCadet ? (
                            <button
                              onClick={(e) => handleDelete(rep.id, e)}
                              className="bg-red-950/40 hover:bg-red-950 border border-red-900/60 hover:border-red-800 text-rose-400 px-3 py-2 rounded text-xs cursor-pointer flex items-center gap-1.5 transition-colors uppercase font-bold"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Hapus Laporan
                            </button>
                          ) : (
                            <div />
                          )}

                          <div className="flex space-x-2">
                            <button
                              onClick={() => {
                                handlePrint(rep);
                              }}
                              className="bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 px-3 py-2 rounded text-xs cursor-pointer flex items-center gap-1.5 transition-colors uppercase font-bold"
                            >
                              <Printer className="w-3.5 h-3.5" />
                              Cetak Berkas
                            </button>

                            {!isCadet && (
                              <button
                                onClick={() => {
                                  setEditingReportId(rep.id);
                                  setActiveTab('reports');
                                }}
                                className="bg-amber-500 hover:bg-amber-450 text-slate-950 px-4 py-2 rounded text-xs font-bold cursor-pointer flex items-center gap-1.5 hover:scale-[1.02] active:scale-[0.98] transition-all uppercase"
                              >
                                <Edit className="w-3.5 h-3.5" />
                                Edit Laporan Kasus
                              </button>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ZOOMED IMAGE LIGHTBOX OVERLAY */}
      <AnimatePresence>
        {zoomedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setZoomedImage(null)}
            className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex flex-col items-center justify-center p-4 cursor-zoom-out"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="max-w-4xl max-h-[85vh] bg-slate-900 border border-slate-800 p-2 rounded-lg shadow-2xl relative flex flex-col items-center"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setZoomedImage(null)}
                className="absolute -top-10 right-0 text-slate-400 hover:text-slate-100 font-mono text-xs font-bold flex items-center gap-1 bg-slate-900/80 border border-slate-800 px-3 py-1.5 rounded cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" /> SELESAI / TUTUP
              </button>
              
              <img
                src={zoomedImage.url}
                alt={zoomedImage.caption}
                className="max-w-full max-h-[70vh] object-contain rounded border border-slate-950 shadow-lg"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  e.currentTarget.src = 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&q=80&w=600';
                }}
              />
              
              <div className="mt-3 text-center px-4 py-1 pb-2">
                <p className="text-xs font-bold text-slate-200 font-sans">{zoomedImage.caption}</p>
                <p className="text-[9px] text-slate-500 font-mono mt-1 uppercase tracking-widest">LSPD DIGITAL EVIDENCE ARCHIVE SYSTEM</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SEKSI UNTUK CETAK BERKAS LAPORAN SECARA NYATA (HANYA MUNCUL SAAT PRINT) */}
      {reportToPrint && createPortal(
        <div className="printable-area hidden print:block text-black bg-white p-8 font-mono text-xs leading-relaxed">
          {/* Header LSPD dengan Stempel Waktu */}
          <div className="border-b-4 border-double border-black pb-4 mb-5">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <img src={lspdLogo} alt="LSPD Emblem" className="w-16 h-16 object-contain border border-black rounded p-0.5" referrerPolicy="no-referrer" />
                <div className="text-left">
                  <h1 className="text-lg font-black tracking-wider uppercase text-black font-mono">LOS SANTOS POLICE DEPARTMENT</h1>
                  <p className="text-[10px] uppercase font-bold text-black font-mono">SISTEM INTEGRASI REKOR KEPOLISIAN - MOBILE DATA TERMINAL</p>
                  <p className="text-[8.5px] text-gray-700 font-bold uppercase tracking-wide">DIVISI PENYIDIKAN KRIMINAL & PENINDAKAN HUKUM RESMI</p>
                </div>
              </div>
              <div className="text-right border border-black p-2 bg-gray-50 rounded min-w-[210px] font-mono">
                <div className="text-[8px] uppercase font-bold text-gray-600">STEMPEL WAKTU CETAK DOKUMEN</div>
                <div className="text-[10px] font-black text-black">{new Date().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'medium' })}</div>
                <div className="text-[7.5px] text-gray-500 mt-0.5">REGISTER: {reportToPrint.id} • STATUS: RESMI</div>
              </div>
            </div>
          </div>

          <div className="text-center mb-5 border-b border-black pb-3">
            <h2 className="text-xs font-black underline uppercase tracking-widest text-black font-mono">
              BERITA ACARA PEMERIKSAAN KASUS & LAPORAN INSIDEN
            </h2>
            <div className="flex items-center justify-center gap-4 text-[9.5px] text-gray-700 font-mono mt-1 font-semibold">
              <span>NO. BERKAS: <strong className="text-black">{reportToPrint.id}</strong></span>
              <span>•</span>
              <span>KLASIFIKASI: <strong className="text-black uppercase">{reportToPrint.type === 'Citizen' ? 'LAPORAN WARGA / SAKSI' : 'LAPORAN INTERNAL 10-15'}</strong></span>
              <span>•</span>
              <span>STATUS: <strong className="text-black uppercase">{reportToPrint.status || 'Selesai'}</strong></span>
            </div>
          </div>

          {/* Rincian Berkas */}
          <div className="grid grid-cols-2 gap-y-2 border border-black p-4 mb-5 bg-gray-50 rounded">
            <div>
              <p className="font-bold text-black text-[10px] uppercase border-b border-gray-400 pb-1 mb-2">METADATA LAPORAN:</p>
              <table className="w-full text-left text-[10px] leading-normal">
                <tbody>
                  <tr>
                    <td className="font-bold pr-2 pb-1 text-gray-650 w-28">ID BERKAS:</td>
                    <td className="pb-1 font-mono font-bold text-black">{reportToPrint.id}</td>
                  </tr>
                  <tr>
                    <td className="font-bold pr-2 pb-1 text-gray-650">JUDUL KASUS:</td>
                    <td className="pb-1 font-sans font-bold text-black">{reportToPrint.title}</td>
                  </tr>
                  <tr>
                    <td className="font-bold pr-2 pb-1 text-gray-650">WAKTU INPUT:</td>
                    <td className="pb-1 font-mono text-black">{new Date(reportToPrint.date).toLocaleString('id-ID')}</td>
                  </tr>
                  <tr>
                    <td className="font-bold pr-2 pb-1 text-gray-650">TIPE BERKAS:</td>
                    <td className="pb-1 font-bold text-black uppercase">{reportToPrint.type === 'Citizen' ? 'Laporan Warga' : 'Laporan Petugas (LSPD)'}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="border-l border-gray-300 pl-4">
              <p className="font-bold text-black text-[10px] uppercase border-b border-gray-400 pb-1 mb-2">DATA PIHAK TERKAIT:</p>
              <table className="w-full text-left text-[10px] leading-normal">
                <tbody>
                  <tr>
                    <td className="font-bold pr-2 pb-1 text-gray-650 w-28">TERSANGKA:</td>
                    <td className="pb-1 font-sans font-bold text-black">{reportToPrint.suspectName}</td>
                  </tr>
                  <tr>
                    <td className="font-bold pr-2 pb-1 text-gray-650">PENYIDIK (LSPD):</td>
                    <td className="pb-1 font-sans font-bold text-black">{reportToPrint.officerName} (LSPD-{reportToPrint.officerBadge})</td>
                  </tr>
                  <tr>
                    <td className="font-bold pr-2 pb-1 text-gray-650">PELAPOR:</td>
                    <td className="pb-1 text-black font-sans">{reportToPrint.reporterName || 'Saksi / Laporan Warga'}</td>
                  </tr>
                  <tr>
                    <td className="font-bold pr-2 pb-1 text-gray-650">STATUS HUKUM:</td>
                    <td className="pb-1 font-bold text-black uppercase">{reportToPrint.status || 'Selesai'}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Kronologis / Narasi */}
          <div className="mb-5">
            <h3 className="font-bold text-[10px] border-b border-black pb-1 mb-2 uppercase tracking-wide text-black font-mono">
              KRONOLOGIS / DESKRIPSI KEJADIAN:
            </h3>
            <div className="border border-black p-3.5 bg-gray-50/60 rounded text-[10.5px] whitespace-pre-wrap leading-relaxed font-sans min-h-[90px] text-justify text-black">
              {reportToPrint.description || 'Tidak ada uraian kronologis tertulis.'}
            </div>
          </div>

          {/* Daftar Dakwaan / Tuntutan Hukum */}
          <div className="mb-5">
            <h3 className="font-bold text-[10px] border-b border-black pb-1 mb-2 uppercase tracking-wide text-black font-mono">
              DAFTAR TUNTUTAN & UNDANG-UNDANG PELANGGARAN KUHP:
            </h3>
            <table className="w-full text-[10px] border-collapse border border-black mt-1.5">
              <thead>
                <tr className="bg-gray-100 text-black border-b border-black font-bold uppercase">
                  <th className="border border-black p-2 text-center w-8 text-black">No</th>
                  <th className="border border-black p-2 text-left text-black">Pasal & Nama Pelanggaran</th>
                  <th className="border border-black p-2 text-center w-28 text-black">Denda ($)</th>
                  <th className="border border-black p-2 text-center w-28 text-black">Hukuman Kurungan</th>
                </tr>
              </thead>
              <tbody>
                {reportToPrint.charges && reportToPrint.charges.length > 0 ? (
                  reportToPrint.charges.map((chg, idx) => (
                    <tr key={idx} className="border-b border-black text-black">
                      <td className="border border-black p-2 text-center text-black font-mono">{idx + 1}</td>
                      <td className="border border-black p-2 text-left text-black">
                        <div className="font-bold text-black font-mono">{chg.title}</div>
                        <div className="text-[8.5px] text-gray-700 italic font-sans">{chg.description}</div>
                      </td>
                      <td className="border border-black p-2 text-center font-bold text-black font-mono">${chg.fine.toLocaleString()}</td>
                      <td className="border border-black p-2 text-center text-black font-mono">{chg.jailTime} Bulan/Menit</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="border border-black p-4 text-center italic text-gray-600">
                      Tidak ada pasal atau pelanggaran terlampir pada berkas ini.
                    </td>
                  </tr>
                )}
                {/* Total Row */}
                <tr className="bg-gray-100 font-bold border-t-2 border-black font-mono">
                  <td colSpan={2} className="border border-black p-2 text-right uppercase font-bold text-[10.5px] text-black">Akumulasi Sanksi Hukum:</td>
                  <td className="border border-black p-2 text-center font-bold text-[10.5px] text-black">${reportToPrint.totalFine.toLocaleString()}</td>
                  <td className="border border-black p-2 text-center font-bold text-[10.5px] text-black">{reportToPrint.totalJailTime} Bulan/Menit</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Bukti Fisik / Mugshot Gambar */}
          {reportToPrint.imageUrl && (
            <div className="mb-5 avoid-break">
              <h3 className="font-bold text-[10px] border-b border-black pb-1 mb-2 uppercase tracking-wide text-black font-mono">
                LAMPIRAN BUKTI FISIK & FOTO DIGITAL:
              </h3>
              <div className="border border-black p-3 bg-gray-50 flex flex-col items-center justify-center rounded">
                <img 
                  src={reportToPrint.imageUrl} 
                  alt="Bukti Kejahatan / Suspect" 
                  className="max-h-[200px] object-contain border border-black" 
                  referrerPolicy="no-referrer"
                />
                <span className="text-[8px] text-gray-700 mt-1 font-bold font-mono">DOKUMEN INTEGRITAS BARANG BUKTI LSPD</span>
              </div>
            </div>
          )}

          {/* Garis Tanda Tangan untuk Petugas Pelaporan */}
          <div className="mt-8 pt-4 grid grid-cols-2 gap-8 text-center avoid-break">
            <div className="border border-black p-3.5 bg-gray-50/60 rounded flex flex-col justify-between">
              <div>
                <p className="text-black uppercase font-bold text-[9px] tracking-wider font-mono">PETUGAS PELAPOR / PENYIDIK (REPORTING OFFICER)</p>
                <p className="text-[8px] text-gray-600 italic mt-0.5">Telah memeriksa dan mengesahkan seluruh isi laporan</p>
              </div>
              <div className="my-8">
                <div className="w-48 mx-auto border-b-2 border-black"></div>
              </div>
              <div>
                <p className="font-black uppercase text-[11px] text-black font-mono">{reportToPrint.officerName}</p>
                <p className="text-[9px] text-gray-800 font-mono font-bold">PENYIDIK UTAMA KASUS</p>
                <p className="text-[8.5px] text-gray-650 font-mono">LENCANA: LSPD-{reportToPrint.officerBadge} • TGL: {new Date().toLocaleDateString('id-ID', { dateStyle: 'long' })}</p>
              </div>
            </div>

            <div className="border border-black p-3.5 bg-gray-50/60 rounded flex flex-col justify-between">
              <div>
                <p className="text-black uppercase font-bold text-[9px] tracking-wider font-mono">DIVISI PENGAWAS & ARSIP MDT LSPD</p>
                <p className="text-[8px] text-gray-600 italic mt-0.5">Tercatat permanen dalam pangkalan data Kepolisian</p>
              </div>
              <div className="my-8">
                <div className="w-48 mx-auto border-b-2 border-black"></div>
              </div>
              <div>
                <p className="font-black uppercase text-[11px] text-black font-mono">LOS SANTOS POLICE DEPT</p>
                <p className="text-[9px] text-gray-800 font-mono font-bold">CENTRAL COMMAND & INTERNAL AFFAIRS</p>
                <p className="text-[8.5px] text-gray-650 font-mono">STATUS: DOKUMEN HUKUM TERVERIFIKASI SISTEM</p>
              </div>
            </div>
          </div>

          {/* Bagian Disclaimer di Bagian Bawah untuk Pencatatan Resmi */}
          <div className="mt-6 border-2 border-black p-3.5 bg-gray-100 rounded text-black text-[8.5px] leading-relaxed text-justify avoid-break font-sans">
            <div className="font-bold uppercase tracking-wider text-[9px] font-mono border-b border-black pb-1 mb-1.5 flex items-center justify-between">
              <span>DISCLAIMER & KLAUSUL HUKUM PENCATATAN RESMI (OFFICIAL RECORD NOTICE)</span>
              <span className="font-mono text-[8px] text-gray-600">REF: MDT-LSPD-SEC-DOC</span>
            </div>
            <p className="mb-1 text-gray-900">
              <strong>1. KEKUATAN HUKUM:</strong> Berkas Berita Acara Pemeriksaan (BAP) ini diterbitkan secara sah melalui sistem terintegrasi Mobile Data Terminal (MDT) Kepolisian Kota Los Santos (LSPD). Segala pasal sangkaan, denda pidana, dan hukuman kurungan yang termuat di dalamnya berkekuatan hukum tetap sesuai dengan San Andreas Penal Code.
            </p>
            <p className="mb-1 text-gray-900">
              <strong>2. LARANGAN PEMALSUAN:</strong> Dilarang keras memalsukan, mengubah, menduplikasi tanpa izin, atau membocorkan materi berkas ini kepada pihak ketiga yang tidak berwenang. Segala bentuk pelanggaran integritas dokumen ini merupakan tindak pidana perusakan dan pemalsuan rekaman resmi kepolisian.
            </p>
            <p className="text-gray-900">
              <strong>3. PENCATATAN SISTEM:</strong> Salinan dokumen ini tersimpan secara permanen dalam arsip forensik basis data LSPD dan sah dipergunakan sebagai bukti dalam persidangan pengadilan pidana.
            </p>
            <div className="border-t border-gray-400 mt-1.5 pt-1 text-[7.5px] text-gray-600 font-mono flex justify-between">
              <span>KODE INTEGRITAS ELEKTRONIK: MDT-LSPD-VERIFIED-RECORD</span>
              <span>DOKUMEN RESMI KEPOLISIAN KOTA LOS SANTOS</span>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* SCREEN MODAL FOR PRINT PREVIEW & CLIPBOARD SHARING */}
      {reportToPrint && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/90 backdrop-blur-md p-4 overflow-y-auto print:hidden">
          {/* Top Control Bar */}
          <div className="bg-slate-900 border border-slate-800 rounded-t-lg p-4 w-full max-w-3xl flex flex-wrap items-center justify-between gap-3 shadow-xl text-left">
            <div className="flex items-center space-x-2">
              <Printer className="w-5 h-5 text-sky-400 animate-pulse" />
              <span className="text-xs font-bold font-mono uppercase tracking-wider text-slate-100">Pratinjau Dokumen LSPD</span>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={async () => {
                  const text = `=== LOS SANTOS POLICE DEPARTMENT ===\nSISTEM INTEGRASI REKOR KEPOLISIAN - MOBILE DATA TERMINAL\n\nBERITA ACARA PEMERIKSAAN KASUS\nID Dokumen: ${reportToPrint.id}\nJudul Kasus: ${reportToPrint.title}\nTanggal Input: ${new Date(reportToPrint.date).toLocaleString('id-ID')}\nTipe Berkas: ${reportToPrint.type === 'Citizen' ? 'Laporan Warga' : 'Laporan Petugas (LSPD)'}\n\nMETADATA PIHAK TERKAIT\nTersangka: ${reportToPrint.suspectName}\nPenyidik: ${reportToPrint.officerName} (LSPD-${reportToPrint.officerBadge})\nPelapor: ${reportToPrint.reporterName || 'Saksi / Laporan Warga'}\nStatus Hukum: ${reportToPrint.status || 'Selesai'}\n\nKRONOLOGIS / DESKRIPSI KEJADIAN\n${reportToPrint.description || 'Tidak ada uraian kronologis tertulis.'}\n\nDAFTAR TUNTUTAN\n${reportToPrint.charges && reportToPrint.charges.length > 0 ? reportToPrint.charges.map((chg, idx) => `${idx + 1}. ${chg.title} - Denda: $${chg.fine} - Kurungan: ${chg.jailTime} Menit`).join('\n') : 'Tidak ada'}\n\nTOTAL DENDA: $${reportToPrint.totalFine.toLocaleString()}\nTOTAL KURUNGAN: ${reportToPrint.totalJailTime} Bulan/Menit\n===================================`;
                  const copied = await copyToClipboard(text);
                  if (copied) {
                    setCopiedSuccess(true);
                    setTimeout(() => setCopiedSuccess(false), 2000);
                  } else {
                    setManualCopyText(text);
                  }
                }}
                className="bg-sky-600 hover:bg-sky-550 text-slate-950 font-bold font-mono text-xs px-3.5 py-2 rounded cursor-pointer flex items-center gap-1.5 transition-colors uppercase"
              >
                {copiedSuccess ? '✅ BERHASIL DISALIN!' : '📋 SALIN TEKS (DISCORD)'}
              </button>
              
              <button
                onClick={() => {
                  try {
                    window.print();
                  } catch (e) {
                    console.error("Print blocked", e);
                  }
                }}
                className="bg-emerald-600 hover:bg-emerald-550 text-white font-bold font-mono text-xs px-3.5 py-2 rounded cursor-pointer flex items-center gap-1.5 transition-colors uppercase"
              >
                <Printer className="w-3.5 h-3.5" />
                Cetak Fisik
              </button>
              
              <button
                onClick={() => setReportToPrint(null)}
                className="bg-slate-850 hover:bg-slate-800 border border-slate-700 text-slate-300 font-bold font-mono text-xs px-3 py-2 rounded cursor-pointer flex items-center transition-colors"
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
                    <p className="text-[8.5px] text-gray-700 font-bold uppercase tracking-wide">DIVISI PENYIDIKAN KRIMINAL & PENINDAKAN HUKUM RESMI</p>
                  </div>
                </div>
                <div className="text-right border border-black p-2 bg-gray-50 rounded min-w-[210px] font-mono self-stretch sm:self-auto">
                  <div className="text-[8px] uppercase font-bold text-gray-600">STEMPEL WAKTU CETAK DOKUMEN</div>
                  <div className="text-[10px] font-black text-black">{new Date().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'medium' })}</div>
                  <div className="text-[7.5px] text-gray-500 mt-0.5">REGISTER: {reportToPrint.id} • STATUS: RESMI</div>
                </div>
              </div>
            </div>

            <div className="text-center mb-5 border-b border-black pb-3">
              <h2 className="text-xs font-black underline uppercase tracking-widest text-black font-mono">
                BERITA ACARA PEMERIKSAAN KASUS & LAPORAN INSIDEN
              </h2>
              <div className="flex flex-wrap items-center justify-center gap-3 text-[9.5px] text-gray-700 font-mono mt-1 font-semibold">
                <span>NO. BERKAS: <strong className="text-black">{reportToPrint.id}</strong></span>
                <span>•</span>
                <span>KLASIFIKASI: <strong className="text-black uppercase">{reportToPrint.type === 'Citizen' ? 'LAPORAN WARGA / SAKSI' : 'LAPORAN INTERNAL 10-15'}</strong></span>
                <span>•</span>
                <span>STATUS: <strong className="text-black uppercase">{reportToPrint.status || 'Selesai'}</strong></span>
              </div>
            </div>

            {/* Rincian Berkas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border border-black p-4 mb-5 bg-gray-50 rounded">
              <div>
                <p className="font-bold text-black text-[10px] uppercase border-b border-gray-400 pb-1 mb-2">METADATA LAPORAN:</p>
                <table className="w-full text-left text-[10px] leading-normal">
                  <tbody>
                    <tr>
                      <td className="font-bold pr-2 pb-1 text-gray-600 w-28">ID BERKAS:</td>
                      <td className="pb-1 font-mono font-bold text-black">{reportToPrint.id}</td>
                    </tr>
                    <tr>
                      <td className="font-bold pr-2 pb-1 text-gray-600">JUDUL KASUS:</td>
                      <td className="pb-1 font-sans font-bold text-black">{reportToPrint.title}</td>
                    </tr>
                    <tr>
                      <td className="font-bold pr-2 pb-1 text-gray-600">WAKTU INPUT:</td>
                      <td className="pb-1 font-mono text-black">{new Date(reportToPrint.date).toLocaleString('id-ID')}</td>
                    </tr>
                    <tr>
                      <td className="font-bold pr-2 pb-1 text-gray-600">TIPE BERKAS:</td>
                      <td className="pb-1 font-bold text-black uppercase">{reportToPrint.type === 'Citizen' ? 'Laporan Warga' : 'Laporan Petugas (LSPD)'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="border-t sm:border-t-0 sm:border-l border-gray-300 pt-3 sm:pt-0 sm:pl-4">
                <p className="font-bold text-black text-[10px] uppercase border-b border-gray-400 pb-1 mb-2">DATA PIHAK TERKAIT:</p>
                <table className="w-full text-left text-[10px] leading-normal">
                  <tbody>
                    <tr>
                      <td className="font-bold pr-2 pb-1 text-gray-600 w-28">TERSANGKA:</td>
                      <td className="pb-1 font-sans font-bold text-black">{reportToPrint.suspectName}</td>
                    </tr>
                    <tr>
                      <td className="font-bold pr-2 pb-1 text-gray-600">PENYIDIK (LSPD):</td>
                      <td className="pb-1 font-sans font-bold text-black">{reportToPrint.officerName} (LSPD-{reportToPrint.officerBadge})</td>
                    </tr>
                    <tr>
                      <td className="font-bold pr-2 pb-1 text-gray-600">PELAPOR:</td>
                      <td className="pb-1 text-black font-sans">{reportToPrint.reporterName || 'Saksi / Laporan Warga'}</td>
                    </tr>
                    <tr>
                      <td className="font-bold pr-2 pb-1 text-gray-600">STATUS HUKUM:</td>
                      <td className="pb-1 font-bold text-black uppercase">{reportToPrint.status || 'Selesai'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Kronologis / Narasi */}
            <div className="mb-5">
              <h3 className="font-bold text-[10px] border-b border-black pb-1 mb-2 uppercase tracking-wide text-black font-mono">
                KRONOLOGIS / DESKRIPSI KEJADIAN:
              </h3>
              <div className="border border-black p-3.5 bg-gray-50/60 rounded text-[10.5px] whitespace-pre-wrap leading-relaxed font-sans min-h-[90px] text-justify text-black">
                {reportToPrint.description || 'Tidak ada uraian kronologis tertulis.'}
              </div>
            </div>

            {/* Daftar Dakwaan / Tuntutan Hukum */}
            <div className="mb-5">
              <h3 className="font-bold text-[10px] border-b border-black pb-1 mb-2 uppercase tracking-wide text-black font-mono">
                DAFTAR TUNTUTAN & UNDANG-UNDANG PELANGGARAN KUHP:
              </h3>
              <table className="w-full text-[10px] border-collapse border border-black mt-1.5">
                <thead>
                  <tr className="bg-gray-100 text-black border-b border-black font-bold uppercase">
                    <th className="border border-black p-2 text-center w-8 text-black">No</th>
                    <th className="border border-black p-2 text-left text-black">Pasal & Nama Pelanggaran</th>
                    <th className="border border-black p-2 text-center w-28 text-black">Denda ($)</th>
                    <th className="border border-black p-2 text-center w-28 text-black">Hukuman Kurungan</th>
                  </tr>
                </thead>
                <tbody>
                  {reportToPrint.charges && reportToPrint.charges.length > 0 ? (
                    reportToPrint.charges.map((chg, idx) => (
                      <tr key={idx} className="border-b border-black text-black">
                        <td className="border border-black p-2 text-center text-black font-mono">{idx + 1}</td>
                        <td className="border border-black p-2 text-left text-black">
                          <div className="font-bold text-black font-mono">{chg.title}</div>
                          <div className="text-[8.5px] text-gray-650 italic font-sans">{chg.description}</div>
                        </td>
                        <td className="border border-black p-2 text-center font-bold text-black font-mono">${chg.fine.toLocaleString()}</td>
                        <td className="border border-black p-2 text-center text-black font-mono">{chg.jailTime} Bulan/Menit</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="border border-black p-4 text-center italic text-gray-500">
                        Tidak ada pasal atau pelanggaran terlampir pada berkas ini.
                      </td>
                    </tr>
                  )}
                  {/* Total Row */}
                  <tr className="bg-gray-100 font-bold border-t-2 border-black font-mono">
                    <td colSpan={2} className="border border-black p-2 text-right uppercase font-bold text-[10.5px] text-black">Akumulasi Sanksi Hukum:</td>
                    <td className="border border-black p-2 text-center font-bold text-[10.5px] text-black">${reportToPrint.totalFine.toLocaleString()}</td>
                    <td className="border border-black p-2 text-center font-bold text-[10.5px] text-black">{reportToPrint.totalJailTime} Bulan/Menit</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Bukti Fisik / Mugshot Gambar */}
            {reportToPrint.imageUrl && (
              <div className="mb-5 avoid-break">
                <h3 className="font-bold text-[10px] border-b border-black pb-1 mb-2 uppercase tracking-wide text-black font-mono">
                  LAMPIRAN BUKTI FISIK & FOTO DIGITAL:
                </h3>
                <div className="border border-black p-3 bg-gray-50 flex flex-col items-center justify-center rounded">
                  <img 
                    src={reportToPrint.imageUrl} 
                    alt="Bukti Kejahatan / Suspect" 
                    className="max-h-[180px] object-contain border border-black" 
                    referrerPolicy="no-referrer"
                  />
                  <span className="text-[8px] text-gray-600 mt-1.5 uppercase font-bold font-mono">DOKUMEN INTEGRITAS BARANG BUKTI LSPD</span>
                </div>
              </div>
            )}

            {/* Garis Tanda Tangan untuk Petugas Pelaporan */}
            <div className="mt-8 pt-4 grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8 text-center avoid-break">
              <div className="border border-black p-3.5 bg-gray-50/60 rounded flex flex-col justify-between">
                <div>
                  <p className="text-black uppercase font-bold text-[9px] tracking-wider font-mono">PETUGAS PELAPOR / PENYIDIK (REPORTING OFFICER)</p>
                  <p className="text-[8px] text-gray-600 italic mt-0.5">Telah memeriksa dan mengesahkan seluruh isi laporan</p>
                </div>
                <div className="my-8">
                  <div className="w-48 mx-auto border-b-2 border-black"></div>
                </div>
                <div>
                  <p className="font-black uppercase text-[11px] text-black font-mono">{reportToPrint.officerName}</p>
                  <p className="text-[9px] text-gray-800 font-mono font-bold">PENYIDIK UTAMA KASUS</p>
                  <p className="text-[8.5px] text-gray-650 font-mono">LENCANA: LSPD-{reportToPrint.officerBadge} • TGL: {new Date().toLocaleDateString('id-ID', { dateStyle: 'long' })}</p>
                </div>
              </div>

              <div className="border border-black p-3.5 bg-gray-50/60 rounded flex flex-col justify-between">
                <div>
                  <p className="text-black uppercase font-bold text-[9px] tracking-wider font-mono">DIVISI PENGAWAS & ARSIP MDT LSPD</p>
                  <p className="text-[8px] text-gray-600 italic mt-0.5">Tercatat permanen dalam pangkalan data Kepolisian</p>
                </div>
                <div className="my-8">
                  <div className="w-48 mx-auto border-b-2 border-black"></div>
                </div>
                <div>
                  <p className="font-black uppercase text-[11px] text-black font-mono">LOS SANTOS POLICE DEPT</p>
                  <p className="text-[9px] text-gray-800 font-mono font-bold">CENTRAL COMMAND & INTERNAL AFFAIRS</p>
                  <p className="text-[8.5px] text-gray-650 font-mono">STATUS: DOKUMEN HUKUM TERVERIFIKASI SISTEM</p>
                </div>
              </div>
            </div>

            {/* Bagian Disclaimer di Bagian Bawah untuk Pencatatan Resmi */}
            <div className="mt-6 border-2 border-black p-3.5 bg-gray-100 rounded text-black text-[8.5px] leading-relaxed text-justify avoid-break font-sans">
              <div className="font-bold uppercase tracking-wider text-[9px] font-mono border-b border-black pb-1 mb-1.5 flex items-center justify-between">
                <span>DISCLAIMER & KLAUSUL HUKUM PENCATATAN RESMI (OFFICIAL RECORD NOTICE)</span>
                <span className="font-mono text-[8px] text-gray-600">REF: MDT-LSPD-SEC-DOC</span>
              </div>
              <p className="mb-1 text-gray-900">
                <strong>1. KEKUATAN HUKUM:</strong> Berkas Berita Acara Pemeriksaan (BAP) ini diterbitkan secara sah melalui sistem terintegrasi Mobile Data Terminal (MDT) Kepolisian Kota Los Santos (LSPD). Segala pasal sangkaan, denda pidana, dan hukuman kurungan yang termuat di dalamnya berkekuatan hukum tetap sesuai dengan San Andreas Penal Code.
              </p>
              <p className="mb-1 text-gray-900">
                <strong>2. LARANGAN PEMALSUAN:</strong> Dilarang keras memalsukan, mengubah, menduplikasi tanpa izin, atau membocorkan materi berkas ini kepada pihak ketiga yang tidak berwenang. Segala bentuk pelanggaran integritas dokumen ini merupakan tindak pidana perusakan dan pemalsuan rekaman resmi kepolisian.
              </p>
              <p className="text-gray-900">
                <strong>3. PENCATATAN SISTEM:</strong> Salinan dokumen ini tersimpan secara permanen dalam arsip forensik basis data LSPD dan sah dipergunakan sebagai bukti dalam persidangan pengadilan pidana.
              </p>
              <div className="border-t border-gray-400 mt-1.5 pt-1 text-[7.5px] text-gray-600 font-mono flex justify-between">
                <span>KODE INTEGRITAS ELEKTRONIK: MDT-LSPD-VERIFIED-RECORD</span>
                <span>DOKUMEN RESMI KEPOLISIAN KOTA LOS SANTOS</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL KONFIRMASI HAPUS LAPORAN */}
      {reportToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in text-left">
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 max-w-sm w-full font-mono space-y-4 shadow-2xl">
            <div className="text-rose-500 flex items-center space-x-2 border-b border-slate-800 pb-2.5">
              <Trash2 className="w-5 h-5 text-rose-455" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-rose-450">HAPUS LAPORAN KASUS</h4>
            </div>
            <p className="text-xs text-slate-350 leading-relaxed">
              Apakah Anda yakin ingin menghapus arsip kasus kriminal <span className="text-rose-400 font-bold">#{reportToDelete}</span> secara permanen dari pangkalan data LSPD? 
              Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setReportToDelete(null)}
                className="flex-1 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-400 py-2 font-bold uppercase rounded text-[11px] cursor-pointer text-center"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteReport(reportToDelete);
                  if (selectedReportId === reportToDelete) {
                    setSelectedReportId(null);
                  }
                  setReportToDelete(null);
                }}
                className="flex-1 bg-rose-600 hover:bg-rose-500 text-white py-2 font-bold uppercase rounded text-[11px] cursor-pointer text-center"
              >
                Hapus Kasus
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Fallback manual copy dialog if clipboard API is blocked */}
      {manualCopyText && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 print:hidden">
          <div className="bg-slate-900 border border-slate-700 rounded-lg p-5 max-w-xl w-full shadow-2xl space-y-4 text-left">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-400" />
                Salin Teks Manual (Akses Clipboard Dibatasi)
              </h3>
              <button
                type="button"
                onClick={() => setManualCopyText(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-300">
              Izin clipboard otomatis dibatasi oleh frame peramban. Silakan klik teks di bawah (sudah otomatis terpilih) lalu tekan <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-sky-400 font-mono text-[11px]">Ctrl + C</kbd> atau <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-sky-400 font-mono text-[11px]">Cmd + C</kbd> untuk menyalin:
            </p>
            <textarea
              readOnly
              value={manualCopyText}
              onFocus={(e) => e.currentTarget.select()}
              autoFocus
              className="w-full h-44 bg-slate-950 border border-slate-800 rounded p-3 text-xs font-mono text-slate-200 resize-none focus:outline-none focus:border-sky-500 select-all"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setManualCopyText(null)}
                className="bg-sky-600 hover:bg-sky-500 text-slate-950 font-bold text-xs px-4 py-1.5 rounded font-mono"
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
