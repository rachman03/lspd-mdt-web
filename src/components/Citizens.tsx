import React, { useState, useEffect } from 'react';
import { useMdt } from '../context/MdtContext';
import { Citizen, LicenseStatus, OfficerRank } from '../types';
import { Search, UserPlus, AlertOctagon, CheckCircle2, XCircle, FileText, BadgeAlert, Plus, Car, Phone, Calendar, User, Save, Edit, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CitizensProps {
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
  setEditingReportId: (id: string | null) => void;
  setActiveTab: (tab: string) => void;
}

export const Citizens: React.FC<CitizensProps> = ({ selectedId, setSelectedId, setEditingReportId, setActiveTab }) => {
  const { citizens, vehicles, reports, addCitizen, updateCitizen, deleteCitizen, currentOfficer } = useMdt();
  const isCadet = currentOfficer?.rank === OfficerRank.CADET;

  const [searchQuery, setSearchQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  // New Citizen Form State
  const [newFirstName, setNewFirstName] = useState('');
  const [newLastName, setNewLastName] = useState('');
  const [newDob, setNewDob] = useState('');
  const [newGender, setNewGender] = useState<'Laki-laki' | 'Perempuan'>('Laki-laki');
  const [newPhone, setNewPhone] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [newAvatar, setNewAvatar] = useState('');

  // Active Citizen Editing State
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [editedNotes, setEditedNotes] = useState('');

  // Active Citizen Biodata Editing State
  const [isEditingBiodata, setIsEditingBiodata] = useState(false);
  const [editedFirstName, setEditedFirstName] = useState('');
  const [editedLastName, setEditedLastName] = useState('');
  const [editedDob, setEditedDob] = useState('');
  const [editedGender, setEditedGender] = useState<'Laki-laki' | 'Perempuan'>('Laki-laki');
  const [editedPhone, setEditedPhone] = useState('');
  const [editedAvatar, setEditedAvatar] = useState('');

  // Wanted toggle state
  const [isWantedInput, setIsWantedInput] = useState(false);
  const [wantedReason, setWantedReason] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Auto-select citizen if selectedId prop changes
  const activeCitizen = citizens.find((c) => c.id === selectedId) || null;

  useEffect(() => {
    if (activeCitizen) {
      setEditedNotes(activeCitizen.notes);
      setIsEditingNotes(false);
      setIsWantedInput(false);
      setShowDeleteConfirm(false);
      setWantedReason(activeCitizen.wantedReason || '');

      setEditedFirstName(activeCitizen.firstName);
      setEditedLastName(activeCitizen.lastName);
      setEditedDob(activeCitizen.dob);
      setEditedGender(activeCitizen.gender);
      setEditedPhone(activeCitizen.phone);
      setEditedAvatar(activeCitizen.avatar);
      setIsEditingBiodata(false);
    }
  }, [selectedId, activeCitizen]);

  // Search filter
  const filteredCitizens = citizens.filter((c) => {
    const fullName = `${c.firstName} ${c.lastName || ''}`.trim().toLowerCase();
    const query = searchQuery.toLowerCase();
    return fullName.includes(query) || c.id.toLowerCase().includes(query);
  });

  const handleRegisterCitizen = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFirstName.trim() || !newDob.trim()) return;

    const newId = `CTZ-${Math.floor(1000 + Math.random() * 9000)}`;
    addCitizen({
      id: newId,
      firstName: newFirstName.trim(),
      lastName: newLastName.trim(),
      dob: newDob,
      gender: newGender,
      phone: newPhone || 'Unknown',
      notes: newNotes || 'Tidak ada catatan.',
      avatar: newAvatar.trim() || undefined,
      isWanted: false,
      licenseStatus: {
        drivers: 'Active',
        weapons: 'None',
        ktp: 'None',
      },
    });

    // Reset Form
    setNewFirstName('');
    setNewLastName('');
    setNewDob('');
    setNewPhone('');
    setNewNotes('');
    setNewAvatar('');
    setShowAddForm(false);
    setSelectedId(newId);
  };

  const handleUpdateNotes = () => {
    if (!activeCitizen) return;
    updateCitizen(activeCitizen.id, { notes: editedNotes });
    setIsEditingNotes(false);
  };

  const handleUpdateBiodata = () => {
    if (!activeCitizen) return;
    if (!editedFirstName.trim() || !editedDob.trim()) return;

    updateCitizen(activeCitizen.id, {
      firstName: editedFirstName.trim(),
      lastName: editedLastName.trim(),
      dob: editedDob,
      gender: editedGender,
      phone: editedPhone,
      avatar: editedAvatar.trim(),
    });
    setIsEditingBiodata(false);
  };

  const handleToggleWanted = () => {
    if (!activeCitizen) return;
    if (activeCitizen.isWanted) {
      // Clear wanted status
      updateCitizen(activeCitizen.id, { isWanted: false, wantedReason: undefined });
      setIsWantedInput(false);
    } else {
      // Toggle inputs
      setIsWantedInput(true);
    }
  };

  const handleApplyWanted = () => {
    if (!activeCitizen || !wantedReason.trim()) return;
    updateCitizen(activeCitizen.id, { isWanted: true, wantedReason });
    setIsWantedInput(false);
  };

  const handleDeleteCitizen = () => {
    if (!activeCitizen) return;
    deleteCitizen(activeCitizen.id);
    setSelectedId(null);
    setShowDeleteConfirm(false);
  };

  const handleUpdateLicense = (licenseType: keyof LicenseStatus, status: any) => {
    if (!activeCitizen) return;
    const currentLicenses = { ...activeCitizen.licenseStatus };
    currentLicenses[licenseType] = status;
    updateCitizen(activeCitizen.id, { licenseStatus: currentLicenses });
  };

  // Find vehicles owned by this citizen
  const ownedVehicles = activeCitizen ? vehicles.filter((v) => v.ownerId === activeCitizen.id) : [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="citizens-panel">
      
      {/* LEFT COLUMN: CITIZEN DIRECTORY / SEARCH */}
      <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-lg overflow-hidden shadow-lg flex flex-col h-[750px]">
        {/* Header bar */}
        <div className="bg-slate-850 px-4 py-3 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex flex-col text-left">
            <h2 className="text-xs font-bold font-mono text-slate-200 uppercase tracking-widest">Database Warga</h2>
            <span className="text-[9px] font-mono font-bold text-sky-400 uppercase mt-0.5">
              {citizens.length} WARGA TERDAFTAR
            </span>
          </div>
          {!isCadet && (
            <button
              id="register-citizen-btn"
              onClick={() => setShowAddForm(true)}
              className="p-1 px-[10px] bg-sky-500 hover:bg-sky-400 text-slate-950 rounded text-xs font-bold font-mono flex items-center gap-1 cursor-pointer transition-colors"
            >
              <UserPlus className="w-3.5 h-3.5" />
              BARU
            </button>
          )}
        </div>

        {/* Search bar */}
        <div className="p-3 bg-slate-950 border-b border-slate-900 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
            <input
              id="citizen-search-input"
              type="text"
              placeholder="Cari warga dengan Nama / NIK ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 focus:border-sky-500 rounded pl-9 pr-3 py-2 text-xs text-slate-200 outline-none font-mono"
            />
          </div>
        </div>

        {/* Directory Listings */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-805/60 p-2 space-y-1">
          {filteredCitizens.length === 0 ? (
            <div className="text-center py-12 text-slate-500 font-mono text-xs">
              Hasil pencarian tidak ada.
            </div>
          ) : (
            filteredCitizens.map((c) => {
              const isSelected = selectedId === c.id;
              return (
                <div
                  key={c.id}
                  onClick={() => setSelectedId(c.id)}
                  className={`p-3 rounded flex items-center justify-between cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-sky-950/40 border border-sky-850'
                      : c.isWanted
                      ? 'bg-red-950/15 border border-red-900/40 hover:bg-red-950/20'
                      : 'border border-transparent hover:bg-slate-850/60'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <img
                      src={c.avatar && c.avatar.trim() !== "" ? c.avatar : "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100"}
                      alt={c.firstName}
                      className="w-9 h-9 rounded object-cover border border-slate-700 shrink-0"
                      referrerPolicy="no-referrer"
                    />
                    <div className="font-mono text-left">
                      <h4 className={`text-xs font-bold ${c.isWanted ? 'text-red-400' : 'text-slate-250'}`}>
                        {c.firstName} {c.lastName || ''}
                      </h4>
                      <p className="text-[10px] text-slate-500 mt-0.5">ID: {c.id}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {c.isWanted && (
                      <span className="text-[9px] bg-red-950/80 border border-red-800 text-red-400 font-bold font-mono px-2 py-0.5 rounded animate-pulse">
                        WANTED
                      </span>
                    )}
                    <span className="text-[10.5px] font-mono text-slate-400 text-xs shrink-0">
                      {c.dob.slice(-4)}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: DETAILED VIEW */}
      <div className="lg:col-span-7 space-y-4">
        {activeCitizen ? (
          <div className={`bg-slate-900 border rounded-lg shadow-lg overflow-hidden transition-all duration-300 ${activeCitizen.isWanted ? 'border-red-900 shadow-red-950/10' : 'border-slate-800'}`}>
            
            {/* Citizen Cover Frame & Basic details */}
            <div className={`p-6 bg-gradient-to-b ${activeCitizen.isWanted ? 'from-red-950/40 to-slate-900' : 'from-slate-850 to-slate-900'} border-b border-slate-800 relative text-left`}>
              
              {/* Wanted indicator alert */}
              {activeCitizen.isWanted && !isEditingBiodata && (
                <div className="absolute top-4 right-4 bg-red-950 text-red-500 border border-red-800 px-3 py-1 rounded text-xs font-bold font-mono flex items-center space-x-1.5 animate-pulse">
                  <AlertOctagon className="w-4 h-4" />
                  <span>DPO KEJAHATAN - TANGKAP SEGERA</span>
                </div>
              )}

              {/* Edit Biodata Button (Upper right when not in edit mode) */}
              {!isEditingBiodata && !isCadet && (
                <button
                  onClick={() => setIsEditingBiodata(true)}
                  className="absolute top-4 right-4 sm:right-6 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-sky-405 hover:text-sky-305 px-3.5 py-1.5 rounded text-xs font-bold font-mono flex items-center space-x-1 cursor-pointer transition-colors"
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span>EDIT BIODATA</span>
                </button>
              )}

              {isEditingBiodata ? (
                <div className="space-y-4 font-mono text-xs">
                  <div className="border-b border-slate-800/80 pb-2 flex items-center justify-between">
                    <h3 className="text-xs font-bold text-sky-400 uppercase tracking-widest">EDIT BIODATA WARGA [{activeCitizen.id}]</h3>
                    <span className="text-[10px] text-slate-500">MDT EDIT PROFILE</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
                    <div>
                      <label className="block text-[10px] text-slate-450 uppercase mb-1">Nama Depan</label>
                      <input
                        type="text"
                        value={editedFirstName}
                        onChange={(e) => setEditedFirstName(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 p-2 text-xs text-slate-100 rounded outline-none focus:border-sky-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-450 uppercase mb-1">Nama Belakang (Opsional)</label>
                      <input
                        type="text"
                        value={editedLastName}
                        onChange={(e) => setEditedLastName(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 p-2 text-xs text-slate-100 rounded outline-none focus:border-sky-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
                    <div>
                      <label className="block text-[10px] text-slate-450 uppercase mb-1">Tanggal Lahir</label>
                      <input
                        type="text"
                        value={editedDob}
                        onChange={(e) => setEditedDob(e.target.value)}
                        placeholder="cth. 1993-02-12"
                        className="w-full bg-slate-950 border border-slate-800 p-2 text-xs text-slate-100 rounded outline-none focus:border-sky-505"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-450 uppercase mb-1">Gender</label>
                      <select
                        value={editedGender}
                        onChange={(e) => setEditedGender(e.target.value as any)}
                        className="w-full bg-slate-950 border border-slate-800 p-2 text-xs text-slate-100 rounded outline-none focus:border-sky-505 cursor-pointer"
                      >
                        <option value="Laki-laki">Laki-laki</option>
                        <option value="Perempuan">Perempuan</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
                    <div>
                      <label className="block text-[10px] text-slate-450 uppercase mb-1">Nomor Telepon</label>
                      <input
                        type="text"
                        value={editedPhone}
                        onChange={(e) => setEditedPhone(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 p-2 text-xs text-slate-100 rounded outline-none focus:border-sky-505"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-450 uppercase mb-1">Tautan URL Pas Foto / Avatar</label>
                      <input
                        type="text"
                        value={editedAvatar}
                        onChange={(e) => setEditedAvatar(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 p-2 text-xs text-slate-100 rounded outline-none focus:border-sky-505"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2 pt-2 border-t border-slate-800/60">
                    <button
                      type="button"
                      onClick={() => setIsEditingBiodata(false)}
                      className="px-3.5 py-1.5 border border-slate-800 text-slate-450 hover:text-slate-200 rounded cursor-pointer transition-colors"
                    >
                      BATAL
                    </button>
                    <button
                      type="button"
                      onClick={handleUpdateBiodata}
                      className="px-5 py-1.5 bg-sky-500 hover:bg-sky-455 text-slate-950 font-bold rounded cursor-pointer flex items-center gap-1.5 transition-colors"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>SIMPAN BIODATA</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 text-left">
                  <img
                    src={activeCitizen.avatar && activeCitizen.avatar.trim() !== "" ? activeCitizen.avatar : "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200"}
                    alt={`${activeCitizen.firstName} ${activeCitizen.lastName || ''}`}
                    className="w-24 h-24 rounded-lg object-cover border-2 border-slate-705 shadow-md flex-shrink-0"
                    referrerPolicy="no-referrer"
                  />

                  <div className="text-center sm:text-left space-y-2 flex-1 font-mono">
                    <div>
                      <h2 className="text-xl font-bold font-sans text-slate-100 leading-tight">
                        {activeCitizen.firstName} {activeCitizen.lastName || ''}
                      </h2>
                      <p className="text-xs text-sky-400 mt-1">NOMOR IDENTITAS KRIMINAL (NIK): {activeCitizen.id}</p>
                      
                      {/* Legal & Criminal Status Tag */}
                      <div className="mt-2.5 flex flex-wrap gap-1.5 justify-center sm:justify-start">
                        {activeCitizen.isWanted ? (
                          <span className="text-[10px] font-bold font-mono bg-red-950/80 border border-red-800 text-red-400 px-2.5 py-1 rounded flex items-center gap-1.5 animate-pulse">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                            STATUS: DPO / WANTED
                          </span>
                        ) : activeCitizen.convictions.length > 0 ? (
                          <span className="text-[10px] font-bold font-mono bg-amber-950/80 border border-amber-800 text-amber-400 px-2.5 py-1 rounded flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                            STATUS: REKOR KRIMINAL
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold font-mono bg-emerald-950/80 border border-emerald-850 text-emerald-400 px-2.5 py-1 rounded flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                            STATUS: BERSIH / TIDAK ADA REKOR
                          </span>
                        )}
                        
                        <span className="text-[10px] font-bold font-mono bg-slate-950 border border-slate-800 text-slate-400 px-2.5 py-1 rounded">
                          TOTAL PENINDAKAN: {activeCitizen.convictions.length}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs text-slate-400 max-w-sm pt-1 mx-auto sm:mx-0">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        <span>Lahir: <span className="text-slate-200">{activeCitizen.dob}</span></span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-500" />
                        <span>Gender: <span className="text-slate-200">{activeCitizen.gender}</span></span>
                      </div>
                      <div className="flex items-center gap-1.5 col-span-2">
                        <Phone className="w-3.5 h-3.5 text-slate-500" />
                        <span>Telp: <span className="text-slate-200">{activeCitizen.phone}</span></span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Sub content grids */}
            <div className="p-6 space-y-6">
              
              {/* Wanted Warrant Statement (if active) */}
              {activeCitizen.isWanted && activeCitizen.wantedReason && (
                <div className="bg-red-950/20 border-2 border-red-900 border-dashed rounded p-3 text-xs font-mono">
                  <span className="text-red-405 font-bold uppercase block mb-1">DOKUMEN APB / ALASAN PENANGKAPAN:</span>
                  <p className="text-red-200 font-sans leading-relaxed">{activeCitizen.wantedReason}</p>
                </div>
              )}

              {/* License Panel */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold font-mono text-slate-450 uppercase tracking-widest font-bold">MANAJEMEN SURAT IZIN (LICENSES)</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Driver License */}
                  <div className="bg-slate-950 border border-slate-805 p-3 rounded font-mono">
                    <p className="text-[10px] text-slate-500">IZIN MENGEMUDI (SIM)</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                        activeCitizen.licenseStatus.drivers === 'Active' ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-900' :
                        activeCitizen.licenseStatus.drivers === 'Suspended' ? 'bg-red-950/60 text-red-400 border border-red-900' :
                        'bg-slate-900 text-slate-500'
                      }`}>
                        {activeCitizen.licenseStatus.drivers}
                      </span>
                      <select
                        value={activeCitizen.licenseStatus.drivers}
                        onChange={(e) => handleUpdateLicense('drivers', e.target.value)}
                        className={`bg-slate-900 border border-slate-805 text-[10px] p-0.5 rounded outline-none ${isCadet ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                        disabled={isCadet}
                      >
                        <option value="Active">Aktif</option>
                        <option value="Suspended">Ditangguhkan</option>
                        <option value="None">Tidak Ada</option>
                      </select>
                    </div>
                  </div>

                  {/* Weapon License */}
                  <div className="bg-slate-950 border border-slate-805 p-3 rounded font-mono">
                    <p className="text-[10px] text-slate-500">IZIN SENJATA API (SABSA)</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                        activeCitizen.licenseStatus.weapons === 'Active' ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-900' :
                        activeCitizen.licenseStatus.weapons === 'Suspended' ? 'bg-red-950/60 text-red-400 border border-red-900' :
                        'bg-slate-900 text-slate-500'
                      }`}>
                        {activeCitizen.licenseStatus.weapons}
                      </span>
                      <select
                        value={activeCitizen.licenseStatus.weapons}
                        onChange={(e) => handleUpdateLicense('weapons', e.target.value)}
                        className={`bg-slate-900 border border-slate-805 text-[10px] p-0.5 rounded outline-none ${isCadet ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                        disabled={isCadet}
                      >
                        <option value="Active">Aktif</option>
                        <option value="Suspended">Dicabut</option>
                        <option value="None">Tidak Ada</option>
                      </select>
                    </div>
                  </div>

                  {/* KTP License status */}
                  <div className="bg-slate-950 border border-slate-805 p-3 rounded font-mono">
                    <p className="text-[10px] text-slate-500">KARTU TANDA PENDUDUK (KTP)</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                        activeCitizen.licenseStatus.ktp === 'Active' ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-900' :
                        activeCitizen.licenseStatus.ktp === 'Suspended' ? 'bg-red-950/60 text-red-400 border border-red-900' :
                        'bg-slate-900 text-slate-500'
                      }`}>
                        {activeCitizen.licenseStatus.ktp === 'Active' ? 'Aktif' : activeCitizen.licenseStatus.ktp === 'Suspended' ? 'Ditangguhkan' : 'Tidak Ada'}
                      </span>
                      <select
                        value={activeCitizen.licenseStatus.ktp}
                        onChange={(e) => handleUpdateLicense('ktp', e.target.value)}
                        className={`bg-slate-900 border border-slate-805 text-[10px] p-0.5 rounded outline-none ${isCadet ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                        disabled={isCadet}
                      >
                        <option value="Active">Aktif</option>
                        <option value="Suspended">Ditangguhkan</option>
                        <option value="None">Tidak Ada</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Registered Vehicles Panel */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold font-mono text-slate-450 uppercase tracking-widest font-bold">KENDARAAN TERDAFTAR</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {ownedVehicles.length === 0 ? (
                    <div className="sm:col-span-2 text-slate-600 bg-slate-950 border border-slate-805/60 p-4 rounded text-center text-xs font-mono">
                      Tidak mempunyai kendaran yang teregistrasi secara sah di database LSPD.
                    </div>
                  ) : (
                    ownedVehicles.map((v) => (
                      <div key={v.id} className="bg-slate-950 border border-slate-805 rounded p-3 flex justify-between items-center font-mono">
                        <div className="flex items-center space-x-2">
                          <Car className="w-4 h-4 text-slate-500" />
                          <div className="text-left">
                            <p className="text-xs font-bold text-slate-205">{v.model}</p>
                            <p className="text-[10px] text-slate-500">Warna: {v.color}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-xs bg-slate-850 px-2.5 py-1 rounded border border-slate-700 tracking-wide text-sky-400 font-bold">
                            {v.plate}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Police logs & Criminal history */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-xs font-bold font-mono text-slate-450 uppercase tracking-widest">RIWAYAT DAKWAAN & KEPIDANAAN</h3>
                  <div className="bg-slate-950 border border-slate-805 rounded p-4 font-mono mt-2">
                    {activeCitizen.convictions.length === 0 ? (
                      <div className="text-center py-4 text-emerald-400 text-xs flex items-center justify-center gap-1">
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        Warga Bersih / Tidak Ada Catatan Kejahatan Terarsip.
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {activeCitizen.convictions.map((conv, idx) => (
                          <span
                            key={idx}
                            className="bg-red-950/40 text-rose-300 border border-red-900/60 px-2.5 py-1 rounded text-xs flex items-center space-x-1.5"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>{conv}</span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Related Incident Reports List */}
                <div className="space-y-2">
                  <h3 className="text-xs font-bold font-mono text-slate-450 uppercase tracking-widest">DOKUMEN KASUS & LAPORAN APARAT ({reports.filter(r => (r.suspects ? r.suspects.some(s => s.id === activeCitizen.id) : r.suspectId.includes(activeCitizen.id))).length})</h3>
                  <div className="space-y-2">
                    {reports.filter(r => (r.suspects ? r.suspects.some(s => s.id === activeCitizen.id) : r.suspectId.includes(activeCitizen.id))).length === 0 ? (
                      <div className="bg-slate-950/60 border border-slate-850 p-3 rounded text-center text-slate-500 font-mono text-xs italic">
                        Tidak ada berkas laporan terikat untuk warga ini.
                      </div>
                    ) : (
                      reports.filter(r => (r.suspects ? r.suspects.some(s => s.id === activeCitizen.id) : r.suspectId.includes(activeCitizen.id))).map((rep) => (
                        <div key={rep.id} className="bg-slate-950 border border-slate-805 rounded p-3 text-left flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                          <div className="space-y-1 font-mono flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] bg-sky-950 text-sky-400 font-bold border border-sky-900 px-1.5 py-0.2 rounded">{rep.id}</span>
                              <h4 className="text-xs font-bold text-slate-205">{rep.title}</h4>
                            </div>
                            <p className="text-[10px] text-slate-500">
                              Oleh: <span className="text-slate-300 font-bold">{rep.officerName} ({rep.officerBadge})</span> | {new Date(rep.date).toLocaleDateString('id-ID')}
                            </p>
                            <p className="text-[10px] text-slate-400 line-clamp-1">{rep.description}</p>
                            
                            {/* Compact inline thumbnail gallery */}
                            {((rep.evidenceImages && rep.evidenceImages.length > 0) || rep.imageUrl) && (
                              <div className="flex gap-1.5 mt-2 flex-wrap">
                                {rep.evidenceImages && rep.evidenceImages.length > 0 ? (
                                  rep.evidenceImages.map((img) => (
                                    <div key={img.id} className="relative cursor-pointer">
                                      <img
                                        src={img.url}
                                        alt={img.caption}
                                        className="w-10 h-10 object-cover rounded border border-slate-800 hover:border-sky-500/50 transition-colors"
                                        title={`${img.caption} [${img.type === 'mugshot' ? 'Mugshot' : img.type === 'evidence' ? 'Barang Bukti' : 'Lainnya'}]`}
                                        referrerPolicy="no-referrer"
                                        onError={(e) => {
                                          e.currentTarget.src = 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&q=80&w=100';
                                        }}
                                      />
                                      <span className={`absolute bottom-0 right-0 w-1.5 h-1.5 rounded-full ${
                                        img.type === 'mugshot' ? 'bg-amber-500' : img.type === 'evidence' ? 'bg-rose-500' : 'bg-slate-400'
                                      }`} />
                                    </div>
                                  ))
                                ) : (
                                  <img
                                    src={rep.imageUrl}
                                    alt="Foto Kasus"
                                    className="w-10 h-10 object-cover rounded border border-slate-800 hover:border-sky-500/50 transition-colors"
                                    title="Foto Kasus Utama"
                                    referrerPolicy="no-referrer"
                                    onError={(e) => {
                                      e.currentTarget.style.display = 'none';
                                    }}
                                  />
                                )}
                              </div>
                            )}
                          </div>
                          
                          <button
                            onClick={() => {
                              setEditingReportId(rep.id);
                              setActiveTab('reports');
                            }}
                            className="bg-amber-500 hover:bg-amber-450 text-slate-950 font-bold rounded px-2.5 py-1 text-[10px] cursor-pointer flex items-center justify-center gap-1 font-mono hover:scale-105 active:scale-95 transition-all self-start sm:self-center uppercase shrink-0"
                          >
                            <Edit className="w-3.5 h-3.5" />
                            <span>Edit Kasus</span>
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Citizen Notes (Dynamic Editable form) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold font-mono text-slate-450 uppercase tracking-widest font-bold">KETERANGAN & CATATAN INTEL POLISI</h3>
                  {!isCadet && (
                    !isEditingNotes ? (
                      <button
                        onClick={() => setIsEditingNotes(true)}
                        className="text-xs text-sky-400 hover:text-sky-300 flex items-center gap-1 cursor-pointer font-mono"
                      >
                        <Edit className="w-3.5 h-3.5" /> EDIT CATATAN
                      </button>
                    ) : (
                      <button
                        onClick={handleUpdateNotes}
                        className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer font-mono font-bold bg-slate-950 border border-slate-800 px-2 py-0.5 rounded"
                      >
                        <Save className="w-3.5 h-3.5" /> SIMPAN
                      </button>
                    )
                  )}
                </div>

                <div className="bg-slate-950 border border-slate-805 rounded p-4 font-sans text-xs">
                  {isEditingNotes ? (
                    <textarea
                      value={editedNotes}
                      onChange={(e) => setEditedNotes(e.target.value)}
                      className="w-full h-24 bg-slate-900 border border-slate-808 rounded p-2 text-slate-100 outline-none resize-none focus:border-sky-500 font-mono"
                    />
                  ) : (
                    <p className="text-slate-350 leading-relaxed text-left italic">
                      {activeCitizen.notes || 'Tidak ada catatan kepolisian yang tertulis.'}
                    </p>
                  )}
                </div>
              </div>

              {/* APB & Deletion Actions */}
              {!isCadet && (
                <div className="border-t border-slate-950 pt-4 space-y-3">
                  <div className="flex gap-2 flex-wrap">
                    {!showDeleteConfirm && (
                      <button
                        onClick={handleToggleWanted}
                        id="wanted-toggle-btn"
                        className={`px-3 py-2 rounded text-xs font-bold font-mono tracking-wide cursor-pointer text-slate-950 ${
                          activeCitizen.isWanted
                            ? 'bg-emerald-500 hover:bg-emerald-400'
                            : 'bg-red-500 hover:bg-red-400 shadow-md shadow-red-500/10 animate-pulse'
                        }`}
                      >
                        {activeCitizen.isWanted ? 'TANDAI BERSIH / CABUT APB' : 'SEBARKAN BURON (APB WILAYAH)'}
                      </button>
                    )}

                    {!isWantedInput && !showDeleteConfirm && (
                      <button
                        onClick={() => setShowDeleteConfirm(true)}
                        className="px-3 py-2 bg-rose-950/60 text-rose-400 hover:bg-rose-900 hover:text-rose-200 border border-rose-900/40 rounded text-xs font-bold font-mono flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>HAPUS WARGA</span>
                      </button>
                    )}
                  </div>

                  {isWantedInput && (
                    <div className="flex items-center gap-2 font-mono w-full" id="wanted-reason-input-group">
                      <input
                        type="text"
                        placeholder="Tulis alasan tersangka di-DPO-kan..."
                        value={wantedReason}
                        onChange={(e) => setWantedReason(e.target.value)}
                        className="flex-1 bg-slate-950 border border-slate-800 p-2 text-xs rounded text-slate-100 outline-none placeholder-slate-650"
                      />
                      <button
                        onClick={handleApplyWanted}
                        className="px-3 py-2 bg-slate-100 hover:bg-white text-slate-950 font-bold rounded text-xs cursor-pointer"
                      >
                        Terbitkan
                      </button>
                      <button
                        onClick={() => setIsWantedInput(false)}
                        className="px-2 py-2 text-slate-400 hover:text-white text-xs font-bold cursor-pointer"
                      >
                        Batal
                      </button>
                    </div>
                  )}

                  {showDeleteConfirm && (
                    <div className="bg-rose-950/20 border border-rose-900/30 rounded p-3 flex flex-col sm:flex-row items-center justify-between gap-2 font-mono text-xs w-full">
                      <span className="text-rose-400 font-bold">⚠️ HAPUS DATA WARGA INI SECARA PERMANEN?</span>
                      <div className="flex gap-2">
                        <button
                          onClick={handleDeleteCitizen}
                          className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded text-[11px] cursor-pointer"
                        >
                          YA, HAPUS PERMANEN
                        </button>
                        <button
                          onClick={() => setShowDeleteConfirm(false)}
                          className="px-3 py-1.5 bg-slate-950 border border-slate-800 text-slate-400 hover:text-white rounded text-[11px] cursor-pointer"
                        >
                          BATAL
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="h-[400px] bg-slate-900 border border-slate-808 rounded-lg flex flex-col items-center justify-center p-8 text-center text-slate-550 border-dashed">
            <User className="w-12 h-12 text-slate-800 mb-3" />
            <h3 className="text-sm font-bold font-mono uppercase tracking-wide text-slate-400">INFO INDIVIDUAL WARGA</h3>
            <p className="text-xs max-w-sm mt-1">
              Silakan pilih profil warga di kolom sebelah kiri, atau cari menggunakan kolom masukan NIK/Nama warga untuk meninjau status lisensi, kepemilikan mobil dinas, riwayat kriminal, beserta perihal APB.
            </p>
          </div>
        )}
      </div>

      {/* RENDER NEW CITIZEN REGISTRATION MODAL FORM */}
      <AnimatePresence>
        {showAddForm && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border-2 border-slate-800 rounded-lg max-w-md w-full p-6 text-left relative shadow-2xl"
              id="citizen-register-modal"
            >
              <h3 className="text-sm font-bold font-mono text-slate-200 uppercase tracking-widest mb-4 pb-2 border-b border-slate-800">
                DAFTARKAN WARGA SIPIL BARU (LSPD CIVIL REG)
              </h3>

              <form onSubmit={handleRegisterCitizen} className="space-y-3 font-mono">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-slate-450 uppercase">Nama Depan</label>
                    <input
                      type="text"
                      placeholder="cth. Michael"
                      value={newFirstName}
                      onChange={(e) => setNewFirstName(e.target.value)}
                      className="w-full mt-1 bg-slate-950 border border-slate-800 text-xs text-slate-100 p-2 rounded outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-450 uppercase">Nama Belakang (Opsional)</label>
                    <input
                      type="text"
                      placeholder="cth. Townley"
                      value={newLastName}
                      onChange={(e) => setNewLastName(e.target.value)}
                      className="w-full mt-1 bg-slate-950 border border-slate-800 text-xs text-slate-100 p-2 rounded outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-slate-450 uppercase">Tanggal Lahir</label>
                    <input
                      type="date"
                      value={newDob}
                      onChange={(e) => setNewDob(e.target.value)}
                      className="w-full mt-1 bg-slate-950 border border-slate-800 text-xs text-slate-100 p-2 rounded outline-none cursor-pointer"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-450 uppercase">Gender / Jenis Kelamin</label>
                    <select
                      value={newGender}
                      onChange={(e) => setNewGender(e.target.value as any)}
                      className="w-full mt-1 bg-slate-950 border border-slate-800 text-xs text-slate-100 p-2 rounded outline-none cursor-pointer"
                    >
                      <option value="Laki-laki">Laki-laki</option>
                      <option value="Perempuan">Perempuan</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] text-slate-450 uppercase">Nomor Telepon</label>
                  <input
                    type="text"
                    placeholder="cth. 555-0155"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="w-full mt-1 bg-slate-950 border border-slate-800 text-xs text-slate-100 p-2 rounded outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-450 uppercase">URL Tautan Pas foto / Avatar</label>
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/... (opsional)"
                    value={newAvatar}
                    onChange={(e) => setNewAvatar(e.target.value)}
                    className="w-full mt-1 bg-slate-950 border border-slate-800 text-xs text-slate-100 p-2 rounded outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-450 uppercase">Catatan Latar Belakang / Sidik Jari</label>
                  <textarea
                    placeholder="Tulis ciri-ciri warga, afiliasi atau catatan lain..."
                    value={newNotes}
                    onChange={(e) => setNewNotes(e.target.value)}
                    className="w-full mt-1 bg-slate-950 border border-slate-800 text-xs text-slate-100 p-2 rounded outline-none h-18 resize-none"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="px-3 py-1.5 border border-slate-800 text-slate-400 hover:text-white rounded text-xs cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold rounded text-xs cursor-pointer"
                  >
                    Daftarkan Warga
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
