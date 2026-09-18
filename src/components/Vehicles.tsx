import React, { useState } from 'react';
import { useMdt } from '../context/MdtContext';
import { Vehicle, OfficerRank } from '../types';
import { Search, PlusCircle, Car, AlertTriangle, ShieldCheck, Tag, User, Save, Edit, Radio, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface VehiclesProps {
  setSelectedCitizenId: (id: string | null) => void;
  setActiveTab: (tab: string) => void;
}

export const Vehicles: React.FC<VehiclesProps> = ({ setSelectedCitizenId, setActiveTab }) => {
  const { vehicles, citizens, addVehicle, updateVehicle, deleteVehicle, currentOfficer } = useMdt();
  const isCadet = currentOfficer?.rank === OfficerRank.CADET;

  const [searchQuery, setSearchQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);

  // New Vehicle Form State
  const [newPlate, setNewPlate] = useState('');
  const [newModel, setNewModel] = useState('');
  const [newColor, setNewColor] = useState('');
  const [selectedOwnerId, setSelectedOwnerId] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [searchOwnerQuery, setSearchOwnerQuery] = useState('');

  // Editing notes state
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notesEditValue, setNotesEditValue] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const activeVehicle = vehicles.find((v) => v.id === selectedVehicleId) || null;

  React.useEffect(() => {
    setShowDeleteConfirm(false);
  }, [selectedVehicleId]);

  // Search filter
  const filteredVehicles = vehicles.filter((v) => {
    const q = searchQuery.toLowerCase();
    return (
      v.plate.toLowerCase().includes(q) ||
      v.model.toLowerCase().includes(q) ||
      v.ownerName.toLowerCase().includes(q)
    );
  });

  const handleRegisterVehicle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlate.trim() || !newModel.trim() || !selectedOwnerId) return;

    const matchedCitizen = citizens.find((c) => c.id === selectedOwnerId);
    const ownerName = matchedCitizen ? `${matchedCitizen.firstName} ${matchedCitizen.lastName}` : 'Sipil Anonim';

    addVehicle({
      plate: newPlate.toUpperCase().replace(/\s+/g, ''),
      model: newModel,
      color: newColor || 'Default',
      ownerId: selectedOwnerId,
      ownerName,
      isStolen: false,
      notes: newNotes || 'Tidak ada catatan.',
      imageUrl: newImageUrl.trim() || undefined,
    });

    // Reset fields
    setNewPlate('');
    setNewModel('');
    setNewColor('');
    setSelectedOwnerId('');
    setNewNotes('');
    setNewImageUrl('');
    setShowAddForm(false);
  };

  const handleToggleStolen = (vehicle: Vehicle) => {
    updateVehicle(vehicle.id, { isStolen: !vehicle.isStolen });
  };

  const handleSaveNotes = () => {
    if (!activeVehicle) return;
    updateVehicle(activeVehicle.id, { notes: notesEditValue });
    setIsEditingNotes(false);
  };

  const handleDeleteVehicle = () => {
    if (!activeVehicle) return;
    deleteVehicle(activeVehicle.id);
    setSelectedVehicleId(null);
    setShowDeleteConfirm(false);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="vehicles-panel">
      
      {/* LEFT COLUMN: VEHICLES REGISTER */}
      <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-lg overflow-hidden shadow-lg flex flex-col h-[750px]">
        
        {/* Panel Header */}
        <div className="bg-slate-850 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-sm font-bold font-mono text-slate-200 uppercase tracking-widest">Samsat / Registrasi Plat LSPD</h2>
          {!isCadet && (
            <button
              id="register-vehicle-btn"
              onClick={() => setShowAddForm(true)}
              className="p-1 px-[10px] bg-sky-500 hover:bg-sky-400 text-slate-950 rounded text-xs font-bold font-mono flex items-center gap-1 cursor-pointer transition-colors"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              REGISTASI
            </button>
          )}
        </div>

        {/* Input Searcher */}
        <div className="p-3 bg-slate-950 border-b border-slate-900">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
            <input
              id="vehicle-search-input"
              type="text"
              placeholder="Cari Plat Nomor / Model / Pemilik..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 focus:border-sky-500 rounded pl-9 pr-3 py-2 text-xs text-slate-100 outline-none font-mono uppercase"
            />
          </div>
        </div>

        {/* Vehicle List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-805/60 p-2 space-y-1">
          {filteredVehicles.length === 0 ? (
            <div className="text-center py-12 text-slate-500 font-mono text-xs">
              Tidak ada pelat kendaraan terdaftar ditemukan.
            </div>
          ) : (
            filteredVehicles.map((v) => {
              const isSelected = selectedVehicleId === v.id;
              return (
                <div
                  key={v.id}
                  onClick={() => {
                    setSelectedVehicleId(v.id);
                    setNotesEditValue(v.notes);
                    setIsEditingNotes(false);
                  }}
                  className={`p-3 rounded flex items-center justify-between cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-sky-950/40 border border-sky-850'
                      : v.isStolen
                      ? 'bg-red-950/15 border border-red-900/30 hover:bg-red-950/20'
                      : 'border border-transparent hover:bg-slate-850/60'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded border shrink-0 ${
                      v.isStolen
                        ? 'bg-red-950/60 text-red-400 border-red-800 animate-pulse'
                        : 'bg-slate-950 text-sky-400 border-slate-800'
                    }`}>
                      <Car className="w-4 h-4" />
                    </div>
                    <div className="font-mono text-left">
                      <h4 className="text-xs font-bold text-slate-150">
                        {v.model}
                      </h4>
                      <p className="text-[10px] text-slate-550 mt-0.5">Pemilik: {v.ownerName}</p>
                    </div>
                  </div>

                  <span className={`text-[11px] font-mono font-bold px-2 py-1 rounded tracking-wide border ${
                    v.isStolen
                      ? 'bg-red-950/80 text-red-400 border-red-800 animate-pulse'
                      : 'bg-slate-950 text-sky-400 border-slate-800'
                  }`}>
                    {v.plate}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: DETAILED SPECIFICATIONS */}
      <div className="lg:col-span-7">
        {activeVehicle ? (
          <div className={`bg-slate-900 border rounded-lg shadow-lg overflow-hidden transition-all ${activeVehicle.isStolen ? 'border-red-900' : 'border-slate-800'}`}>
            {/* Header Plate Info */}
            <div className={`p-6 bg-gradient-to-b ${activeVehicle.isStolen ? 'from-red-950/40 to-slate-900' : 'from-slate-850 to-slate-900'} border-b border-slate-800`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-mono">
                <div>
                  <span className="text-[10px] text-sky-400 font-bold block mb-1">DATA REGISTRASI KENDARAAN (DMV)</span>
                  <h2 className="text-xl font-bold text-slate-100">{activeVehicle.model}</h2>
                  <p className="text-xs text-slate-400 mt-1">ID Register: {activeVehicle.id}</p>
                </div>
                
                <div className="text-right flex flex-col items-end gap-1.5">
                  <span className="text-base bg-slate-950 px-4 py-1.5 rounded-md border border-slate-700 tracking-wider text-sky-400 font-bold font-mono">
                    {activeVehicle.plate}
                  </span>
                  {activeVehicle.isStolen ? (
                    <span className="text-[10px] bg-red-950 border border-red-800 text-red-400 font-bold px-2 py-0.5 rounded flex items-center gap-1 animate-pulse">
                      <Radio className="w-3.5 h-3.5" /> STOLEN WARRANTE
                    </span>
                  ) : (
                    <span className="text-[10px] bg-emerald-950/80 border border-emerald-900 text-emerald-400 font-bold px-2 py-0.5 rounded flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" /> REGISTERED OK
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Core details body */}
            <div className="p-6 space-y-5 font-mono text-xs">
              {activeVehicle.imageUrl && (
                <div className="w-full bg-slate-950 border border-slate-800 p-1 rounded-md overflow-hidden shadow-inner">
                  <img
                    src={activeVehicle.imageUrl}
                    alt={activeVehicle.model}
                    className="w-full h-44 object-cover rounded border border-slate-900"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Specs card 1: Model & Color */}
                <div className="bg-slate-950 border border-slate-805 p-4 rounded space-y-1">
                  <span className="text-[10px] text-slate-500 uppercase block">Spesifikasi Model & Warna:</span>
                  <p className="text-slate-200">Model: <span className="text-slate-100 font-bold">{activeVehicle.model}</span></p>
                  <p className="text-slate-400 pt-1">Warna Bodi: <span className="text-slate-250 font-bold">{activeVehicle.color}</span></p>
                </div>

                {/* Specs card 2: Owner profile link */}
                <div className="bg-slate-955 border border-slate-805 p-4 rounded flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block">Terdaftar Atas Nama:</span>
                    <p className="text-slate-100 text-sm font-bold pt-1">{activeVehicle.ownerName}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">NIK Pemilik: {activeVehicle.ownerId}</p>
                  </div>

                  {activeVehicle.ownerId !== 'UNKNOWN' && activeVehicle.ownerId !== 'DEPT-1' && (
                    <button
                      onClick={() => {
                        setSelectedCitizenId(activeVehicle.ownerId);
                        setActiveTab('citizens');
                      }}
                      className="mt-3 text-sky-400 hover:text-sky-300 flex items-center gap-1 cursor-pointer font-bold text-[11px]"
                    >
                      <User className="w-3.5 h-3.5" /> TINJAU PROFIL PEMILIK
                    </button>
                  )}
                </div>
              </div>

              {/* Vehicle field investigator notes */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-450 uppercase tracking-widest font-bold">CATATAN DAN KETERANGAN KENDARAAN</span>
                  {!isCadet && (
                    !isEditingNotes ? (
                      <button
                        onClick={() => {
                          setNotesEditValue(activeVehicle.notes);
                          setIsEditingNotes(true);
                        }}
                        className="text-[11px] text-sky-400 hover:text-sky-300 flex items-center gap-1 cursor-pointer"
                      >
                        <Edit className="w-3.5 h-3.5" /> EDIT CATATAN
                      </button>
                    ) : (
                      <button
                        onClick={handleSaveNotes}
                        className="text-[11px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer font-bold bg-slate-950 px-2 py-0.5 rounded border border-slate-800"
                      >
                        <Save className="w-3.5 h-3.5" /> SIMPAN
                      </button>
                    )
                  )}
                </div>

                <div className="bg-slate-950 border border-slate-805 rounded p-4 text-xs font-sans">
                  {isEditingNotes ? (
                    <textarea
                      value={notesEditValue}
                      onChange={(e) => setNotesEditValue(e.target.value)}
                      className="w-full h-24 bg-slate-900 border border-slate-808 rounded p-2 text-slate-100 outline-none resize-none font-mono text-xs"
                    />
                  ) : (
                    <p className="text-slate-350 leading-relaxed text-left italic">
                      {activeVehicle.notes || 'Tidak ada catatan khusus terdaftar untuk kendaraan ini.'}
                    </p>
                  )}
                </div>
              </div>

              {/* DMV / Theft state toggle action button */}
              {!isCadet && (
                <div className="border-t border-slate-950 pt-4 space-y-3">
                  <div className="flex gap-2 flex-wrap">
                    {!showDeleteConfirm && (
                      <button
                        onClick={() => handleToggleStolen(activeVehicle)}
                        id="flag-stolen-toggle"
                        className={`px-3 py-2 rounded text-xs font-bold font-mono uppercase tracking-wide cursor-pointer text-slate-950 ${
                          activeVehicle.isStolen
                            ? 'bg-emerald-500 hover:bg-emerald-400'
                            : 'bg-red-500 hover:bg-red-400 shadow-md shadow-red-500/10 animate-pulse'
                        }`}
                      >
                        {activeVehicle.isStolen ? 'TANDAI AMAN / CABUT LAPOR CURANMOR' : 'TANDAI DICURI (WARRANT APB LAPORAN)'}
                      </button>
                    )}

                    {!showDeleteConfirm && (
                      <button
                        onClick={() => setShowDeleteConfirm(true)}
                        className="px-3 py-2 bg-rose-950/60 text-rose-400 hover:bg-rose-900 hover:text-rose-200 border border-rose-900/40 rounded text-xs font-bold font-mono flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>HAPUS KENDARAAN</span>
                      </button>
                    )}
                  </div>

                  {showDeleteConfirm && (
                    <div className="bg-rose-950/20 border border-rose-900/30 rounded p-3 flex flex-col sm:flex-row items-center justify-between gap-2 font-mono text-xs w-full">
                      <span className="text-rose-400 font-bold">⚠️ HAPUS DATA KENDARAAN INI SECARA PERMANEN?</span>
                      <div className="flex gap-2">
                        <button
                          onClick={handleDeleteVehicle}
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
            <Car className="w-12 h-12 text-slate-800 mb-3" />
            <h3 className="text-sm font-bold font-mono uppercase tracking-wide text-slate-400">INFO REGISTER KENDARAAN</h3>
            <p className="text-xs max-w-sm mt-1">
              Silakan pilih plat nomor terdaftar dari kolom sebelah kiri, atau ketik plat pencarian tertentu untuk memantau status mobil curian, warna bodi terdaftar, serta profil pemilik resmi.
            </p>
          </div>
        )}
      </div>

      {/* DMV NEW VEHICLE REGISTRATION POPUP MODAL */}
      <AnimatePresence>
        {showAddForm && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border-2 border-slate-800 rounded-lg max-w-md w-full p-6 text-left relative shadow-2xl"
              id="vehicle-register-modal"
            >
              <h3 className="text-sm font-bold font-mono text-slate-200 uppercase tracking-widest mb-4 pb-2 border-b border-slate-800">
                REGISTRASI KENDARAAN / KEPEMILIKAN BARU
              </h3>

              <form onSubmit={handleRegisterVehicle} className="space-y-3 font-mono">
                <div>
                  <label className="block text-[10px] text-slate-450 uppercase">Plat Nomor (Licence Plate)</label>
                  <input
                    type="text"
                    placeholder="cth. 83LSPD01"
                    maxLength={8}
                    value={newPlate}
                    onChange={(e) => setNewPlate(e.target.value)}
                    className="w-full mt-1 bg-slate-950 border border-slate-800 text-xs text-slate-100 p-2 rounded outline-none uppercase font-bold tracking-wider"
                    required
                  />
                  <p className="text-[9px] text-slate-500 mt-1">Maksimal 8 karakter. Spasi dilewatkan otomatis oleh sistem.</p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-slate-455 uppercase">Model Kendaraan</label>
                    <input
                      type="text"
                      placeholder="cth. Pegassi Zentorno"
                      value={newModel}
                      onChange={(e) => setNewModel(e.target.value)}
                      className="w-full mt-1 bg-slate-950 border border-slate-800 text-xs text-slate-100 p-2 rounded outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-455 uppercase">Warna Terdaftar</label>
                    <input
                      type="text"
                      placeholder="cth. Kuning Neon"
                      value={newColor}
                      onChange={(e) => setNewColor(e.target.value)}
                      className="w-full mt-1 bg-slate-950 border border-slate-800 text-xs text-slate-100 p-2 rounded outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] text-slate-455 uppercase font-bold mb-1">Pemilik Kendaraan Terdaftar (DMV Owner Database)</label>
                  
                  {/* Selected Owner badge display */}
                  <div className="bg-slate-950 border border-slate-800 rounded p-2 mb-2 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[9px] text-slate-500 uppercase block">TERPILIH SAAT INI:</span>
                      {selectedOwnerId === 'UNKNOWN' ? (
                        <span className="text-amber-500 font-bold">Sipil Anonim / Pelat Palsu</span>
                      ) : selectedOwnerId === 'DEPT-1' ? (
                        <span className="text-sky-400 font-bold">Kendaraan Dinas LSPD / Pemda</span>
                      ) : selectedOwnerId ? (
                        (() => {
                          const matched = citizens.find(c => c.id === selectedOwnerId);
                          return matched 
                            ? <span className="text-emerald-400 font-bold">{matched.firstName} {matched.lastName} ({matched.id})</span>
                            : <span className="text-slate-400 font-bold">Warga Terpilih ({selectedOwnerId})</span>;
                        })()
                      ) : (
                        <span className="text-rose-455 font-bold italic text-[11px]">Belum Ada Pemilik Terpilih *</span>
                      )}
                    </div>
                    {/* Fast presets buttons */}
                    <div className="flex gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedOwnerId('UNKNOWN');
                          setSearchOwnerQuery('');
                        }}
                        className={`px-2 py-1 text-[9px] font-bold rounded border cursor-pointer transition-all ${
                          selectedOwnerId === 'UNKNOWN'
                            ? 'bg-amber-950/40 text-amber-500 border-amber-900'
                            : 'bg-slate-900 text-slate-400 border-slate-850 hover:border-slate-800'
                        }`}
                      >
                        Anonim
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedOwnerId('DEPT-1');
                          setSearchOwnerQuery('');
                        }}
                        className={`px-2 py-1 text-[9px] font-bold rounded border cursor-pointer transition-all ${
                          selectedOwnerId === 'DEPT-1'
                            ? 'bg-sky-950/40 text-sky-400 border-sky-900'
                            : 'bg-slate-900 text-slate-400 border-slate-850 hover:border-slate-800'
                        }`}
                      >
                        Dinas LSPD
                      </button>
                    </div>
                  </div>

                  {/* Autocomplete owner search */}
                  <div className="space-y-1.5">
                    <input
                      type="text"
                      placeholder="Cari nama warga / NIK pemilik..."
                      value={searchOwnerQuery}
                      onChange={(e) => setSearchOwnerQuery(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 text-xs text-slate-100 p-2 rounded outline-none"
                    />
                    
                    {searchOwnerQuery.trim() && (
                      <div className="bg-slate-955 border border-slate-805 rounded max-h-[110px] overflow-y-auto p-1 divide-y divide-slate-900 select-none">
                        {(() => {
                          const matching = citizens.filter(c => {
                            const name = `${c.firstName} ${c.lastName}`.toLowerCase();
                            const query = searchOwnerQuery.toLowerCase();
                            return name.includes(query) || c.id.toLowerCase().includes(query);
                          });
                          
                          if (matching.length === 0) {
                            return <p className="text-[10px] text-slate-500 p-2 text-center font-sans">Tidak ada warga terdaftar ditemukan.</p>;
                          }
                          
                          return matching.map((c) => (
                            <div
                              key={c.id}
                              onClick={() => {
                                setSelectedOwnerId(c.id);
                                setSearchOwnerQuery('');
                              }}
                              className={`p-1.5 rounded text-[11px] text-left cursor-pointer transition-colors flex items-center justify-between ${
                                selectedOwnerId === c.id
                                  ? 'bg-sky-950/60 text-sky-400 font-bold'
                                  : 'text-slate-350 hover:bg-slate-900'
                              }`}
                            >
                              <span>{c.firstName} {c.lastName}</span>
                              <span className="text-[9.5px] text-slate-500 font-mono">[{c.id}]</span>
                            </div>
                          ));
                        })()}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] text-slate-455 uppercase">Tautan Foto / Penampakan Mobil (URL)</label>
                  <input
                    type="url"
                    placeholder="cth. https://images.unsplash.com/photo-..."
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                    className="w-full mt-1 mb-3 bg-slate-950 border border-slate-800 text-xs text-slate-100 p-2 rounded outline-none font-mono"
                  />

                  <label className="block text-[10px] text-slate-455 uppercase">Catatan Registrasi Sipil / Asuransi</label>
                  <textarea
                    placeholder="Masa berlaku stiker pajak, modifikasi terdaftar, dsb..."
                    value={newNotes}
                    onChange={(e) => setNewNotes(e.target.value)}
                    className="w-full mt-1 bg-slate-950 border border-slate-800 text-xs text-slate-100 p-2 rounded outline-none h-18 resize-none font-mono"
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
                    Registrasikan Kendaraan
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
