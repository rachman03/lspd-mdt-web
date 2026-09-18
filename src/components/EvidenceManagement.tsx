import React, { useState } from 'react';
import { useMdt } from '../context/MdtContext';
import { DigitalEvidence, OfficerRank } from '../types';
import { Search, PlusCircle, Trash2, Calendar, Shield, Tag, FileText, CheckCircle, Clock, Link, AlertCircle, X, ShieldAlert, Barcode, Eye, Edit3, Image, Archive } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const EvidenceManagement: React.FC = () => {
  const {
    evidences,
    addEvidence,
    updateEvidence,
    deleteEvidence,
    reports,
    currentOfficer
  } = useMdt();

  const isCadet = currentOfficer?.rank === OfficerRank.CADET;

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  
  // Modal / Detail States
  const [selectedEvidence, setSelectedEvidence] = useState<DigitalEvidence | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [evidenceToDelete, setEvidenceToDelete] = useState<{ id: string; title: string } | null>(null);

  // New Evidence Form State
  const [newTitle, setNewTitle] = useState('');
  const [newCaseId, setNewCaseId] = useState('');
  const [newTag, setNewTag] = useState<'Fingerprint' | 'Weapon' | 'Narcotics' | 'Document' | 'Money' | 'Other'>('Fingerprint');
  const [newStatus, setNewStatus] = useState<'Dalam Gudang' | 'Uji Lab' | 'Dipakai Sidang' | 'Dimusnahkan'>('Dalam Gudang');
  const [newSerialNumber, setNewSerialNumber] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [showImagePresets, setShowImagePresets] = useState(false);

  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Default Image Presets for easier evidence creation
  const imagePresets = [
    {
      label: 'Fingerprint Scan',
      url: 'https://images.unsplash.com/photo-1518152006812-edab29b069ac?auto=format&fit=crop&q=80&w=400',
      type: 'Fingerprint'
    },
    {
      label: 'Firearm / Weapon',
      url: 'https://images.unsplash.com/photo-1595590424283-b8f17842773f?auto=format&fit=crop&q=80&w=400',
      type: 'Weapon'
    },
    {
      label: 'Narcotics Klip',
      url: 'https://images.unsplash.com/photo-1533240332313-0db49b439ad3?auto=format&fit=crop&q=80&w=400',
      type: 'Narcotics'
    },
    {
      label: 'Evidence Document',
      url: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&q=80&w=400',
      type: 'Document'
    },
    {
      label: 'Seized Cash Money',
      url: 'https://images.unsplash.com/photo-1502920514313-52581002a659?auto=format&fit=crop&q=80&w=400',
      type: 'Money'
    }
  ];

  // Calculations for Stats
  const totalItems = evidences.length;
  const inLocker = evidences.filter(e => e.status === 'Dalam Gudang').length;
  const inLab = evidences.filter(e => e.status === 'Uji Lab').length;
  const inCourt = evidences.filter(e => e.status === 'Dipakai Sidang').length;
  const destroyed = evidences.filter(e => e.status === 'Dimusnahkan').length;

  const tagCounts = {
    Fingerprint: evidences.filter(e => e.tag === 'Fingerprint').length,
    Weapon: evidences.filter(e => e.tag === 'Weapon').length,
    Narcotics: evidences.filter(e => e.tag === 'Narcotics').length,
    Document: evidences.filter(e => e.tag === 'Document').length,
    Money: evidences.filter(e => e.tag === 'Money').length,
    Other: evidences.filter(e => e.tag === 'Other').length,
  };

  const filteredEvidences = evidences.filter((ev) => {
    const query = searchQuery.toLowerCase();
    const matchQuery = 
      ev.id.toLowerCase().includes(query) ||
      ev.caseId.toLowerCase().includes(query) ||
      ev.caseTitle.toLowerCase().includes(query) ||
      ev.title.toLowerCase().includes(query) ||
      ev.description.toLowerCase().includes(query) ||
      ev.collectedBy.toLowerCase().includes(query);

    const matchTag = selectedTag === 'all' || ev.tag === selectedTag;
    const matchStatus = selectedStatus === 'all' || ev.status === selectedStatus;

    return matchQuery && matchTag && matchStatus;
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!newTitle.trim()) {
      setErrorMsg('Nama/Judul barang bukti wajib diisi!');
      return;
    }

    if (!newCaseId) {
      setErrorMsg('Anda wajib mengaitkan barang bukti dengan ID Kasus/Laporan yang sah!');
      return;
    }

    const associatedCase = reports.find(r => r.id === newCaseId);
    if (!associatedCase) {
      setErrorMsg('ID Kasus yang dipilih tidak valid!');
      return;
    }

    addEvidence({
      caseId: newCaseId,
      caseTitle: associatedCase.title,
      title: newTitle.trim(),
      description: newDescription.trim() || 'Tidak ada deskripsi tambahan.',
      tag: newTag,
      imageUrl: newImageUrl.trim() || undefined,
      serialNumber: newSerialNumber.trim() || undefined,
      status: newStatus
    });

    setSuccessMsg('Barang bukti digital berhasil diregistrasikan ke gudang penyimpanan LSPD!');
    
    // Clear Form
    setNewTitle('');
    setNewCaseId('');
    setNewTag('Fingerprint');
    setNewStatus('Dalam Gudang');
    setNewSerialNumber('');
    setNewDescription('');
    setNewImageUrl('');
    setShowImagePresets(false);

    setTimeout(() => {
      setSuccessMsg('');
      setIsCreateOpen(false);
    }, 2000);
  };

  const handleStatusChange = (id: string, nextStatus: typeof newStatus) => {
    updateEvidence(id, { status: nextStatus });
    if (selectedEvidence && selectedEvidence.id === id) {
      setSelectedEvidence({ ...selectedEvidence, status: nextStatus });
    }
  };

  const handleDelete = (id: string, title: string) => {
    setEvidenceToDelete({ id, title });
  };

  const getTagStyle = (tag: string) => {
    switch (tag) {
      case 'Fingerprint':
        return 'bg-blue-950/60 text-blue-400 border border-blue-900/50';
      case 'Weapon':
        return 'bg-red-950/60 text-red-400 border border-red-900/50';
      case 'Narcotics':
        return 'bg-purple-950/60 text-purple-400 border border-purple-900/50';
      case 'Document':
        return 'bg-amber-950/60 text-amber-400 border border-amber-900/50';
      case 'Money':
        return 'bg-emerald-950/60 text-emerald-400 border border-emerald-900/50';
      default:
        return 'bg-slate-800 text-slate-300 border border-slate-700';
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'Dalam Gudang':
        return 'bg-slate-900 text-slate-300 border border-slate-850';
      case 'Uji Lab':
        return 'bg-sky-950 text-sky-400 border border-sky-900 animate-pulse';
      case 'Dipakai Sidang':
        return 'bg-amber-950 text-amber-400 border border-amber-900';
      case 'Dimusnahkan':
        return 'bg-red-950 text-red-400 border border-red-900/50';
      default:
        return 'bg-slate-800 text-slate-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header & Quick Overview */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-lg shadow-black/20">
        <div className="flex items-center space-x-3.5">
          <div className="p-3 bg-sky-950/50 border border-sky-800/40 rounded-lg text-sky-450 shadow">
            <Archive className="w-5 h-5 text-sky-400" />
          </div>
          <div>
            <h2 className="text-sm font-extrabold font-mono text-slate-100 flex items-center gap-2">
              MANAJEMEN BARANG BUKTI DIGITAL <span className="text-[9px] bg-sky-900/60 text-sky-400 border border-sky-850 px-2 py-0.5 rounded uppercase">SEKRE & GUDANG LSPD</span>
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5 leading-normal">
              Digital Evidence Locker System (DELS). Catat, amankan, dan lacak status rujukan barang bukti dari tindak kejahatan warga untuk persidangan.
            </p>
          </div>
        </div>
        {!isCadet && (
          <button
            onClick={() => setIsCreateOpen(true)}
            className="bg-sky-600 hover:bg-sky-500 text-slate-950 font-bold font-mono text-xs px-4 py-2.5 rounded flex items-center gap-1.5 shadow shadow-sky-500/20 cursor-pointer transition-all shrink-0 self-stretch md:self-auto justify-center"
          >
            <PlusCircle className="w-4 h-4" /> REGISTRASI BARANG BUKTI
          </button>
        )}
      </div>

      {/* 2. Stats Row Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5" id="evidence-stats-grid">
        <div className="bg-slate-900 border border-slate-850 rounded-lg p-3 text-center">
          <p className="text-[10px] font-bold font-mono text-slate-400 uppercase">TOTAL REGISTERED</p>
          <p className="text-xl font-extrabold font-mono text-slate-100 mt-1">{totalItems}</p>
        </div>
        <div className="bg-slate-900 border border-slate-850 rounded-lg p-3 text-center">
          <p className="text-[10px] font-bold font-mono text-slate-300 uppercase flex items-center justify-center gap-1">
            <span className="w-1.5 h-1.5 bg-slate-400 rounded-full"></span> DI GUDANG
          </p>
          <p className="text-xl font-extrabold font-mono text-slate-300 mt-1">{inLocker}</p>
        </div>
        <div className="bg-slate-900 border border-slate-850 rounded-lg p-3 text-center">
          <p className="text-[10px] font-bold font-mono text-sky-400 uppercase flex items-center justify-center gap-1">
            <span className="w-1.5 h-1.5 bg-sky-500 rounded-full animate-pulse"></span> UJI LABORATORIUM
          </p>
          <p className="text-xl font-extrabold font-mono text-sky-400 mt-1">{inLab}</p>
        </div>
        <div className="bg-slate-900 border border-slate-850 rounded-lg p-3 text-center">
          <p className="text-[10px] font-bold font-mono text-amber-400 uppercase flex items-center justify-center gap-1">
            <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span> SIDANG KOTA
          </p>
          <p className="text-xl font-extrabold font-mono text-amber-400 mt-1">{inCourt}</p>
        </div>
        <div className="bg-slate-900 border border-slate-850 rounded-lg p-3 text-center col-span-2 md:col-span-1">
          <p className="text-[10px] font-bold font-mono text-red-400 uppercase flex items-center justify-center gap-1">
            <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span> DIMUSNAHKAN
          </p>
          <p className="text-xl font-extrabold font-mono text-red-400 mt-1">{destroyed}</p>
        </div>
      </div>

      {/* 3. Filter controls & Search */}
      <div className="bg-slate-900 border border-slate-850 p-3.5 rounded-lg flex flex-col md:flex-row items-stretch justify-between gap-3 shadow-md">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari ID Kasus, ID Bukti, Nama Barang Bukti, atau Nama Petugas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500/50 rounded px-3.5 py-2 pl-10 text-xs text-slate-100 placeholder-slate-550 focus:outline-none transition-colors"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
          <div>
            <select
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded px-2 py-2 text-slate-300 focus:outline-none focus:border-sky-505"
            >
              <option value="all">SEMUA JENIS TAG</option>
              <option value="Fingerprint">TAG: Fingerprint</option>
              <option value="Weapon">TAG: Weapon</option>
              <option value="Narcotics">TAG: Narcotics</option>
              <option value="Document">TAG: Document</option>
              <option value="Money">TAG: Money</option>
              <option value="Other">TAG: Other</option>
            </select>
          </div>

          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded px-2 py-2 text-slate-300 focus:outline-none focus:border-sky-505"
            >
              <option value="all">SEMUA STATUS</option>
              <option value="Dalam Gudang">Dalam Gudang / Locker</option>
              <option value="Uji Lab">Uji Laboratorium</option>
              <option value="Dipakai Sidang">Sidang Aktif</option>
              <option value="Dimusnahkan">Telah Dimusnahkan</option>
            </select>
          </div>
        </div>
      </div>

      {/* 4. Main Logs Grid */}
      {filteredEvidences.length === 0 ? (
        <div className="bg-slate-900 border border-slate-850 rounded-lg py-12 text-center text-slate-500">
          <AlertCircle className="w-10 h-10 mx-auto text-slate-650 mb-3" />
          <p className="text-sm font-bold font-mono">TIDAK ADA DATA BARANG BUKTI</p>
          <p className="text-xs text-slate-550 mt-1 max-w-md mx-auto">
            Tidak ada catatan barang bukti yang cocok dengan pencarian Anda atau kriteria filter yang sedang aktif. Silakan bersihkan kata kunci.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEvidences.map((ev) => (
            <div 
              key={ev.id}
              onClick={() => setSelectedEvidence(ev)}
              className="bg-slate-900 border border-slate-850 hover:border-slate-700/80 rounded-lg p-4 flex flex-col justify-between shadow transition-all hover:bg-slate-900/90 cursor-pointer group relative overflow-hidden"
            >
              {/* Top Details & Action */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono text-[9px] bg-slate-950 border border-slate-800 px-2 py-1 rounded font-bold text-sky-400">
                    {ev.id}
                  </span>
                  <span className={`font-mono text-[9px] px-2 py-0.5 rounded font-black uppercase ${getStatusStyle(ev.status)}`}>
                    {ev.status}
                  </span>
                </div>

                <div className="flex gap-3">
                  {ev.imageUrl ? (
                    <img 
                      src={ev.imageUrl} 
                      alt={ev.title}
                      className="w-14 h-14 object-cover border border-slate-800 rounded shadow-sm shrink-0"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-14 h-14 bg-slate-950 border border-slate-850 flex flex-col items-center justify-center text-slate-600 rounded shrink-0">
                      <Image className="w-5 h-5" />
                    </div>
                  )}

                  <div className="min-w-0">
                    <h4 className="text-[12px] font-bold text-slate-200 truncate group-hover:text-sky-400 transition-colors">
                      {ev.title}
                    </h4>
                    <span className={`inline-block font-mono text-[8px] px-1.5 py-0.2 rounded font-bold mt-1 uppercase ${getTagStyle(ev.tag)}`}>
                      {ev.tag}
                    </span>
                    <p className="text-[9px] text-slate-500 mt-2 flex items-center gap-1">
                      <Link className="w-2.5 h-2.5 text-slate-550" /> {ev.caseId}
                    </p>
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 line-clamp-2 mt-3 leading-normal italic bg-slate-950/30 p-2 rounded border border-slate-950/40 font-mono">
                  "{ev.description}"
                </p>
              </div>

              {/* Bottom Metadata */}
              <div className="border-t border-slate-950/40 pt-3 mt-4 flex items-center justify-between font-mono text-[9.5px] text-slate-500">
                <span>OLEH: Ofc. {ev.collectedBy}</span>
                <span className="flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5 text-slate-500 group-hover:text-sky-400 transition-colors" /> DETAIL
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 5. Detail Evidence Slip Modal */}
      <AnimatePresence>
        {selectedEvidence && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-lg w-full max-w-lg shadow-2xl overflow-hidden font-sans"
            >
              {/* Modal header with police stripe */}
              <div className="bg-gradient-to-r from-red-600/30 via-slate-900 to-sky-600/30 border-b border-slate-800 p-4 flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <Barcode className="w-5 h-5 text-sky-400" />
                  <div>
                    <h3 className="text-xs font-bold font-mono tracking-wider text-slate-100 uppercase">EVIDENCE CUSTODY SLIP // LSPD</h3>
                    <p className="text-[9px] text-slate-400 font-mono">SINKRONISASI PUSAT DATA LAB & GUDANG</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedEvidence(null)}
                  className="p-1 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded cursor-pointer transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto font-mono text-xs text-slate-300">
                {/* Visual Section & Core Identifiers */}
                <div className="bg-slate-950 border border-slate-850 p-4 rounded flex flex-col sm:flex-row gap-4 items-center sm:items-start relative">
                  {/* Decorative stamp watermark */}
                  <div className="absolute right-3 bottom-3 border-2 border-dashed border-red-500/20 text-red-500/20 font-black text-[15px] px-2.5 py-1 rotate-12 pointer-events-none uppercase select-none rounded">
                    LSPD LOCKER
                  </div>

                  {selectedEvidence.imageUrl ? (
                    <img 
                      src={selectedEvidence.imageUrl} 
                      alt={selectedEvidence.title}
                      className="w-24 h-24 object-cover border border-slate-800 rounded shrink-0 shadow"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-24 h-24 bg-slate-900 border border-slate-800 flex flex-col items-center justify-center text-slate-600 rounded shrink-0">
                      <Image className="w-8 h-8 mb-1" />
                      <span className="text-[9px] uppercase font-bold">NO PHOTO</span>
                    </div>
                  )}

                  <div className="w-full space-y-2 text-center sm:text-left">
                    <div>
                      <p className="text-[9px] text-slate-500">ID CATATAN BUKTI</p>
                      <p className="text-sm font-extrabold text-sky-400 font-mono tracking-wider">{selectedEvidence.id}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                      <div>
                        <p className="text-[8px] text-slate-550">TAG BARANG</p>
                        <span className={`inline-block px-1.5 py-0.2 rounded font-bold uppercase mt-0.5 ${getTagStyle(selectedEvidence.tag)}`}>
                          {selectedEvidence.tag}
                        </span>
                      </div>
                      <div>
                        <p className="text-[8px] text-slate-550">STATUS SEKARANG</p>
                        <span className={`inline-block px-1.5 py-0.2 rounded font-black uppercase mt-0.5 ${getStatusStyle(selectedEvidence.status)}`}>
                          {selectedEvidence.status}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Evidence specifications */}
                <div className="space-y-2 bg-slate-950/50 p-3 rounded border border-slate-850">
                  <div className="flex justify-between border-b border-slate-850 pb-2">
                    <span className="text-slate-500">NAMA BARANG:</span>
                    <span className="text-slate-100 font-bold">{selectedEvidence.title}</span>
                  </div>
                  {selectedEvidence.serialNumber && (
                    <div className="flex justify-between border-b border-slate-850 pb-2">
                      <span className="text-slate-500">NOMOR SERI / MODEL:</span>
                      <span className="text-red-400 font-bold">{selectedEvidence.serialNumber}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-b border-slate-850 pb-2">
                    <span className="text-slate-500">ASOSIASI ID KASUS (REP):</span>
                    <span className="text-sky-450 font-bold hover:underline cursor-pointer flex items-center gap-1">
                      {selectedEvidence.caseId}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-slate-850 pb-2">
                    <span className="text-slate-500">JUDUL LAPORAN KASUS:</span>
                    <span className="text-slate-300 font-medium truncate max-w-[250px]">{selectedEvidence.caseTitle}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-850 pb-2">
                    <span className="text-slate-500">AMBIL OLEH PETUGAS:</span>
                    <span className="text-slate-300">Ofc. {selectedEvidence.collectedBy} (Badge: {selectedEvidence.collectedByBadge})</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">TANGGAL PENYITAAN:</span>
                    <span className="text-slate-400">{new Date(selectedEvidence.dateCollected).toLocaleString('id-ID')}</span>
                  </div>
                </div>

                {/* Narrative description */}
                <div>
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">DESKRIPSI & KONTEKS TEMPAT KEJADIAN:</h4>
                  <div className="bg-slate-950/80 border border-slate-850 p-3 rounded font-sans italic text-[11px] leading-relaxed text-slate-300">
                    "{selectedEvidence.description}"
                  </div>
                </div>

                {/* Actions Panel */}
                {!isCadet && (
                  <div className="bg-slate-950 border border-slate-850 p-4 rounded-lg space-y-3">
                    <h4 className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">TINDAKAN REKTORAT BARANG BUKTI:</h4>
                    
                    <div className="flex flex-col sm:flex-row gap-2">
                      <div className="flex-1">
                        <label className="block text-[8px] text-slate-500 mb-1 uppercase font-bold">UBAH STATUS LOGISTIK:</label>
                        <div className="grid grid-cols-2 gap-1.5 font-mono text-[9.5px]">
                          <button
                            onClick={() => handleStatusChange(selectedEvidence.id, 'Dalam Gudang')}
                            className={`px-2 py-1.5 rounded font-bold border transition-colors cursor-pointer text-center ${
                              selectedEvidence.status === 'Dalam Gudang' 
                                ? 'bg-slate-850 border-slate-700 text-slate-100' 
                                : 'bg-slate-950 hover:bg-slate-850 border-slate-850 text-slate-400'
                            }`}
                          >
                            DI GUDANG
                          </button>
                          <button
                            onClick={() => handleStatusChange(selectedEvidence.id, 'Uji Lab')}
                            className={`px-2 py-1.5 rounded font-bold border transition-colors cursor-pointer text-center ${
                              selectedEvidence.status === 'Uji Lab' 
                                ? 'bg-sky-950 border-sky-850 text-sky-400' 
                                : 'bg-slate-950 hover:bg-slate-850 border-slate-850 text-slate-400'
                            }`}
                          >
                            UJI LAB
                          </button>
                          <button
                            onClick={() => handleStatusChange(selectedEvidence.id, 'Dipakai Sidang')}
                            className={`px-2 py-1.5 rounded font-bold border transition-colors cursor-pointer text-center ${
                              selectedEvidence.status === 'Dipakai Sidang' 
                                ? 'bg-amber-950 border-amber-850 text-amber-400' 
                                : 'bg-slate-950 hover:bg-slate-850 border-slate-850 text-slate-400'
                            }`}
                          >
                            SIDANG KOTA
                          </button>
                          <button
                            onClick={() => handleStatusChange(selectedEvidence.id, 'Dimusnahkan')}
                            className={`px-2 py-1.5 rounded font-bold border transition-colors cursor-pointer text-center ${
                              selectedEvidence.status === 'Dimusnahkan' 
                                ? 'bg-red-900/40 border-red-900 text-red-400' 
                                : 'bg-slate-950 hover:bg-slate-850 border-slate-850 text-slate-400'
                            }`}
                          >
                            DIMUSNAHKAN
                          </button>
                        </div>
                      </div>

                      <div className="border-t sm:border-t-0 sm:border-l border-slate-850 pt-2 sm:pt-0 sm:pl-3 flex flex-col justify-end shrink-0">
                        <button
                          onClick={() => handleDelete(selectedEvidence.id, selectedEvidence.title)}
                          className="bg-red-950 hover:bg-red-900 text-red-400 border border-red-900/60 font-bold px-3 py-2 rounded flex items-center justify-center gap-1.5 cursor-pointer transition-colors w-full text-[10.5px]"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> HAPUS PERMANEN
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal footer */}
              <div className="bg-slate-950 border-t border-slate-850/80 p-3.5 flex justify-end">
                <button
                  onClick={() => setSelectedEvidence(null)}
                  className="bg-slate-800 hover:bg-slate-700 border border-slate-750 text-slate-200 font-mono text-xs px-4 py-2 rounded cursor-pointer transition-colors"
                >
                  TUTUP SLIP
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 6. Create Evidence Slip Modal */}
      <AnimatePresence>
        {isCreateOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-lg w-full max-w-xl shadow-2xl overflow-hidden font-sans"
            >
              {/* Header */}
              <div className="bg-sky-950 border-b border-slate-800 p-4 flex items-center justify-between">
                <div className="flex items-center space-x-2 text-sky-400">
                  <Archive className="w-5 h-5 animate-pulse" />
                  <div>
                    <h3 className="text-xs font-bold font-mono tracking-wider uppercase text-slate-100">SLIP REGISTRASI BARANG BUKTI DIGITAL</h3>
                    <p className="text-[9px] text-sky-450 font-mono font-bold">LOS SANTOS METROPOLITAN CRIME SYSTEM</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsCreateOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded cursor-pointer transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Form Body */}
              <form onSubmit={handleCreateSubmit}>
                <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
                  {/* Warning Note */}
                  <div className="bg-sky-950/20 border border-sky-900/60 p-3 rounded text-sky-450 leading-relaxed font-mono text-[10px]">
                    <span className="font-extrabold flex items-center gap-1.5 text-sky-400 uppercase mb-0.5">
                      <ShieldAlert className="w-3.5 h-3.5" /> PERNYATAAN INTEGRITAS AKUNTABILITAS
                    </span>
                    Saya, <strong className="text-slate-200">{currentOfficer?.rank} {currentOfficer?.name}</strong>, menyatakan bahwa seluruh data penyerahan barang bukti ini didaftarkan dengan benar sesuai protokol hukum San Andreas.
                  </div>

                  {successMsg && (
                    <div className="bg-emerald-950/60 border border-emerald-900 text-emerald-400 p-3 rounded font-mono text-[10.5px] text-center">
                      {successMsg}
                    </div>
                  )}

                  {errorMsg && (
                    <div className="bg-red-950/60 border border-red-900 text-red-400 p-3 rounded font-mono text-[10.5px] text-center">
                      {errorMsg}
                    </div>
                  )}

                  {/* Two-column Input Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* 1. Evidence Title */}
                    <div>
                      <label className="block text-slate-400 font-mono text-[10.5px] mb-1.5 font-bold uppercase">NAMA BARANG BUKTI:</label>
                      <input
                        type="text"
                        required
                        placeholder="contoh: Pistol Colt-45 atau Klip Ganja"
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500 rounded px-3 py-2 text-slate-200 placeholder-slate-600 focus:outline-none"
                      />
                    </div>

                    {/* 2. Case ID / Case Report Linker */}
                    <div>
                      <label className="block text-slate-400 font-mono text-[10.5px] mb-1.5 font-bold uppercase">PILIH LAPORAN KASUS ASOSIASI:</label>
                      <select
                        required
                        value={newCaseId}
                        onChange={(e) => setNewCaseId(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-sky-505 rounded px-3 py-2.2 text-slate-200 focus:outline-none text-[11px]"
                      >
                        <option value="">-- Hubungkan Ke Kasus/Laporan --</option>
                        {reports.map((r) => (
                          <option key={r.id} value={r.id}>
                            [{r.id}] - {r.title} ({r.suspectName})
                          </option>
                        ))}
                      </select>
                      <p className="text-[9.5px] text-slate-500 font-mono mt-1">Barang bukti harus dihubungkan dengan laporan kasus aktif.</p>
                    </div>

                    {/* 3. Tag Select */}
                    <div>
                      <label className="block text-slate-400 font-mono text-[10.5px] mb-1.5 font-bold uppercase">TAG KLASIFIKASI:</label>
                      <select
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value as any)}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-sky-505 rounded px-3 py-2.2 text-slate-200 focus:outline-none"
                      >
                        <option value="Fingerprint">Fingerprint (Sidik Jari)</option>
                        <option value="Weapon">Weapon (Senjata / Sajam / Senpi)</option>
                        <option value="Narcotics">Narcotics (Ganja / Meth / Kokain)</option>
                        <option value="Document">Document (Kontrak / Catatan / Kertas)</option>
                        <option value="Money">Money (Pecahan Uang / Hasil Curian)</option>
                        <option value="Other">Other (Lainnya)</option>
                      </select>
                    </div>

                    {/* 4. Initial Logistics Status */}
                    <div>
                      <label className="block text-slate-400 font-mono text-[10.5px] mb-1.5 font-bold uppercase">STATUS AWAL PENYIMPANAN:</label>
                      <select
                        value={newStatus}
                        onChange={(e) => setNewStatus(e.target.value as any)}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-sky-505 rounded px-3 py-2.2 text-slate-200 focus:outline-none"
                      >
                        <option value="Dalam Gudang">Dalam Gudang / Locker</option>
                        <option value="Uji Lab">Kirim Ke Uji Laboratorium</option>
                        <option value="Dipakai Sidang">Siapkan Untuk Sidang Kota</option>
                      </select>
                    </div>

                    {/* 5. Serial Number / Item Model */}
                    <div className="sm:col-span-2">
                      <label className="block text-slate-400 font-mono text-[10.5px] mb-1.5 font-bold uppercase">NOMOR SERI / MODEL (JIKA ADA):</label>
                      <input
                        type="text"
                        placeholder="contoh: SN-9042-GLOCK atau N/A"
                        value={newSerialNumber}
                        onChange={(e) => setNewSerialNumber(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-sky-505 rounded px-3 py-2 text-slate-200 placeholder-slate-650 focus:outline-none"
                      />
                    </div>

                    {/* 6. Context Description */}
                    <div className="sm:col-span-2">
                      <label className="block text-slate-400 font-mono text-[10.5px] mb-1.5 font-bold uppercase">DESKRIPSI PENEMUAN & KONTEKS:</label>
                      <textarea
                        rows={3}
                        required
                        placeholder="Tuliskan di mana barang ini disita, dengan siapa tersangka memegangnya, detail visual tambahan..."
                        value={newDescription}
                        onChange={(e) => setNewDescription(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-sky-505 rounded px-3 py-2 text-slate-200 placeholder-slate-650 focus:outline-none font-mono text-[11px]"
                      />
                    </div>

                    {/* 7. Image Link / Presets */}
                    <div className="sm:col-span-2 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="block text-slate-400 font-mono text-[10.5px] mb-1 font-bold uppercase">URL FOTO DIGITAL BARANG BUKTI:</label>
                        <button
                          type="button"
                          onClick={() => setShowImagePresets(!showImagePresets)}
                          className="text-[10px] text-sky-400 hover:underline hover:text-sky-305 font-mono cursor-pointer bg-slate-950 px-2 py-1 rounded border border-slate-850"
                        >
                          {showImagePresets ? 'SEMBUNYIKAN PRESET FOTO' : 'PILIH PRESET TEMPLATE FOTO'}
                        </button>
                      </div>

                      {showImagePresets && (
                        <div className="bg-slate-950 border border-slate-850 rounded p-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {imagePresets.map((preset, idx) => (
                            <div 
                              key={idx}
                              onClick={() => {
                                setNewImageUrl(preset.url);
                                setShowImagePresets(false);
                              }}
                              className="border border-slate-850 hover:border-sky-500/50 p-1.5 rounded cursor-pointer transition-colors bg-slate-900 text-center flex flex-col items-center justify-between group"
                            >
                              <img src={preset.url} alt={preset.label} className="w-full h-12 object-cover rounded mb-1.5" />
                              <span className="text-[9.5px] font-mono font-bold text-slate-400 group-hover:text-slate-100">{preset.label}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      <input
                        type="url"
                        placeholder="https://images.unsplash.com/... atau biarkan kosong"
                        value={newImageUrl}
                        onChange={(e) => setNewImageUrl(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-sky-505 rounded px-3 py-2 text-slate-200 placeholder-slate-650 focus:outline-none font-mono text-[11px]"
                      />
                    </div>
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="bg-slate-950 border-t border-slate-850 p-4 flex justify-end gap-3.5">
                  <button
                    type="button"
                    onClick={() => setIsCreateOpen(false)}
                    className="bg-slate-800 hover:bg-slate-700 border border-slate-750 text-slate-250 font-mono text-xs px-4 py-2 rounded cursor-pointer transition-colors"
                  >
                    BATAL
                  </button>
                  <button
                    type="submit"
                    className="bg-sky-600 hover:bg-sky-500 text-slate-950 font-bold font-mono text-xs px-5 py-2 rounded cursor-pointer transition-colors shadow shadow-sky-505/10"
                  >
                    SIMPAN BARANG BUKTI
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL KONFIRMASI HAPUS BARANG BUKTI */}
      {evidenceToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in text-left">
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 max-w-md w-full font-mono space-y-4 shadow-2xl">
            <div className="text-rose-500 flex items-center space-x-2 border-b border-slate-800 pb-2.5">
              <ShieldAlert className="w-5 h-5 text-rose-455" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-rose-450">HAPUS BARANG BUKTI</h4>
            </div>
            <p className="text-xs text-slate-350 leading-relaxed">
              <span className="text-rose-400 font-bold">PERINGATAN KRITIS:</span> Apakah Anda yakin ingin menghapus catatan barang bukti <span className="text-rose-400 font-bold">"{evidenceToDelete.title}" ({evidenceToDelete.id})</span> secara permanen? Tindakan ini melanggar protokol jika dilakukan tanpa sidang.
            </p>
            <div className="flex space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setEvidenceToDelete(null)}
                className="flex-1 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-400 py-2 font-bold uppercase rounded text-[11px] cursor-pointer text-center"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteEvidence(evidenceToDelete.id);
                  setSelectedEvidence(null);
                  setEvidenceToDelete(null);
                }}
                className="flex-1 bg-rose-600 hover:bg-rose-500 text-white py-2 font-bold uppercase rounded text-[11px] cursor-pointer text-center"
              >
                Hapus Bukti
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
