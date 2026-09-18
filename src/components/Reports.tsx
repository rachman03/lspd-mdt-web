import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useMdt } from '../context/MdtContext';
import { Charge, OfficerRank } from '../types';
import { FilePlus, ShieldAlert, Users, Layers, DollarSign, Calendar, Scale, Clock, Check, RefreshCw, X, Camera, Image as ImageIcon, Trash2, Plus, Tag, Shield, BookOpen, Info, ChevronDown, ChevronUp, FileText, Landmark, Car, AlertTriangle, Link, Printer, AlertCircle, ArrowRight, Download, FileDown, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import lspdLogo from '../assets/images/lspd_logo_1781980741624.jpg';
import { copyToClipboard } from '../lib/clipboard';
import { generatePdfFromElement, triggerBrowserPrint } from '../lib/pdfGenerator';

interface ReportsProps {
  setActiveTab: (tab: string) => void;
  editingReportId: string | null;
  setEditingReportId: (id: string | null) => void;
}

export const Reports: React.FC<ReportsProps> = ({ setActiveTab, editingReportId, setEditingReportId }) => {
  const { citizens, submitReport, updateReport, reports, currentOfficer, penalCodes, registeredOfficers, getNextReportId } = useMdt();
  const nextCaseId = getNextReportId ? getNextReportId() : 'REP-01';
  const activeReportId = editingReportId || nextCaseId;

  const [title, setTitle] = useState('');
  const [selectedSuspects, setSelectedSuspects] = useState<typeof citizens>([]);
  const [selectedCharges, setSelectedCharges] = useState<Charge[]>([]);
  const [description, setDescription] = useState('');
  const [searchCitizenQuery, setSearchCitizenQuery] = useState('');
  const [penalSearchQuery, setPenalSearchQuery] = useState('');
  const [successMessage, setSuccessMessage] = useState(false);

  // Printable report states
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [copiedSuccess, setCopiedSuccess] = useState(false);
  const [manualCopyText, setManualCopyText] = useState<string | null>(null);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [pdfProgressStatus, setPdfProgressStatus] = useState<string | null>(null);
  const [showPrintIframeNotice, setShowPrintIframeNotice] = useState(false);
  const printSheetRef = useRef<HTMLDivElement>(null);

  const handleDownloadPdf = async () => {
    if (!printSheetRef.current) return;
    setIsExportingPdf(true);
    setPdfProgressStatus('Mempersiapkan dokumen A4...');
    const cleanTitle = title ? title.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 25) : 'BAP';
    const filename = `LSPD_BAP_${activeReportId}_${cleanTitle}.pdf`;
    const success = await generatePdfFromElement(printSheetRef.current, {
      filename,
      onProgress: (status) => setPdfProgressStatus(status),
    });
    setIsExportingPdf(false);
    if (success) {
      setPdfProgressStatus('PDF berhasil diunduh!');
      setTimeout(() => setPdfProgressStatus(null), 3000);
    }
  };

  // New fields for Case Investigation & Citizen reports
  const [reportStatus, setReportStatus] = useState<'Penyelidikan' | 'DPO' | 'Selesai'>('Selesai');
  const [reportType, setReportType] = useState<'LSPD' | 'Citizen'>('LSPD');
  const [reporterName, setReporterName] = useState('');
  const [searchReporterQuery, setSearchReporterQuery] = useState('');
  const [selectedReporterCitizen, setSelectedReporterCitizen] = useState<any>(null);
  const [reporterInputMode, setReporterInputMode] = useState<'search' | 'manual'>('search');
  const [isUnknownSuspect, setIsUnknownSuspect] = useState(false);
  const [incidentLocation, setIncidentLocation] = useState('Innocence Blvd.');
  const [customTags, setCustomTags] = useState<string[]>(['Traffic Stop']);
  const [newTagInput, setNewTagInput] = useState('');
  
  // Custom states for Assisting Officers matching roster
  const [selectedOfficersList, setSelectedOfficersList] = useState<string[]>([]);
  const [manualOfficerInput, setManualOfficerInput] = useState('');
  const [officerSearchQuery, setOfficerSearchQuery] = useState('');
  
  const [imageUrl, setImageUrl] = useState('');

  // Multiple Evidence/Mugshot images
  const [evidenceImages, setEvidenceImages] = useState<{ id: string; url: string; caption: string; type: 'mugshot' | 'evidence' | 'other' }[]>([]);
  const [newImgUrl, setNewImgUrl] = useState('');
  const [newImgCaption, setNewImgCaption] = useState('');
  const [newImgType, setNewImgType] = useState<'mugshot' | 'evidence' | 'other'>('evidence');

  // Accordion Expand/Collapse States (Immersive right-side list matching the screenshot)
  const [sectionsOpen, setSectionsOpen] = useState<{ [key: string]: boolean }>({
    tag: true,
    karyawan: true,
    kriminal: true,
    warga: false,
    kendaraan: false,
    senjata: true,
    evidence: false,
    foto: false,
  });

  const toggleSection = (section: string) => {
    setSectionsOpen(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Automatically load report data if in edit mode
  useEffect(() => {
    if (editingReportId) {
      const repToEdit = reports.find((r) => r.id === editingReportId);
      if (repToEdit) {
        setTitle(repToEdit.title);
        setDescription(repToEdit.description || '');
        
        // Parse assisting officers list
        if (repToEdit.assistingOfficers) {
          setSelectedOfficersList(repToEdit.assistingOfficers.split(',').map((o) => o.trim()).filter(Boolean));
        } else {
          setSelectedOfficersList([]);
        }
        
        setImageUrl(repToEdit.imageUrl || '');
        
        if (repToEdit.evidenceImages && repToEdit.evidenceImages.length > 0) {
          setEvidenceImages(repToEdit.evidenceImages);
        } else if (repToEdit.imageUrl) {
          setEvidenceImages([{
            id: 'legacy-img',
            url: repToEdit.imageUrl,
            caption: 'Mugshot Utama',
            type: 'mugshot'
          }]);
        } else {
          setEvidenceImages([]);
        }
        
        // Find suspect citizens in local DB, fallback if not found
        const suspectsInReport = repToEdit.suspects || 
          (repToEdit.suspectId ? [{ id: repToEdit.suspectId, name: repToEdit.suspectName }] : []);
        
        // Check if suspect is unknown
        const isUnknown = repToEdit.suspectId === 'LIDIK' || repToEdit.suspectId === 'UNKNOWN';
        setIsUnknownSuspect(isUnknown);

        const mappedSuspects = isUnknown ? [] : suspectsInReport.map((sus) => {
          const cit = citizens.find((c) => c.id === sus.id);
          return cit || {
            id: sus.id,
            firstName: sus.name.split(' ')[0] || '',
            lastName: sus.name.split(' ').slice(1).join(' ') || '',
            phone: '',
            dob: '',
            gender: 'Laki-laki',
            licenseStatus: { drivers: 'Active' as const, weapons: 'Active' as const, ktp: 'Active' as const },
            avatar: '',
            isWanted: false,
            convictions: [] as string[],
            notes: '',
          };
        }) as typeof citizens;
        
        setSelectedSuspects(mappedSuspects);
        setSelectedCharges(repToEdit.charges || []);
        setReportStatus(repToEdit.status || 'Selesai');
        setReportType(repToEdit.type || 'LSPD');
        const repRepName = repToEdit.reporterName || '';
        setReporterName(repRepName);
        if (repRepName) {
          const foundCit = citizens.find(c => `${c.firstName} ${c.lastName}`.toLowerCase() === repRepName.toLowerCase());
          if (foundCit) {
            setSelectedReporterCitizen(foundCit);
            setReporterInputMode('search');
          } else {
            setSelectedReporterCitizen(null);
            setReporterInputMode('manual');
          }
        } else {
          setSelectedReporterCitizen(null);
          setReporterInputMode('search');
        }
      }
    }
  }, [editingReportId, reports, citizens]);

  // Filter suspects search list
  const filteredCitizens = citizens.filter((c) => {
    const fullName = `${c.firstName} ${c.lastName}`.toLowerCase();
    const query = searchCitizenQuery.toLowerCase();
    return fullName.includes(query) || c.id.toLowerCase().includes(query);
  });

  // Filter reporters search list
  const filteredReporterCitizens = citizens.filter((c) => {
    const fullName = `${c.firstName} ${c.lastName}`.toLowerCase();
    const query = searchReporterQuery.toLowerCase();
    return fullName.includes(query) || c.id.toLowerCase().includes(query);
  });

  const handleAddSuspect = (citizen: typeof citizens[0]) => {
    if (!selectedSuspects.some((s) => s.id === citizen.id)) {
      setSelectedSuspects([...selectedSuspects, citizen]);
    }
  };

  const handleRemoveSuspect = (id: string) => {
    setSelectedSuspects(selectedSuspects.filter((s) => s.id !== id));
  };

  // Filter penal codes based on query
  const filteredPenalCodes = penalCodes.filter((code) => {
    const q = penalSearchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      code.title.toLowerCase().includes(q) ||
      code.code.toLowerCase().includes(q) ||
      code.description.toLowerCase().includes(q) ||
      code.category.toLowerCase().includes(q)
    );
  });

  // Group penal code charges by category
  const categories = Array.from(new Set(filteredPenalCodes.map((code) => code.category)));

  // Calculate totals
  const totalFine = selectedCharges.reduce((sum, ch) => sum + ch.fine, 0);
  const totalJailTime = selectedCharges.reduce((sum, ch) => sum + ch.jailTime, 0);

  // Validation helpers
  const isSuspectRequired = reportType === 'LSPD' && (reportStatus === 'Selesai' || reportStatus === 'DPO');
  const isSuspectEmpty = isSuspectRequired && !isUnknownSuspect && selectedSuspects.length === 0;
  const isChargesRequired = reportType === 'LSPD' && (reportStatus === 'Selesai' || reportStatus === 'DPO');
  const isChargesEmpty = isChargesRequired && selectedCharges.length === 0;
  const isReporterNameEmpty = reportType === 'Citizen' && !reporterName.trim();
  const canSubmit = title.trim() !== '' && 
                    description.trim() !== '' && 
                    !isSuspectEmpty && 
                    !isChargesEmpty && 
                    !isReporterNameEmpty;

  const handleToggleCharge = (charge: Charge) => {
    const isSelected = selectedCharges.some((c) => c.code === charge.code);
    if (isSelected) {
      setSelectedCharges(selectedCharges.filter((c) => c.code !== charge.code));
    } else {
      setSelectedCharges([...selectedCharges, charge]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      alert('Mohon isi Judul Laporan.');
      return;
    }

    if (!description.trim()) {
      alert('Mohon isi Keterangan / Deskripsi kejadian.');
      return;
    }

    if (isSuspectEmpty) {
      alert('Tersangka wajib diisi untuk laporan selesai/DPO.');
      return;
    }

    if (isChargesEmpty) {
      alert('Pasal pelanggaran wajib diisi untuk laporan selesai/DPO.');
      return;
    }

    const computedImageUrl = evidenceImages.find((img) => img.type === 'mugshot')?.url 
      || evidenceImages[0]?.url 
      || imageUrl;

    const finalAssisting = selectedOfficersList.length > 0 ? selectedOfficersList.join(', ') : undefined;
    const autoUnknown = isUnknownSuspect || (selectedSuspects.length === 0 && (reportType === 'Citizen' || reportStatus === 'Penyelidikan'));

    const finalSuspects = autoUnknown 
      ? [{ id: 'LIDIK', name: 'Tidak Diketahui / Lidik' }]
      : selectedSuspects.map((s) => ({ id: s.id, name: `${s.firstName} ${s.lastName}` }));

    const finalSuspectId = autoUnknown ? 'LIDIK' : selectedSuspects.map((s) => s.id).join(', ');
    const finalSuspectName = autoUnknown ? 'Tidak Diketahui / Lidik' : selectedSuspects.map((s) => `${s.firstName} ${s.lastName}`).join(', ');

    if (editingReportId) {
      updateReport(editingReportId, {
        title,
        suspectId: finalSuspectId,
        suspectName: finalSuspectName,
        suspects: finalSuspects,
        charges: selectedCharges,
        totalFine,
        totalJailTime,
        description,
        assistingOfficers: finalAssisting,
        imageUrl: computedImageUrl.trim() || undefined,
        evidenceImages: evidenceImages,
        status: reportStatus,
        type: reportType,
        reporterName: reportType === 'Citizen' ? reporterName : undefined,
      });
    } else {
      submitReport({
        id: nextCaseId,
        title,
        suspectId: finalSuspectId,
        suspectName: finalSuspectName,
        suspects: finalSuspects,
        officerName: currentOfficer?.name ?? 'Sgt. Kowalski',
        officerBadge: currentOfficer?.badgeNumber ?? 'PD-01',
        charges: selectedCharges,
        totalFine,
        totalJailTime,
        description,
        assistingOfficers: finalAssisting,
        imageUrl: computedImageUrl.trim() || undefined,
        evidenceImages: evidenceImages,
        status: reportStatus,
        type: reportType,
        reporterName: reportType === 'Citizen' ? reporterName : undefined,
      });
    }

    setSuccessMessage(true);
    // Clear form inputs immediately so user knows it succeeded
    setTitle('');
    setSelectedSuspects([]);
    setSelectedCharges([]);
    setDescription('');
    setSearchCitizenQuery('');
    setSelectedOfficersList([]);
    setManualOfficerInput('');
    setOfficerSearchQuery('');
    setPenalSearchQuery('');
    setImageUrl('');
    setEvidenceImages([]);
    setEditingReportId(null);
    setReportStatus('Selesai');
    setReportType('LSPD');
    setReporterName('');
    setSelectedReporterCitizen(null);
    setSearchReporterQuery('');
    setReporterInputMode('search');
    setIsUnknownSuspect(false);

    // Smoothly redirect to dashboard so the officer sees it in real-time
    const timer = setTimeout(() => {
      setSuccessMessage(false);
      setActiveTab('dashboard');
    }, 1200);
  };

  const addCustomTag = () => {
    if (newTagInput.trim() && !customTags.includes(newTagInput.trim())) {
      setCustomTags([...customTags, newTagInput.trim()]);
      setNewTagInput('');
    }
  };

  const removeCustomTag = (tagText: string) => {
    setCustomTags(customTags.filter(t => t !== tagText));
  };

  const isCadet = currentOfficer?.rank === OfficerRank.CADET;

  if (isCadet) {
    return (
      <div className="bg-[#0b0c10] border border-[#14161f] rounded-lg p-8 text-center text-slate-400 font-mono flex flex-col items-center justify-center h-[500px]" id="reports-cadet-locked">
        <ShieldAlert className="w-16 h-16 text-rose-500 mb-4 animate-pulse shrink-0" />
        <h3 className="text-base font-bold uppercase tracking-wider text-slate-200">Akses Formulir Dikunci (View Only)</h3>
        <p className="text-xs max-w-md mt-2 text-slate-400 leading-relaxed font-sans">
          Sebagai anggota dengan pangkat <span className="text-amber-500 font-bold">Cadet (Kadet)</span>, Anda hanya memiliki hak akses baca. Anda dapat meninjau data warga, plat nomor, laporan kasus aktif, dsb. melalui tab menu lain (Dashboard, Database Warga, Samsat, Arsip Kasus) namun tidak berhak menginput atau menyunting laporan insiden kepolisian.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-left selection:bg-sky-500/20" id="reports-builder-panel">
      
      {/* LEFT COLUMN: THE CENTRAL RICH INCIDENT EDITOR (occupies col-span-8) */}
      <div className="lg:col-span-8 flex flex-col space-y-4">
        
        {/* POLISHED INCIDENT EDITOR TITLE HEADER BAR MATCHING SCREENSHOT */}
        <div className="bg-[#0b0c10] border border-[#14161f] rounded-lg p-5 shadow-2xl space-y-4 flex flex-col">
          
          <div className="bg-[#12131a] border border-[#1d202d] rounded-md px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-inner">
            <div className="flex items-center space-x-2.5 truncate flex-1">
              <span className="text-sky-400 font-mono text-sm shrink-0 font-bold">[{activeReportId}]</span>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="cth. Traffic Stop, Innocence Blvd."
                className="bg-transparent border-b border-transparent focus:border-sky-500 text-sm font-black text-white outline-none w-full max-w-xl transition-all"
                required
              />
            </div>
            
            <div className="flex items-center space-x-2 text-xs font-mono text-slate-400 self-end sm:self-auto shrink-0 select-none">
              <span className="text-slate-400 font-semibold">Kasus #{activeReportId.replace(/^REP-/, '')} ({activeReportId})</span>
              <button 
                type="button" 
                onClick={() => setShowPrintModal(true)}
                className="p-1.5 hover:bg-sky-950/60 bg-sky-950/30 border border-sky-800/40 rounded text-sky-400 hover:text-sky-300 cursor-pointer transition-colors flex items-center gap-1 font-mono text-[11px]" 
                title="Pratinjau & Cetak Dokumen Kasus LSPD"
              >
                <Printer className="w-3.5 h-3.5" />
                <span className="hidden sm:inline font-bold">Cetak</span>
              </button>
              <button 
                type="button" 
                onClick={() => {
                  setTitle('Traffic Stop, Innocence Blvd.');
                  setIncidentLocation('Innocence Blvd.');
                }}
                className="p-1.5 hover:bg-[#1f2231] rounded text-slate-400 hover:text-slate-200 cursor-pointer transition-colors" 
                title="Reset Title"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
              <button type="button" className="p-1.5 hover:bg-[#1f2231] rounded text-slate-400 hover:text-slate-200 cursor-pointer transition-colors" title="Secure Lock">
                <Shield className="w-3.5 h-3.5" />
              </button>
              <button type="button" className="p-1.5 hover:bg-[#1f2231] rounded text-rose-500/80 hover:text-rose-400 cursor-pointer transition-colors" title="Delete Incident">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="px-1 text-slate-500 font-mono text-[11px] flex justify-between items-center">
            <span>{currentOfficer?.rank} {currentOfficer?.name} - {editingReportId ? 'Last Modified' : 'Report Draft'}</span>
            <span className="text-sky-400 font-extrabold uppercase">POLICE MDT PROTOCOL</span>
          </div>

          {/* Success Banner */}
          {successMessage && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-emerald-950/60 border border-emerald-800 p-4 rounded text-emerald-300 font-bold flex flex-wrap items-center justify-between gap-3 text-xs"
            >
              <div className="flex items-center space-x-2">
                <Check className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>
                  {editingReportId 
                    ? 'LAPORAN KASUS BERHASIL DIPERBAHARUI!' 
                    : 'LAPORAN INSIDEN RESMI BERHASIL DISAHKAN KE DATABASE!'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSuccessMessage(false);
                    setActiveTab('dashboard');
                  }}
                  className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white font-mono font-bold text-[11px] rounded flex items-center gap-1.5 transition-colors cursor-pointer uppercase shadow-sm"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                  <span>Lihat di Papan Pemantauan</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowPrintModal(true)}
                  className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono font-bold text-[11px] rounded flex items-center gap-1.5 transition-colors cursor-pointer uppercase shadow-sm"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak Dokumen Resmi</span>
                </button>
              </div>
            </motion.div>
          )}

          {/* TYPE & STATUS CONTROLS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#050508] p-3.5 rounded-lg border border-[#14161f]">
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">JENIS DOKUMEN</label>
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setReportType('LSPD');
                    setReporterName('');
                  }}
                  className={`flex-1 py-1.5 rounded font-mono font-bold text-[10px] uppercase border transition-all cursor-pointer ${
                    reportType === 'LSPD'
                      ? 'bg-sky-955 border-sky-800 text-sky-400 font-black'
                      : 'bg-transparent border-slate-850 text-slate-500 hover:text-slate-350'
                  }`}
                >
                  Internal LSPD (10-15)
                </button>
                <button
                  type="button"
                  onClick={() => setReportType('Citizen')}
                  className={`flex-1 py-1.5 rounded font-mono font-bold text-[10px] uppercase border transition-all cursor-pointer ${
                    reportType === 'Citizen'
                      ? 'bg-amber-955 border-amber-800 text-amber-400 font-black'
                      : 'bg-transparent border-slate-850 text-slate-500 hover:text-slate-350'
                  }`}
                >
                  Aduan Warga
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">STATUS INSIDEN</label>
              <select
                value={reportStatus}
                onChange={(e) => setReportStatus(e.target.value as any)}
                className="w-full bg-slate-900 border border-[#1d202d] focus:border-sky-500 rounded p-1.5 text-xs text-slate-200 outline-none cursor-pointer font-mono"
              >
                <option value="Selesai">Selesai (Kasus Ditutup)</option>
                <option value="Penyelidikan">Penyelidikan (Aktif)</option>
                <option value="DPO">Tersangka Buron / DPO</option>
              </select>
            </div>
          </div>

          {/* FAKE INTERACTIVE RICH TEXT FORMATTING TOOLBAR MATCHING THE SCREENSHOT */}
          <div className="bg-[#12131a] border border-[#1d202d] rounded-md px-3 py-2 flex flex-wrap items-center gap-1 text-slate-300 select-none">
            <button type="button" className="w-7 h-7 flex items-center justify-center rounded hover:bg-slate-800 text-xs font-serif font-black" title="Bold">B</button>
            <button type="button" className="w-7 h-7 flex items-center justify-center rounded hover:bg-slate-800 text-xs italic font-serif" title="Italic">I</button>
            <button type="button" className="w-7 h-7 flex items-center justify-center rounded hover:bg-slate-800 text-xs underline decoration-2" title="Underline">U</button>
            <button type="button" className="w-7 h-7 flex items-center justify-center rounded hover:bg-slate-800 text-xs line-through" title="Strikethrough">S</button>
            
            <div className="w-[1.5px] h-5 bg-slate-800 mx-1"></div>
            
            <button type="button" className="px-2 py-0.5 rounded hover:bg-slate-800 text-[10px] font-mono font-bold" title="Font Style">Tx</button>
            <button type="button" className="w-7 h-7 flex items-center justify-center rounded hover:bg-slate-800 text-xs" title="Link / URL">🔗</button>
            <button type="button" className="w-7 h-7 flex items-center justify-center rounded hover:bg-slate-800 text-xs" title="Code Block">&lt;/&gt;</button>
            
            <div className="w-[1.5px] h-5 bg-slate-800 mx-1"></div>
            
            <button type="button" className="px-1.5 h-7 rounded hover:bg-slate-800 text-[10px] font-mono font-extrabold" title="Heading 1">H1</button>
            <button type="button" className="px-1.5 h-7 rounded hover:bg-slate-800 text-[10px] font-mono font-extrabold" title="Heading 2">H2</button>
            <button type="button" className="px-1.5 h-7 rounded hover:bg-slate-800 text-[10px] font-mono font-extrabold" title="Heading 3">H3</button>
            <button type="button" className="px-1.5 h-7 rounded hover:bg-slate-800 text-[10px] font-mono font-extrabold" title="Heading 4">H4</button>
            
            <div className="w-[1.5px] h-5 bg-slate-800 mx-1"></div>
            
            <button type="button" className="w-7 h-7 flex items-center justify-center rounded hover:bg-slate-800 text-xs" title="Bullet List">☰</button>
            <button type="button" className="w-7 h-7 flex items-center justify-center rounded hover:bg-slate-800 text-xs" title="Align Left">⫷</button>
            <button type="button" className="w-7 h-7 flex items-center justify-center rounded hover:bg-slate-800 text-xs" title="Align Center">⫸⫷</button>
            <button type="button" className="w-7 h-7 flex items-center justify-center rounded hover:bg-slate-800 text-xs" title="Align Right">⫸</button>
            
            <div className="w-[1.5px] h-5 bg-slate-800 mx-1"></div>
            
            {/* Color circles */}
            <div className="flex items-center space-x-1 pl-1">
              <span className="w-4 h-4 rounded-full bg-white border border-slate-950 cursor-pointer shadow" title="White text"></span>
              <span className="w-4 h-4 rounded-full bg-[#fa8072] border border-slate-950 cursor-pointer shadow" title="Red Salmon text"></span>
              <span className="w-4 h-4 rounded-full bg-sky-400 border border-slate-950 cursor-pointer shadow" title="Sky Blue text"></span>
              <span className="w-4 h-4 rounded-full bg-emerald-400 border border-slate-950 cursor-pointer shadow" title="Emerald Green text"></span>
            </div>
          </div>

          {/* THE DOCUMENT SHEET PAPER CONTAINER */}
          <div className="bg-[#050508] border border-[#14161f] rounded-md p-6 font-mono text-xs flex flex-col space-y-4 shadow-inner relative overflow-hidden">
            
            {/* Accent glowing seal */}
            <div className="absolute right-3 top-3 opacity-5 pointer-events-none">
              <img src={lspdLogo} alt="" className="w-32 h-32 object-contain" />
            </div>

            {/* Title block */}
            <div className="text-center py-4 border-b border-[#14161f] space-y-1">
              <h3 className="text-base font-black tracking-widest text-slate-100">LSPD REPORT {new Date().toLocaleDateString('en-US')}</h3>
              <div className="w-36 h-[1.5px] bg-[#14161f] mx-auto"></div>
            </div>

            {/* Core structured metadata */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2 border-b border-[#14161f] text-slate-400">
              <div className="space-y-3">
                <div>
                  <span className="text-slate-500 block text-[9.5px] font-bold uppercase tracking-wider">Incident Commander / Reporting Officer :</span>
                  <span className="text-slate-200 font-extrabold text-[12px]">[{currentOfficer?.badgeNumber}] {currentOfficer?.name}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[9.5px] font-bold uppercase tracking-wider">Officer Involved:</span>
                  <span className="text-slate-200 font-bold">
                    {selectedOfficersList.length > 0 ? selectedOfficersList.join(', ') : 'None'}
                  </span>
                </div>
              </div>
              
              <div className="space-y-3">
                <div>
                  <span className="text-slate-500 block text-[9.5px] font-bold uppercase tracking-wider">Location / Street:</span>
                  <div className="flex items-center space-x-2 mt-0.5">
                    <input 
                      type="text"
                      value={incidentLocation}
                      onChange={(e) => setIncidentLocation(e.target.value)}
                      placeholder="Masukkan nama jalan..."
                      className="bg-[#12131a] border border-[#1d202d] rounded px-2 py-1 text-xs text-amber-500 font-extrabold uppercase outline-none focus:border-amber-500 w-full"
                    />
                  </div>
                </div>
                <div>
                  <span className="text-slate-500 block text-[9.5px] font-bold uppercase tracking-wider">Status & Dokumen:</span>
                  <div className="flex items-center space-x-1.5 mt-0.5 select-none">
                    <span className="bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-[9px] font-bold text-slate-400 uppercase">
                      {reportStatus}
                    </span>
                    <span className="bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-[9px] font-bold text-slate-400 uppercase">
                      {reportType === 'LSPD' ? '10-15 LSPD' : 'Citizen'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Debrief narrative text area */}
            <div className="space-y-2 pt-2 text-left">
              <div className="flex items-center justify-between">
                <span className="text-slate-100 font-black block text-[13px] tracking-widest uppercase">Debrief :</span>
                
                <button
                  type="button"
                  onClick={() => {
                    const templateStr = `=== LAPORAN INSIDEN LSPD ===\n` +
                      `[WHAT / APA]\n` +
                      `- Tindakan Kriminal: \n` +
                      `- Ringkasan Kejadian: \n\n` +
                      `[WHO / SIAPA]\n` +
                      `- Pelaku / Suspek: ${isUnknownSuspect ? 'Tidak Diketahui (Lidik)' : selectedSuspects.map(s => `${s.firstName} ${s.lastName}`).join(', ') || ''}\n` +
                      `- Korban / Saksi: \n\n` +
                      `[WHERE / DI MANA]\n` +
                      `- Lokasi Kejadian (TKP): ${incidentLocation}\n\n` +
                      `[WHEN / KAPAN]\n` +
                      `- Tanggal & Waktu Kejadian: \n\n` +
                      `[WHY / MENGAPA]\n` +
                      `- Motif / Latar Belakang: \n\n` +
                      `[HOW / BAGAIMANA]\n` +
                      `- Kronologis Penangkapan / Tindakan Polisi: \n` +
                      `- Barang Bukti yang Diamankan: `;
                    
                    setDescription(templateStr);
                  }}
                  className="bg-sky-955 hover:bg-sky-900 border border-sky-900 text-sky-400 px-2.5 py-1 rounded text-[9.5px] font-mono font-bold uppercase transition-all cursor-pointer flex items-center gap-1 shrink-0"
                >
                  <BookOpen className="w-3 h-3 text-sky-400" /> Terapkan Templat 5W+1H (LSPD)
                </button>
              </div>

              <textarea
                id="report-narrative-textarea"
                placeholder="Tulis keterangan kronologis, interogasi, barang bukti disita, plat kendaraan, secara mendalam..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-transparent border-0 focus:ring-0 focus:outline-none text-slate-300 placeholder-slate-700 min-h-[350px] resize-none font-sans leading-relaxed text-sm"
                required
              />
            </div>

          </div>

          {/* Form Actions footer */}
          <div className="pt-3 border-t border-[#14161f] flex flex-col sm:flex-row gap-3">
            {editingReportId && (
              <button
                type="button"
                onClick={() => {
                  setEditingReportId(null);
                  setActiveTab('dashboard');
                }}
                className="flex-1 py-2.5 rounded font-bold uppercase tracking-wider flex items-center justify-center space-x-2 cursor-pointer bg-slate-900 hover:bg-slate-800 text-rose-400 border border-[#14161f] text-xs font-mono transition-all"
              >
                <X className="w-4 h-4 shrink-0" />
                <span>Batal Edit</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setShowPrintModal(true)}
              className="px-4 py-2.5 rounded font-bold uppercase tracking-wider flex items-center justify-center space-x-2 cursor-pointer bg-slate-900 hover:bg-slate-850 text-sky-400 border border-sky-800/60 text-xs font-mono transition-all"
              title="Pratinjau Dokumen Cetak LSPD Resmi"
            >
              <Printer className="w-4 h-4 shrink-0" />
              <span>Pratinjau Cetak</span>
            </button>
            
            <button
              id="submit-report-btn"
              onClick={handleSubmit}
              disabled={successMessage || !canSubmit}
              className={`flex-[2] py-2.5 rounded font-bold uppercase tracking-widest flex items-center justify-center space-x-2 cursor-pointer text-xs font-mono transition-all ${
                successMessage || !canSubmit
                  ? 'bg-slate-900 text-slate-600 border border-[#14161f] cursor-not-allowed'
                  : editingReportId 
                    ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/10'
                    : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/10 animate-pulse-subtle'
              }`}
            >
              <Check className="w-4 h-4 shrink-0" />
              <span>{editingReportId ? 'Simpan Perubahan Laporan' : 'Sahkan Tiket Laporan Kriminal'}</span>
            </button>
          </div>

        </div>
      </div>

      {/* RIGHT COLUMN: THE IMMERSIVE COLLAPSIBLE ACCORDION SIDEBAR (occupies col-span-4) */}
      <div className="lg:col-span-4 flex flex-col space-y-3 select-none">
        
        {/* TOTAL PUNISHMENT ACCUMULATOR MONITOR */}
        <div className="bg-[#0b0c10] border border-[#14161f] rounded-lg p-4 font-mono text-center shadow-lg">
          <span className="text-[10px] text-[#5bc0be] font-bold tracking-widest block uppercase mb-1">TOTAL HUKUMAN AKUMULASI</span>
          
          <div className="grid grid-cols-2 gap-3 py-2 border-y border-[#14161f] mt-2 bg-[#050508]/40 rounded p-1.5">
            <div>
              <p className="text-[10px] text-slate-550">DENDA FINES</p>
              <h3 className="text-base font-black text-amber-400">${totalFine.toLocaleString()}</h3>
            </div>
            <div>
              <p className="text-[10px] text-slate-550">MASUK PENJARA</p>
              <h3 className="text-base font-black text-rose-400">{totalJailTime} Bulan Sel</h3>
            </div>
          </div>
          <p className="text-[9px] text-slate-500 pt-2 leading-tight">
            Diperoleh otomatis berdasarkan pasal-pasal yang dicentang di panel undang-undang di bawah.
          </p>
        </div>

        {/* ACCORDION 1: TAG */}
        <div className="bg-[#0b0c10] border border-[#14161f] rounded-lg overflow-hidden shadow">
          <button 
            type="button" 
            onClick={() => toggleSection('tag')}
            className="w-full px-4 py-3 flex items-center justify-between font-mono font-bold text-xs text-slate-300 hover:bg-slate-900/30 transition-colors uppercase tracking-wider"
          >
            <span>Tag</span>
            <div className="flex items-center space-x-1">
              <span className="text-[10px] bg-sky-955 text-sky-400 px-1.5 rounded font-black">{customTags.length}</span>
              {sectionsOpen.tag ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </div>
          </button>
          
          <AnimatePresence>
            {sectionsOpen.tag && (
              <motion.div 
                initial={{ height: 0 }} 
                animate={{ height: 'auto' }} 
                exit={{ height: 0 }}
                className="overflow-hidden border-t border-[#14161f] bg-[#050508]/40 p-3.5 space-y-3 text-xs"
              >
                {/* Active Pills */}
                <div className="flex flex-wrap gap-1.5">
                  {customTags.map((tag, idx) => (
                    <span key={idx} className="bg-slate-900 border border-slate-800 text-slate-300 pl-2 pr-1 py-0.5 rounded flex items-center gap-1 text-[10px] font-mono">
                      <span>{tag}</span>
                      <button type="button" onClick={() => removeCustomTag(tag)} className="text-rose-500 hover:text-rose-400 p-0.5 font-black">×</button>
                    </span>
                  ))}
                </div>
                
                {/* Add new tag */}
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={newTagInput}
                    onChange={(e) => setNewTagInput(e.target.value)}
                    placeholder="Tambah tag baru..."
                    className="w-full bg-slate-950 border border-slate-850 focus:border-sky-500 rounded px-2.5 py-1.5 text-[10.5px] text-slate-200 outline-none font-mono"
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomTag())}
                  />
                  <button type="button" onClick={addCustomTag} className="bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold px-2 rounded font-mono text-[11px] cursor-pointer">
                    +
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ACCORDION 2: KARYAWAN (Officers involved) */}
        <div className="bg-[#0b0c10] border border-[#14161f] rounded-lg overflow-hidden shadow">
          <button 
            type="button" 
            onClick={() => toggleSection('karyawan')}
            className="w-full px-4 py-3 flex items-center justify-between font-mono font-bold text-xs text-slate-300 hover:bg-slate-900/30 transition-colors uppercase tracking-wider"
          >
            <span>Karyawan (Petugas)</span>
            <div className="flex items-center space-x-1">
              <span className="text-[10px] bg-sky-955 text-sky-400 px-1.5 rounded font-black">{selectedOfficersList.length}</span>
              {sectionsOpen.karyawan ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </div>
          </button>
          
          <AnimatePresence>
            {sectionsOpen.karyawan && (
              <motion.div 
                initial={{ height: 0 }} 
                animate={{ height: 'auto' }} 
                exit={{ height: 0 }}
                className="overflow-hidden border-t border-[#14161f] bg-[#050508]/40 p-3.5 space-y-3 text-xs"
              >
                {/* Selected Officers List */}
                <div className="space-y-1">
                  {selectedOfficersList.length === 0 ? (
                    <p className="text-[10px] text-slate-550 italic font-mono text-center">Belum ada rekan terlibat.</p>
                  ) : (
                    selectedOfficersList.map((officer, idx) => (
                      <div key={idx} className="flex items-center justify-between p-1.5 rounded bg-slate-950 border border-slate-900 font-mono text-[10.5px]">
                        <span className="text-slate-300">{officer}</span>
                        <button type="button" onClick={() => setSelectedOfficersList(prev => prev.filter(o => o !== officer))} className="text-rose-500 hover:text-rose-400 font-extrabold px-1">×</button>
                      </div>
                    ))
                  )}
                </div>

                {/* Search input with suggestions */}
                <div className="space-y-1.5 pt-1">
                  <input
                    type="text"
                    value={officerSearchQuery}
                    onChange={(e) => setOfficerSearchQuery(e.target.value)}
                    placeholder="Cari anggota roster..."
                    className="w-full bg-slate-950 border border-slate-850 focus:border-sky-500 rounded px-2 py-1.5 text-[10.5px] text-slate-200 outline-none font-mono"
                  />
                  {officerSearchQuery && (
                    <div className="max-h-24 overflow-y-auto bg-slate-950 border border-slate-850 rounded p-1 space-y-0.5">
                      {registeredOfficers
                        .filter(o => o.name.toLowerCase().includes(officerSearchQuery.toLowerCase()) || o.badgeNumber.includes(officerSearchQuery))
                        .map(o => (
                          <div 
                            key={o.badgeNumber}
                            onClick={() => {
                              const label = `[${o.badgeNumber}] ${o.name}`;
                              if (!selectedOfficersList.includes(label)) {
                                setSelectedOfficersList([...selectedOfficersList, label]);
                              }
                              setOfficerSearchQuery('');
                            }}
                            className="p-1 hover:bg-slate-900 rounded cursor-pointer text-[10px] font-mono text-slate-300 flex justify-between"
                          >
                            <span>{o.name}</span>
                            <span className="text-slate-500">#{o.badgeNumber}</span>
                          </div>
                        ))
                      }
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ACCORDION 3: KRIMINAL (Suspects) */}
        <div className="bg-[#0b0c10] border border-[#14161f] rounded-lg overflow-hidden shadow">
          <button 
            type="button" 
            onClick={() => toggleSection('kriminal')}
            className="w-full px-4 py-3 flex items-center justify-between font-mono font-bold text-xs text-slate-300 hover:bg-slate-900/30 transition-colors uppercase tracking-wider"
          >
            <span>Kriminal (Tersangka)</span>
            <div className="flex items-center space-x-1">
              <span className="text-[10px] bg-sky-955 text-sky-400 px-1.5 rounded font-black">{isUnknownSuspect ? 'LIDIK' : selectedSuspects.length}</span>
              {sectionsOpen.kriminal ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </div>
          </button>
          
          <AnimatePresence>
            {sectionsOpen.kriminal && (
              <motion.div 
                initial={{ height: 0 }} 
                animate={{ height: 'auto' }} 
                exit={{ height: 0 }}
                className="overflow-hidden border-t border-[#14161f] bg-[#050508]/40 p-3.5 space-y-3 text-xs"
              >
                {/* Unknown Switch */}
                <label className="flex items-center space-x-2 bg-slate-950/80 p-2 border border-slate-900 rounded cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isUnknownSuspect}
                    onChange={(e) => setIsUnknownSuspect(e.target.checked)}
                    className="accent-sky-500 cursor-pointer"
                  />
                  <span className="text-[10px] font-mono font-bold text-slate-300 uppercase">Tersangka Tidak Diketahui (Lidik)</span>
                </label>

                {!isUnknownSuspect && (
                  <>
                    {/* Selected suspects list */}
                    <div className="space-y-1.5">
                      {selectedSuspects.length === 0 ? (
                        <p className="text-[10px] text-slate-550 italic font-mono text-center py-1">Belum ada tersangka terpilih.</p>
                      ) : (
                        selectedSuspects.map(sus => (
                          <div key={sus.id} className="flex items-center justify-between p-1.5 rounded bg-slate-950 border border-slate-900 font-mono text-[10.5px]">
                            <span className="text-slate-200 truncate font-sans">{sus.firstName} {sus.lastName}</span>
                            <button type="button" onClick={() => handleRemoveSuspect(sus.id)} className="text-rose-500 hover:text-rose-400 font-extrabold px-1">×</button>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Citizen search block */}
                    <div className="space-y-1.5">
                      <input
                        type="text"
                        value={searchCitizenQuery}
                        onChange={(e) => setSearchCitizenQuery(e.target.value)}
                        placeholder="Ketik NIK atau Nama warga..."
                        className="w-full bg-slate-950 border border-slate-850 focus:border-sky-500 rounded px-2 py-1.5 text-[10.5px] text-slate-200 outline-none font-mono"
                      />
                      
                      {searchCitizenQuery && (
                        <div className="max-h-28 overflow-y-auto bg-slate-950 border border-slate-850 rounded p-1 space-y-1 text-[10px] font-sans">
                          {filteredCitizens.slice(0, 5).map(cit => (
                            <div 
                              key={cit.id}
                              onClick={() => {
                                handleAddSuspect(cit);
                                setSearchCitizenQuery('');
                              }}
                              className="p-1 hover:bg-slate-900 rounded cursor-pointer flex items-center justify-between text-slate-300"
                            >
                              <span>{cit.firstName} {cit.lastName}</span>
                              <span className="text-slate-500 font-mono text-[9px]">{cit.id}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ACCORDION 4: WARGA SIPIL (Victims / Reporter) */}
        <div className="bg-[#0b0c10] border border-[#14161f] rounded-lg overflow-hidden shadow">
          <button 
            type="button" 
            onClick={() => toggleSection('warga')}
            className="w-full px-4 py-3 flex items-center justify-between font-mono font-bold text-xs text-slate-300 hover:bg-slate-900/30 transition-colors uppercase tracking-wider"
          >
            <span>Warga Sipil (Pelapor)</span>
            <div className="flex items-center space-x-1">
              {reporterName && (
                <span className="text-[9px] bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 px-1.5 py-0.2 rounded font-black font-mono">
                  TERPILIH
                </span>
              )}
              {sectionsOpen.warga ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </div>
          </button>
          
          <AnimatePresence>
            {sectionsOpen.warga && (
              <motion.div 
                initial={{ height: 0 }} 
                animate={{ height: 'auto' }} 
                exit={{ height: 0 }}
                className="overflow-hidden border-t border-[#14161f] bg-[#050508]/40 p-3.5 space-y-3.5 text-xs text-left"
              >
                {/* Select Mode */}
                <div className="flex bg-slate-950 border border-slate-900 rounded p-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      setReporterInputMode('search');
                      setSearchReporterQuery('');
                    }}
                    className={`flex-1 py-1 rounded text-[9.5px] font-mono font-bold transition-all uppercase ${
                      reporterInputMode === 'search'
                        ? 'bg-slate-900 text-amber-400'
                        : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    Cari Data Warga
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setReporterInputMode('manual');
                      setSelectedReporterCitizen(null);
                    }}
                    className={`flex-1 py-1 rounded text-[9.5px] font-mono font-bold transition-all uppercase ${
                      reporterInputMode === 'manual'
                        ? 'bg-slate-900 text-amber-400'
                        : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    Input Manual / Non-Sipil
                  </button>
                </div>

                {reporterInputMode === 'search' ? (
                  <div className="space-y-2">
                    {selectedReporterCitizen ? (
                      /* Display Selected Citizen */
                      <div className="bg-slate-950 border border-slate-900 rounded p-3 flex items-start justify-between relative overflow-hidden group">
                        <div className="flex items-center space-x-3">
                          <img
                            src={selectedReporterCitizen.avatar && selectedReporterCitizen.avatar.trim() !== '' ? selectedReporterCitizen.avatar : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100'}
                            alt={selectedReporterCitizen.firstName}
                            className="w-10 h-10 rounded border border-slate-800 object-cover"
                            referrerPolicy="no-referrer"
                          />
                          <div className="space-y-0.5">
                            <h4 className="text-xs font-bold text-slate-100 font-sans">
                              {selectedReporterCitizen.firstName} {selectedReporterCitizen.lastName}
                            </h4>
                            <p className="text-[9px] font-mono text-slate-400">
                              NIK: <span className="text-amber-400">{selectedReporterCitizen.id}</span>
                            </p>
                            <p className="text-[9px] text-slate-500 font-sans">
                              Telp: {selectedReporterCitizen.phone || 'Tidak Ada'}
                            </p>
                            <span className="inline-flex items-center gap-1 text-[8px] bg-emerald-950/80 border border-emerald-900/50 text-emerald-400 px-1.5 py-0.2 rounded font-bold uppercase tracking-wider font-mono mt-1">
                              ✓ Data Terdaftar
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedReporterCitizen(null);
                            setReporterName('');
                            setSearchReporterQuery('');
                          }}
                          className="text-rose-500 hover:text-rose-400 font-mono text-[10px] font-bold border border-rose-950/60 bg-rose-950/25 px-2 py-1 rounded hover:bg-rose-900/20 uppercase tracking-wider cursor-pointer"
                        >
                          Ganti
                        </button>
                      </div>
                    ) : (
                      /* Search list */
                      <div className="space-y-1.5">
                        <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wide">Cari Warga Sipil (Pelapor)</label>
                        <input
                          type="text"
                          value={searchReporterQuery}
                          onChange={(e) => setSearchReporterQuery(e.target.value)}
                          placeholder="Ketik NIK atau Nama warga..."
                          className="w-full bg-slate-950 border border-slate-850 focus:border-sky-500 rounded px-2.5 py-1.5 text-[10.5px] text-slate-200 outline-none font-mono"
                        />
                        
                        {searchReporterQuery && (
                          <div className="max-h-32 overflow-y-auto bg-slate-950 border border-slate-850 rounded p-1 space-y-1 text-[10px] font-sans">
                            {filteredReporterCitizens.length === 0 ? (
                              <p className="text-[10px] text-slate-550 italic py-1 text-center font-mono font-bold">Warga tidak ditemukan.</p>
                            ) : (
                              filteredReporterCitizens.slice(0, 5).map(cit => (
                                <div 
                                  key={cit.id}
                                  onClick={() => {
                                    setSelectedReporterCitizen(cit);
                                    setReporterName(`${cit.firstName} ${cit.lastName}`);
                                    setSearchReporterQuery('');
                                  }}
                                  className="p-1.5 hover:bg-slate-900 rounded cursor-pointer flex items-center justify-between text-slate-300"
                                >
                                  <div className="flex items-center space-x-2">
                                    <img
                                      src={cit.avatar && cit.avatar.trim() !== '' ? cit.avatar : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=50'}
                                      alt={cit.firstName}
                                      className="w-5 h-5 rounded-full border border-slate-800 object-cover"
                                      referrerPolicy="no-referrer"
                                    />
                                    <span>{cit.firstName} {cit.lastName}</span>
                                  </div>
                                  <span className="text-slate-500 font-mono text-[9px]">NIK: {cit.id}</span>
                                </div>
                              ))
                            )}
                          </div>
                        )}
                        <p className="text-[8.5px] text-slate-550 font-sans italic mt-1 leading-relaxed">
                          Saran: Carilah dari database kependudukan resmi untuk memastikan akurasi data pelapor.
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Manual input */
                  <div className="space-y-1.5">
                    <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wide">Nama Lengkap Warga Pelapor (Manual)</label>
                    <input
                      type="text"
                      value={reporterName}
                      onChange={(e) => setReporterName(e.target.value)}
                      placeholder="cth. Charles Baker"
                      className="w-full bg-slate-950 border border-slate-850 focus:border-sky-500 rounded px-2.5 py-1.5 text-[11px] text-slate-200 outline-none font-sans"
                    />
                    <div className="flex items-start space-x-1.5 text-[8.5px] bg-amber-955/35 border border-amber-900/30 p-2 rounded text-amber-400 font-sans leading-relaxed">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                      <span>Input manual tidak menghubungkan rekor ke database sipil resmi. Gunakan fitur "Cari Data Warga" bila memungkinkan.</span>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ACCORDION 5: SENJATA & PASAL (Penal Code Directory) */}
        <div className="bg-[#0b0c10] border border-[#14161f] rounded-lg overflow-hidden shadow">
          <button 
            type="button" 
            onClick={() => toggleSection('senjata')}
            className="w-full px-4 py-3 flex items-center justify-between font-mono font-bold text-xs text-slate-300 hover:bg-slate-900/30 transition-colors uppercase tracking-wider"
          >
            <span>Undang-Undang / Pasal</span>
            <div className="flex items-center space-x-1">
              <span className="text-[10px] bg-amber-500/15 text-amber-400 px-1.5 rounded font-black">{selectedCharges.length}</span>
              {sectionsOpen.senjata ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </div>
          </button>
          
          <AnimatePresence>
            {sectionsOpen.senjata && (
              <motion.div 
                initial={{ height: 0 }} 
                animate={{ height: 'auto' }} 
                exit={{ height: 0 }}
                className="overflow-hidden border-t border-[#14161f] bg-[#050508]/40 p-3 flex flex-col text-xs space-y-3"
              >
                {/* Selected pills summary with easy click-delete */}
                {selectedCharges.length > 0 && (
                  <div className="flex flex-wrap gap-1 p-1 bg-slate-950/80 rounded border border-slate-900 max-h-24 overflow-y-auto">
                    {selectedCharges.map(ch => (
                      <span 
                        key={ch.code}
                        onClick={() => handleToggleCharge(ch)}
                        className="bg-amber-955 text-amber-400 border border-amber-900/40 px-1.5 py-0.5 rounded text-[9.5px] font-mono flex items-center gap-1 cursor-pointer hover:bg-rose-955 hover:text-rose-400"
                        title="Klik hapus"
                      >
                        <span>{ch.title}</span>
                        <span className="text-[8px] opacity-75">×</span>
                      </span>
                    ))}
                  </div>
                )}

                {/* Filter and selector */}
                <div className="space-y-2">
                  <input
                    type="text"
                    value={penalSearchQuery}
                    onChange={(e) => setPenalSearchQuery(e.target.value)}
                    placeholder="Saring Pasal / UU..."
                    className="w-full bg-slate-950 border border-slate-850 focus:border-sky-500 rounded px-2 py-1.5 text-[10px] text-slate-200 outline-none font-mono"
                  />

                  <div className="max-h-[220px] overflow-y-auto space-y-3.5 pr-0.5">
                    {categories.map(cat => {
                      const codes = filteredPenalCodes.filter(c => c.category === cat);
                      if (codes.length === 0) return null;
                      return (
                        <div key={cat} className="space-y-1">
                          <p className="text-[9.5px] font-bold text-sky-400 uppercase tracking-widest border-b border-slate-900 pb-0.5">{cat}</p>
                          <div className="space-y-1">
                            {codes.map(code => {
                              const isChecked = selectedCharges.some(c => c.code === code.code);
                              return (
                                <div 
                                  key={code.code}
                                  onClick={() => handleToggleCharge(code)}
                                  className={`p-2 rounded border cursor-pointer transition-all flex items-start gap-1.5 ${
                                    isChecked 
                                      ? 'bg-amber-955 border-amber-800 text-amber-400 font-extrabold' 
                                      : 'bg-slate-950/60 border-slate-900/60 text-slate-400 hover:border-slate-800'
                                  }`}
                                >
                                  <input 
                                    type="checkbox" 
                                    checked={isChecked} 
                                    onChange={() => {}} // handled by parent click
                                    className="accent-amber-500 mt-0.5 pointer-events-none shrink-0 w-3 h-3"
                                  />
                                  <div className="leading-tight flex-1">
                                    <div className="flex justify-between font-mono text-[10px]">
                                      <span>{code.title}</span>
                                      <span className="text-[8.5px] opacity-60 font-bold">[{code.code}]</span>
                                    </div>
                                    <p className="text-[9px] text-slate-500 leading-normal mt-0.5 font-sans">{code.description}</p>
                                    <p className="text-[8.5px] text-slate-500 font-mono mt-1 font-bold">Denda: ${code.fine.toLocaleString()} | Sel: {code.jailTime} Bln</p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ACCORDION 6: BARANG BUKTI SITAAAN */}
        <div className="bg-[#0b0c10] border border-[#14161f] rounded-lg overflow-hidden shadow">
          <button 
            type="button" 
            onClick={() => toggleSection('evidence')}
            className="w-full px-4 py-3 flex items-center justify-between font-mono font-bold text-xs text-slate-300 hover:bg-slate-900/30 transition-colors uppercase tracking-wider"
          >
            <span>Barang Bukti</span>
            <div className="flex items-center space-x-1">
              {sectionsOpen.evidence ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </div>
          </button>
          
          <AnimatePresence>
            {sectionsOpen.evidence && (
              <motion.div 
                initial={{ height: 0 }} 
                animate={{ height: 'auto' }} 
                exit={{ height: 0 }}
                className="overflow-hidden border-t border-[#14161f] bg-[#050508]/40 p-3.5 space-y-2 text-xs"
              >
                <div className="space-y-1">
                  <label className="block text-[9px] font-bold text-slate-500 uppercase">Input Barang Bukti Sitaan</label>
                  <textarea
                    placeholder="Pisau, Pistol Glock-17, 12g Narkoba Sabu, Plat Mobil Palsu..."
                    value={manualOfficerInput}
                    onChange={(e) => setManualOfficerInput(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 focus:border-sky-500 rounded p-2 text-[10.5px] text-slate-200 placeholder-slate-700 font-sans outline-none h-16 resize-none"
                  />
                  <p className="text-[9px] text-slate-550 leading-normal">Catat semua barang sitaan, senjata ilegal, maupun uang tunai yang disita dari TKP.</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ACCORDION 7: FOTO & GALERI ALBUM */}
        <div className="bg-[#0b0c10] border border-[#14161f] rounded-lg overflow-hidden shadow">
          <button 
            type="button" 
            onClick={() => toggleSection('foto')}
            className="w-full px-4 py-3 flex items-center justify-between font-mono font-bold text-xs text-slate-300 hover:bg-slate-900/30 transition-colors uppercase tracking-wider"
          >
            <span>Foto & Album Bukti</span>
            <div className="flex items-center space-x-1">
              <span className="text-[10px] bg-sky-955 text-sky-400 px-1.5 rounded font-black">{evidenceImages.length}</span>
              {sectionsOpen.foto ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </div>
          </button>
          
          <AnimatePresence>
            {sectionsOpen.foto && (
              <motion.div 
                initial={{ height: 0 }} 
                animate={{ height: 'auto' }} 
                exit={{ height: 0 }}
                className="overflow-hidden border-t border-[#14161f] bg-[#050508]/40 p-3 space-y-3.5 text-xs"
              >
                {/* Images list slider */}
                {evidenceImages.length > 0 && (
                  <div className="grid grid-cols-2 gap-2">
                    {evidenceImages.map(img => (
                      <div key={img.id} className="bg-slate-950 border border-slate-900 rounded p-1 flex flex-col relative group">
                        <img 
                          src={img.url} 
                          alt={img.caption} 
                          className="aspect-video w-full object-cover rounded border border-slate-850"
                        />
                        <span className="text-[8.5px] text-slate-350 truncate mt-1 block px-0.5 leading-tight">{img.caption}</span>
                        <button 
                          type="button" 
                          onClick={() => setEvidenceImages(evidenceImages.filter(i => i.id !== img.id))}
                          className="absolute inset-0 bg-black/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded cursor-pointer text-rose-500 font-bold font-mono text-[9.5px]"
                        >
                          HAPUS
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Form new */}
                <div className="bg-slate-950 p-2.5 rounded border border-slate-900 space-y-2">
                  <div className="space-y-1">
                    <label className="block text-[8.5px] font-bold text-slate-500 uppercase font-mono">Tautan URL Foto</label>
                    <input
                      type="url"
                      value={newImgUrl}
                      onChange={(e) => setNewImgUrl(e.target.value)}
                      placeholder="https://imgur.com/..."
                      className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-[10px] text-slate-200 outline-none font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[8.5px] font-bold text-slate-500 uppercase font-mono">Keterangan / Kategori</label>
                    <input
                      type="text"
                      value={newImgCaption}
                      onChange={(e) => setNewImgCaption(e.target.value)}
                      placeholder="cth. Senjata disita"
                      className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-[10px] text-slate-200 outline-none font-sans"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (!newImgUrl.trim()) return;
                      const newImg = {
                        id: `img-${Date.now()}`,
                        url: newImgUrl.trim(),
                        caption: newImgCaption.trim() || 'Barang Bukti',
                        type: 'evidence' as const,
                      };
                      setEvidenceImages([...evidenceImages, newImg]);
                      setNewImgUrl('');
                      setNewImgCaption('');
                    }}
                    className="w-full py-1.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold rounded text-[9.5px] font-mono cursor-pointer uppercase transition-all"
                  >
                    Tambah Foto
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>

      {/* SEKSI CETAK DOKUMEN KASUS LAPORAN SECARA NYATA (HANYA MUNCUL SAAT CETAK BROWSER PRINT) */}
      {showPrintModal && createPortal(
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
                <div className="text-[7.5px] text-gray-500 mt-0.5">REGISTER: {activeReportId} • STATUS: RESMI</div>
              </div>
            </div>
          </div>

          {/* Judul Dokumen */}
          <div className="text-center mb-5 border-b border-black pb-3">
            <h2 className="text-xs font-black underline uppercase tracking-widest text-black font-mono">
              BERITA ACARA PEMERIKSAAN KASUS & LAPORAN INSIDEN
            </h2>
            <div className="flex items-center justify-center gap-4 text-[9.5px] text-gray-700 font-mono mt-1 font-semibold">
              <span>NO. BERKAS: <strong className="text-black">{activeReportId}</strong></span>
              <span>•</span>
              <span>KLASIFIKASI: <strong className="text-black uppercase">{reportType === 'Citizen' ? 'LAPORAN WARGA / SAKSI' : 'LAPORAN INTERNAL 10-15'}</strong></span>
              <span>•</span>
              <span>STATUS: <strong className="text-black uppercase">{reportStatus}</strong></span>
            </div>
          </div>

          {/* Rincian Berkas & Data Pihak Terkait */}
          <div className="grid grid-cols-2 gap-y-2 border border-black p-4 mb-5 bg-gray-50 rounded">
            <div>
              <p className="font-bold text-black text-[10px] uppercase border-b border-gray-400 pb-1 mb-2">METADATA KASUS:</p>
              <table className="w-full text-left text-[10px] leading-normal">
                <tbody>
                  <tr>
                    <td className="font-bold pr-2 pb-1 text-gray-650 w-28">ID BERKAS:</td>
                    <td className="pb-1 font-mono font-bold text-black">{activeReportId}</td>
                  </tr>
                  <tr>
                    <td className="font-bold pr-2 pb-1 text-gray-650">JUDUL INSIDEN:</td>
                    <td className="pb-1 font-sans font-bold text-black">{title || 'Insiden Tanpa Judul'}</td>
                  </tr>
                  <tr>
                    <td className="font-bold pr-2 pb-1 text-gray-650">LOKASI KEJADIAN:</td>
                    <td className="pb-1 font-mono text-black">{incidentLocation || 'Tidak Tercatat'}</td>
                  </tr>
                  <tr>
                    <td className="font-bold pr-2 pb-1 text-gray-650">WAKTU INPUT:</td>
                    <td className="pb-1 font-mono text-black">{new Date(editingReportId ? (reports.find(r => r.id === editingReportId)?.date || new Date().toISOString()) : new Date().toISOString()).toLocaleString('id-ID')}</td>
                  </tr>
                  <tr>
                    <td className="font-bold pr-2 pb-1 text-gray-650">TIPE LAPORAN:</td>
                    <td className="pb-1 font-bold text-black uppercase">{reportType === 'Citizen' ? 'Laporan Warga' : 'Laporan Petugas LSPD (10-15)'}</td>
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
                    <td className="pb-1 font-sans font-bold text-black">
                      {isUnknownSuspect || selectedSuspects.length === 0
                        ? 'Tidak Diketahui / Dalam Penyelidikan'
                        : selectedSuspects.map(s => `${s.firstName} ${s.lastName} (${s.id})`).join(', ')}
                    </td>
                  </tr>
                  <tr>
                    <td className="font-bold pr-2 pb-1 text-gray-650">PENYIDIK (LSPD):</td>
                    <td className="pb-1 font-sans font-bold text-black">{currentOfficer?.rank} {currentOfficer?.name} (LSPD-{currentOfficer?.badgeNumber})</td>
                  </tr>
                  <tr>
                    <td className="font-bold pr-2 pb-1 text-gray-650">UNIT BACKUP:</td>
                    <td className="pb-1 text-black font-mono text-[9px]">{selectedOfficersList.length > 0 ? selectedOfficersList.join(', ') : '-'}</td>
                  </tr>
                  <tr>
                    <td className="font-bold pr-2 pb-1 text-gray-650">PELAPOR / KORBAN:</td>
                    <td className="pb-1 text-black font-sans">{reporterName || (reportType === 'Citizen' ? 'Warga Tanpa Nama' : 'Aparatur Petugas LSPD')}</td>
                  </tr>
                  <tr>
                    <td className="font-bold pr-2 pb-1 text-gray-650">STATUS HUKUM:</td>
                    <td className="pb-1 font-bold text-black uppercase">{reportStatus}</td>
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
              {description || 'Belum ada uraian kronologis narasi kejadian yang diinputkan.'}
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
                {selectedCharges.length > 0 ? (
                  selectedCharges.map((chg, idx) => (
                    <tr key={idx} className="border-b border-black text-black">
                      <td className="border border-black p-2 text-center text-black font-mono">{idx + 1}</td>
                      <td className="border border-black p-2 text-left text-black">
                        <div className="font-bold text-black font-mono">{chg.title} ({chg.code})</div>
                        <div className="text-[8.5px] text-gray-700 italic font-sans">{chg.description}</div>
                      </td>
                      <td className="border border-black p-2 text-center font-bold text-black font-mono">${chg.fine.toLocaleString()}</td>
                      <td className="border border-black p-2 text-center text-black font-mono">{chg.jailTime} Bulan/Menit</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="border border-black p-4 text-center italic text-gray-600">
                      Tidak ada pasal atau tuntutan pidana yang dikenakan pada berkas ini.
                    </td>
                  </tr>
                )}
                {/* Total Row */}
                <tr className="bg-gray-100 font-bold border-t-2 border-black font-mono">
                  <td colSpan={2} className="border border-black p-2 text-right uppercase font-bold text-[10.5px] text-black">Akumulasi Sanksi Hukum:</td>
                  <td className="border border-black p-2 text-center font-bold text-[10.5px] text-black">${totalFine.toLocaleString()}</td>
                  <td className="border border-black p-2 text-center font-bold text-[10.5px] text-black">{totalJailTime} Bulan/Menit</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Bukti Fisik / Mugshot Gambar */}
          {(evidenceImages.length > 0 || imageUrl) && (
            <div className="mb-5 avoid-break">
              <h3 className="font-bold text-[10px] border-b border-black pb-1 mb-2 uppercase tracking-wide text-black font-mono">
                LAMPIRAN BUKTI FISIK & FOTO DOKUMENTASI:
              </h3>
              <div className="border border-black p-3 bg-gray-50 flex flex-wrap items-center justify-center gap-4 rounded">
                {evidenceImages.length > 0 ? (
                  evidenceImages.map(img => (
                    <div key={img.id} className="text-center">
                      <img src={img.url} alt={img.caption} className="max-h-[140px] max-w-[200px] object-contain border border-black" referrerPolicy="no-referrer" />
                      <span className="text-[8px] text-gray-700 font-mono block mt-1 font-bold">{img.caption} ({img.type})</span>
                    </div>
                  ))
                ) : (
                  imageUrl && (
                    <div className="text-center">
                      <img src={imageUrl} alt="Bukti" className="max-h-[160px] object-contain border border-black" referrerPolicy="no-referrer" />
                      <span className="text-[8px] text-gray-700 font-mono block mt-1 font-bold">DOKUMEN FOTO UTAMA</span>
                    </div>
                  )
                )}
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
                <p className="font-black uppercase text-[11px] text-black font-mono">{currentOfficer?.name || 'PETUGAS KEPOLISIAN'}</p>
                <p className="text-[9px] text-gray-800 font-mono font-bold">PANGKAT: {currentOfficer?.rank || OfficerRank.OFFICER}</p>
                <p className="text-[8.5px] text-gray-650 font-mono">LENCANA: LSPD-{currentOfficer?.badgeNumber || '0000'} • TGL: {new Date().toLocaleDateString('id-ID', { dateStyle: 'long' })}</p>
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
      {showPrintModal && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm p-2 sm:p-4 animate-fade-in print:hidden">
          {/* Action Bar Modal */}
          <div className="bg-slate-900 border-x border-t border-slate-800 rounded-t-lg p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3 w-full max-w-3xl shadow-2xl">
            <div className="flex items-center space-x-2">
              <Printer className="w-5 h-5 text-sky-400 animate-pulse" />
              <div>
                <span className="text-xs font-bold font-mono uppercase tracking-wider text-slate-100 block">Pratinjau Dokumen LSPD Resmi</span>
                <span className="text-[10px] text-slate-400 font-mono">Kasus #{activeReportId} • {currentOfficer?.name}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={async () => {
                  const text = `=== LOS SANTOS POLICE DEPARTMENT ===\nSISTEM INTEGRASI REKOR KEPOLISIAN - MOBILE DATA TERMINAL\n\nBERITA ACARA PEMERIKSAAN KASUS & LAPORAN INSIDEN\nID Dokumen: ${activeReportId}\nJudul Kasus: ${title || 'Tanpa Judul'}\nTanggal: ${new Date().toLocaleString('id-ID')}\nTipe Berkas: ${reportType === 'Citizen' ? 'Laporan Warga / Saksi' : 'Internal LSPD (10-15)'}\nLokasi: ${incidentLocation}\nStatus: ${reportStatus}\n\nMETADATA PIHAK TERKAIT\nTersangka: ${isUnknownSuspect || selectedSuspects.length === 0 ? 'LIDIK' : selectedSuspects.map(s => `${s.firstName} ${s.lastName}`).join(', ')}\nPenyidik: ${currentOfficer?.rank} ${currentOfficer?.name} (LSPD-${currentOfficer?.badgeNumber})\nPetugas Pendamping: ${selectedOfficersList.join(', ') || '-'}\nPelapor: ${reporterName || (reportType === 'Citizen' ? 'Warga' : 'LSPD')}\n\nKRONOLOGIS / DESKRIPSI KEJADIAN\n${description || 'Tidak ada uraian narasi tertulis.'}\n\nDAFTAR TUNTUTAN & SANKSI KUHP\n${selectedCharges.length > 0 ? selectedCharges.map((chg, idx) => `${idx + 1}. ${chg.title} (${chg.code}) - Denda: $${chg.fine} - Kurungan: ${chg.jailTime} Menit`).join('\n') : 'Tidak ada pasal terlampir'}\n\nTOTAL DENDA: $${totalFine.toLocaleString()}\nTOTAL KURUNGAN: ${totalJailTime} Bulan/Menit\n\nPETUGAS PELAPOR: ${currentOfficer?.rank} ${currentOfficer?.name} (LSPD-${currentOfficer?.badgeNumber})\n===================================`;
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
                {copiedSuccess ? '✅ DISALIN!' : '📋 SALIN TEKS (DISCORD)'}
              </button>
              
              <button
                onClick={() => {
                  try {
                    window.print();
                  } catch (e) {
                    console.error("Print blocked", e);
                  }
                }}
                className="bg-emerald-600 hover:bg-emerald-550 text-white font-bold font-mono text-xs px-3.5 py-2 rounded cursor-pointer flex items-center gap-1.5 transition-colors uppercase shadow"
              >
                <Printer className="w-3.5 h-3.5" />
                Cetak Fisik
              </button>
              
              <button
                onClick={() => setShowPrintModal(false)}
                className="bg-slate-850 hover:bg-slate-800 border border-slate-700 text-slate-300 font-bold font-mono text-xs px-3 py-2 rounded cursor-pointer flex items-center transition-colors"
                title="Tutup Pratinjau"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Guide Note */}
          <div className="bg-slate-900 border-x border-slate-850 p-2 text-[10px] text-amber-400 font-mono text-center w-full max-w-3xl">
            💡 <span className="font-bold text-amber-450">PEMBERITAHUAN CETAK:</span> Format berkas telah disesuaikan dengan standar A4 Resmi Kepolisian LSPD. Jika dialog print browser tidak muncul di frame, silakan buka aplikasi di tab baru.
          </div>

          {/* Simulated A4 Sheet On Screen */}
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
                  <div className="text-[7.5px] text-gray-500 mt-0.5">REGISTER: {activeReportId} • STATUS: RESMI</div>
                </div>
              </div>
            </div>

            {/* Judul Berkas */}
            <div className="text-center mb-5 border-b border-black pb-3">
              <h2 className="text-xs font-black underline uppercase tracking-widest text-black font-mono">
                BERITA ACARA PEMERIKSAAN KASUS & LAPORAN INSIDEN
              </h2>
              <div className="flex flex-wrap items-center justify-center gap-3 text-[9.5px] text-gray-700 font-mono mt-1 font-semibold">
                <span>NO. BERKAS: <strong className="text-black">{activeReportId}</strong></span>
                <span>•</span>
                <span>KLASIFIKASI: <strong className="text-black uppercase">{reportType === 'Citizen' ? 'LAPORAN WARGA / SAKSI' : 'LAPORAN INTERNAL 10-15'}</strong></span>
                <span>•</span>
                <span>STATUS: <strong className="text-black uppercase">{reportStatus}</strong></span>
              </div>
            </div>

            {/* Metadata & Pihak Terkait */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border border-black p-4 mb-5 bg-gray-50 rounded">
              <div>
                <p className="font-bold text-black text-[10px] uppercase border-b border-gray-400 pb-1 mb-2">METADATA KASUS:</p>
                <table className="w-full text-left text-[10px] leading-normal">
                  <tbody>
                    <tr>
                      <td className="font-bold pr-2 pb-1 text-gray-650 w-28">ID BERKAS:</td>
                      <td className="pb-1 font-mono font-bold text-black">{activeReportId}</td>
                    </tr>
                    <tr>
                      <td className="font-bold pr-2 pb-1 text-gray-650">JUDUL INSIDEN:</td>
                      <td className="pb-1 font-sans font-bold text-black">{title || 'Insiden Tanpa Judul'}</td>
                    </tr>
                    <tr>
                      <td className="font-bold pr-2 pb-1 text-gray-650">LOKASI KEJADIAN:</td>
                      <td className="pb-1 font-mono text-black">{incidentLocation || 'Tidak Tercatat'}</td>
                    </tr>
                    <tr>
                      <td className="font-bold pr-2 pb-1 text-gray-650">WAKTU INPUT:</td>
                      <td className="pb-1 font-mono text-black">{new Date(editingReportId ? (reports.find(r => r.id === editingReportId)?.date || new Date().toISOString()) : new Date().toISOString()).toLocaleString('id-ID')}</td>
                    </tr>
                    <tr>
                      <td className="font-bold pr-2 pb-1 text-gray-650">TIPE BERKAS:</td>
                      <td className="pb-1 font-bold text-black uppercase">{reportType === 'Citizen' ? 'Laporan Warga' : 'Laporan Petugas LSPD (10-15)'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="border-t sm:border-t-0 sm:border-l border-gray-300 pt-3 sm:pt-0 sm:pl-4">
                <p className="font-bold text-black text-[10px] uppercase border-b border-gray-400 pb-1 mb-2">DATA PIHAK TERKAIT:</p>
                <table className="w-full text-left text-[10px] leading-normal">
                  <tbody>
                    <tr>
                      <td className="font-bold pr-2 pb-1 text-gray-650 w-28">TERSANGKA:</td>
                      <td className="pb-1 font-sans font-bold text-black">
                        {isUnknownSuspect || selectedSuspects.length === 0
                          ? 'Tidak Diketahui / Dalam Penyelidikan'
                          : selectedSuspects.map(s => `${s.firstName} ${s.lastName} (${s.id})`).join(', ')}
                      </td>
                    </tr>
                    <tr>
                      <td className="font-bold pr-2 pb-1 text-gray-650">PENYIDIK (LSPD):</td>
                      <td className="pb-1 font-sans font-bold text-black">{currentOfficer?.rank} {currentOfficer?.name} (LSPD-{currentOfficer?.badgeNumber})</td>
                    </tr>
                    <tr>
                      <td className="font-bold pr-2 pb-1 text-gray-650">UNIT BACKUP:</td>
                      <td className="pb-1 text-black font-mono text-[9px]">{selectedOfficersList.length > 0 ? selectedOfficersList.join(', ') : '-'}</td>
                    </tr>
                    <tr>
                      <td className="font-bold pr-2 pb-1 text-gray-650">PELAPOR / KORBAN:</td>
                      <td className="pb-1 text-black font-sans">{reporterName || (reportType === 'Citizen' ? 'Warga Tanpa Nama' : 'Aparatur Petugas LSPD')}</td>
                    </tr>
                    <tr>
                      <td className="font-bold pr-2 pb-1 text-gray-650">STATUS HUKUM:</td>
                      <td className="pb-1 font-bold text-black uppercase">{reportStatus}</td>
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
                {description || 'Belum ada uraian kronologis narasi kejadian yang diinputkan.'}
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
                  {selectedCharges.length > 0 ? (
                    selectedCharges.map((chg, idx) => (
                      <tr key={idx} className="border-b border-black text-black">
                        <td className="border border-black p-2 text-center text-black font-mono">{idx + 1}</td>
                        <td className="border border-black p-2 text-left text-black">
                          <div className="font-bold text-black font-mono">{chg.title} ({chg.code})</div>
                          <div className="text-[8.5px] text-gray-700 italic font-sans">{chg.description}</div>
                        </td>
                        <td className="border border-black p-2 text-center font-bold text-black font-mono">${chg.fine.toLocaleString()}</td>
                        <td className="border border-black p-2 text-center text-black font-mono">{chg.jailTime} Bulan/Menit</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="border border-black p-4 text-center italic text-gray-600">
                        Tidak ada pasal atau tuntutan pidana yang dikenakan pada berkas ini.
                      </td>
                    </tr>
                  )}
                  {/* Total Row */}
                  <tr className="bg-gray-100 font-bold border-t-2 border-black font-mono">
                    <td colSpan={2} className="border border-black p-2 text-right uppercase font-bold text-[10.5px] text-black">Akumulasi Sanksi Hukum:</td>
                    <td className="border border-black p-2 text-center font-bold text-[10.5px] text-black">${totalFine.toLocaleString()}</td>
                    <td className="border border-black p-2 text-center font-bold text-[10.5px] text-black">{totalJailTime} Bulan/Menit</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Bukti Fisik / Mugshot Gambar */}
            {(evidenceImages.length > 0 || imageUrl) && (
              <div className="mb-5 avoid-break">
                <h3 className="font-bold text-[10px] border-b border-black pb-1 mb-2 uppercase tracking-wide text-black font-mono">
                  LAMPIRAN BUKTI FISIK & FOTO DOKUMENTASI:
                </h3>
                <div className="border border-black p-3 bg-gray-50 flex flex-wrap items-center justify-center gap-4 rounded">
                  {evidenceImages.length > 0 ? (
                    evidenceImages.map(img => (
                      <div key={img.id} className="text-center">
                        <img src={img.url} alt={img.caption} className="max-h-[140px] max-w-[200px] object-contain border border-black" referrerPolicy="no-referrer" />
                        <span className="text-[8px] text-gray-700 font-mono block mt-1 font-bold">{img.caption} ({img.type})</span>
                      </div>
                    ))
                  ) : (
                    imageUrl && (
                      <div className="text-center">
                        <img src={imageUrl} alt="Bukti" className="max-h-[160px] object-contain border border-black" referrerPolicy="no-referrer" />
                        <span className="text-[8px] text-gray-700 font-mono block mt-1 font-bold">DOKUMEN FOTO UTAMA</span>
                      </div>
                    )
                  )}
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
                  <p className="font-black uppercase text-[11px] text-black font-mono">{currentOfficer?.name || 'PETUGAS KEPOLISIAN'}</p>
                  <p className="text-[9px] text-gray-800 font-mono font-bold">PANGKAT: {currentOfficer?.rank || OfficerRank.OFFICER}</p>
                  <p className="text-[8.5px] text-gray-650 font-mono">LENCANA: LSPD-{currentOfficer?.badgeNumber || '0000'} • TGL: {new Date().toLocaleDateString('id-ID', { dateStyle: 'long' })}</p>
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

      {/* Manual fallback copy dialog */}
      {manualCopyText && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 print:hidden">
          <div className="bg-slate-900 border border-slate-700 rounded-lg p-5 max-w-xl w-full shadow-2xl space-y-4 text-left font-mono">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-400" />
                Salin Berkas Dokumen Manual
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
              Izin clipboard otomatis dibatasi oleh frame peramban. Silakan klik teks di bawah lalu tekan <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-sky-400 text-[11px]">Ctrl + C</kbd> atau <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-sky-400 text-[11px]">Cmd + C</kbd>:
            </p>
            <textarea
              readOnly
              value={manualCopyText}
              onFocus={(e) => e.currentTarget.select()}
              autoFocus
              className="w-full h-44 bg-slate-950 border border-slate-800 rounded p-3 text-xs text-slate-200 resize-none focus:outline-none focus:border-sky-500 select-all"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setManualCopyText(null)}
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
