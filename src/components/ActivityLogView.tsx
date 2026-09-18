import React, { useState } from 'react';
import { useMdt } from '../context/MdtContext';
import { OfficerRank } from '../types';
import { ShieldAlert, Search, ListFilter, ClipboardList, Clock, Eye, FileCode, CheckCircle, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const ActivityLogView: React.FC = () => {
  const { activityLogs, currentOfficer } = useMdt();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedActionFilter, setSelectedActionFilter] = useState<string>('ALL');
  const [selectedModuleFilter, setSelectedModuleFilter] = useState<string>('ALL');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  // Authorization check: Only Chief of Police (rank_level 8 / OfficerRank.CHIEF) has access
  const isChiefOfPolice = currentOfficer?.rank === OfficerRank.CHIEF;

  if (!isChiefOfPolice) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center bg-[#0b0c10] border border-red-950/40 rounded-lg max-w-2xl mx-auto my-12" id="logs-unauthorized-card">
        <div className="p-4 bg-red-950/20 border border-red-900/30 rounded-full text-red-500 mb-4 animate-bounce">
          <ShieldAlert className="w-12 h-12" />
        </div>
        <h2 className="text-xl font-bold font-sans tracking-tight text-white mb-2 uppercase">AKSES DITOLAK / LOCKDOWN</h2>
        <p className="text-xs font-mono text-slate-400 mb-6 leading-relaxed max-w-md">
          Sesuai dengan regulasi Transparansi Tugas Kepolisian LSPD, Log Aktivitas audit database hanya boleh diakses secara khusus oleh <span className="text-red-400 font-bold">Chief of Police (CoP)</span> untuk menghindari kebocoran data taktis.
        </p>
        <div className="px-4 py-2.5 bg-slate-950 border border-slate-800 rounded text-[11px] font-mono text-slate-500">
          Kredensial Anda: <span className="text-slate-300 font-bold">{currentOfficer?.rank ?? 'Kadet'} ({currentOfficer?.name ?? 'Anonim'})</span>
        </div>
      </div>
    );
  }

  // Filtering
  const filteredLogs = activityLogs.filter((log) => {
    const q = searchQuery.toLowerCase();
    const matchSearch =
      log.description.toLowerCase().includes(q) ||
      log.officerName.toLowerCase().includes(q) ||
      log.officerBadge.toLowerCase().includes(q) ||
      log.id.toLowerCase().includes(q);

    const matchAction = selectedActionFilter === 'ALL' || log.action === selectedActionFilter;
    const matchModule = selectedModuleFilter === 'ALL' || log.module === selectedModuleFilter;

    return matchSearch && matchAction && matchModule;
  });

  const getActionColor = (action: string) => {
    switch (action) {
      case 'CREATE':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'UPDATE':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'DELETE':
        return 'bg-red-550/25 text-red-400 border-red-900/40';
      case 'LOGIN':
        return 'bg-sky-500/10 text-sky-400 border-sky-500/20';
      case 'LOGOUT':
        return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  const getModuleLabel = (mod: string) => {
    switch (mod) {
      case 'CITIZENS': return 'WARGA SIPIL';
      case 'VEHICLES': return 'KENDARAAN';
      case 'REPORTS': return 'LAPORAN KASUS';
      case 'DETAINEES': return 'RETAHANAN (SEL)';
      case 'EVIDENCE': return 'BARANG BUKTI';
      case 'OFFICERS': return 'ANGGOTA';
      case 'WARRANTS': return 'SURAT WARRANT/DPO';
      case 'SYSTEM': return 'SISTEM MDT';
      default: return mod;
    }
  };

  const formatPayload = (jsonStr?: string) => {
    if (!jsonStr) return 'Tidak ada data detail tambahan.';
    try {
      const obj = JSON.parse(jsonStr);
      return JSON.stringify(obj, null, 2);
    } catch (e) {
      return jsonStr;
    }
  };

  return (
    <div className="space-y-6 font-mono text-xs text-slate-300" id="activity-log-dashboard">
      
      {/* Header Banner */}
      <div className="bg-[#0b0c10] border border-[#14161f] p-6 rounded-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-sky-400" />
            <h1 className="text-lg font-black font-sans text-white uppercase tracking-tight">LOG AKTIVITAS & AUDIT TRANSPARANSI</h1>
          </div>
          <p className="text-slate-450 leading-relaxed text-[11px] font-sans">
            Mencatat seluruh aksi penambahan (CREATE), perubahan (UPDATE), dan penghapusan (DELETE) data database kepolisian secara realtime (retensi otomatis 7 hari / 1 minggu guna efisiensi pangkalan data LSPD).
          </p>
        </div>
        <div className="bg-sky-950/20 border border-sky-900/30 rounded px-3 py-1.5 flex items-center gap-1.5 text-sky-400">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>AUTENTIKASI CHIEF OF POLICE AKTIF</span>
        </div>
      </div>

      {/* Control Panel: Search & Filters */}
      <div className="bg-[#0b0c10] border border-[#14161f] p-4 rounded-lg grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
        {/* Search */}
        <div className="md:col-span-5 relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Cari deskripsi, nama petugas, atau badge lencana..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#050508] border border-[#14161f] rounded pl-9 pr-4 py-2 font-mono text-xs text-white focus:outline-none focus:border-sky-505 placeholder-slate-550"
          />
        </div>

        {/* Action filter */}
        <div className="md:col-span-3 flex items-center gap-2">
          <ListFilter className="w-4 h-4 text-slate-500 shrink-0" />
          <select
            value={selectedActionFilter}
            onChange={(e) => setSelectedActionFilter(e.target.value)}
            className="w-full bg-[#050508] border border-[#14161f] rounded px-3 py-2 text-xs font-mono text-slate-300 focus:outline-none focus:border-sky-505"
          >
            <option value="ALL">SEMUA AKSI</option>
            <option value="CREATE">CREATE (TAMBAH)</option>
            <option value="UPDATE">UPDATE (EDIT)</option>
            <option value="DELETE">DELETE (HAPUS)</option>
            <option value="LOGIN">LOGIN MASUK</option>
            <option value="LOGOUT">LOGOUT KELUAR</option>
          </select>
        </div>

        {/* Module filter */}
        <div className="md:col-span-3 flex items-center gap-2">
          <ListFilter className="w-4 h-4 text-slate-500 shrink-0" />
          <select
            value={selectedModuleFilter}
            onChange={(e) => setSelectedModuleFilter(e.target.value)}
            className="w-full bg-[#050508] border border-[#14161f] rounded px-3 py-2 text-xs font-mono text-slate-300 focus:outline-none focus:border-sky-505"
          >
            <option value="ALL">SEMUA MODUL</option>
            <option value="CITIZENS">WARGA SIPIL</option>
            <option value="VEHICLES">KENDARAAN</option>
            <option value="REPORTS">LAPORAN KASUS</option>
            <option value="DETAINEES">RETAHANAN (SEL)</option>
            <option value="EVIDENCE">BARANG BUKTI</option>
            <option value="OFFICERS">ANGGOTA LSPD</option>
            <option value="WARRANTS">SURAT WARRANT/DPO</option>
            <option value="SYSTEM">SISTEM MDT</option>
          </select>
        </div>

        {/* Reset */}
        <div className="md:col-span-1 flex justify-end">
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedActionFilter('ALL');
              setSelectedModuleFilter('ALL');
            }}
            className="p-2 bg-[#050508] hover:bg-slate-900 border border-[#14161f] rounded text-slate-400 hover:text-white transition-colors cursor-pointer w-full text-center flex items-center justify-center"
            title="Reset filter"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Logs Table / Timeline List */}
      <div className="bg-[#0b0c10] border border-[#14161f] rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-[#14161f] bg-[#0d0e15] flex items-center justify-between">
          <span className="font-sans font-bold text-[11px] uppercase tracking-wide text-white">REKAM JEJAK TRANSAKSI DATABASE ({filteredLogs.length} Entri)</span>
          <span className="text-[10px] text-slate-500">REALTIME SYNCED TO SECURE_AUDIT_LEDGER</span>
        </div>

        {filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Clock className="w-8 h-8 mx-auto mb-2 text-slate-600" />
            <p className="text-[11px]">Tidak ditemukan log audit yang sesuai dengan filter pencarian.</p>
          </div>
        ) : (
          <div className="divide-y divide-[#14161f]">
            {filteredLogs.map((log) => {
              const isExpanded = expandedLogId === log.id;
              return (
                <div key={log.id} className="p-4 hover:bg-slate-950/40 transition-colors">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    
                    {/* Log Left Header: Action indicator + Module */}
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`px-2 py-0.5 border text-[9.5px] font-extrabold rounded font-mono ${getActionColor(log.action)}`}>
                        {log.action}
                      </span>
                      <span className="text-[10.5px] text-slate-400 font-bold">
                        {getModuleLabel(log.module)}
                      </span>
                    </div>

                    {/* Log Center description */}
                    <div className="flex-1 min-w-0">
                      <p className="text-[11.5px] text-white leading-relaxed font-sans font-medium">
                        {log.description}
                      </p>
                    </div>

                    {/* Log Right Side: Metadata (Officer badge + Timestamp) */}
                    <div className="flex items-center gap-3 shrink-0 text-slate-500 text-[10.5px]">
                      <span>
                        OFC: <span className="text-slate-300 font-bold">LSPD-{log.officerBadge}</span>
                      </span>
                      <span>•</span>
                      <span>
                        {new Date(log.timestamp).toLocaleDateString('id-ID')} {new Date(log.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                      <button
                        onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                        className={`p-1.5 border border-slate-800 hover:border-slate-700 bg-slate-950 rounded hover:text-white cursor-pointer ${isExpanded ? 'text-sky-400' : 'text-slate-400'}`}
                        title="Lihat Detail JSON Payload"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </div>

                  </div>

                  {/* Expandable detailed JSON Payload block */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden mt-3"
                      >
                        <div className="bg-[#050508] border border-[#14161f] rounded p-3 text-[10.5px] leading-relaxed">
                          <div className="flex items-center justify-between text-[10px] text-slate-500 pb-2 mb-2 border-b border-slate-900">
                            <span className="flex items-center gap-1">
                              <FileCode className="w-3.5 h-3.5 text-sky-400" />
                              <span>AUDIT DATA PAYLOAD LOG ID: {log.id}</span>
                            </span>
                            <span>FORMAT: APPLICATION_JSON</span>
                          </div>
                          <pre className="text-emerald-500 overflow-x-auto whitespace-pre-wrap max-h-60 scrollbar-thin">
                            <code>{formatPayload(log.details)}</code>
                          </pre>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};
