import React, { useState } from 'react';
import { useMdt } from '../context/MdtContext';
import { Charge } from '../types';
import { Scale, Search, Edit2, RotateCcw, Plus, Save, Trash, AlertCircle, Check } from 'lucide-react';

export const PenalCodeEditor: React.FC = () => {
  const { penalCodes, updatePenalCode, addPenalCode, resetPenalCodes } = useMdt();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [editingCode, setEditingCode] = useState<string | null>(null);

  // Editing form state
  const [editTitle, setEditTitle] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editFine, setEditFine] = useState(0);
  const [editJailTime, setEditJailTime] = useState(0);

  // New penal code state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('Kejahatan Ringan');
  const [newDescription, setNewDescription] = useState('');
  const [newFine, setNewFine] = useState(0);
  const [newJailTime, setNewJailTime] = useState(0);

  const categories: string[] = ['All', ...Array.from(new Set(penalCodes.map((c) => c.category)) as Set<string>)];

  // Search & category filter
  const filteredCodes = penalCodes.filter((c) => {
    const matchesCategory = selectedCategory === 'All' || c.category === selectedCategory;
    const matchesSearch =
      c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleStartEdit = (charge: Charge) => {
    setEditingCode(charge.code);
    setEditTitle(charge.title);
    setEditCategory(charge.category);
    setEditDescription(charge.description);
    setEditFine(charge.fine);
    setEditJailTime(charge.jailTime);
    setShowAddForm(false);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCode) return;

    updatePenalCode(editingCode, {
      title: editTitle,
      category: editCategory,
      description: editDescription,
      fine: editFine,
      jailTime: editJailTime,
    });

    setEditingCode(null);
  };

  const handleCreateCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode.trim() || !newTitle.trim()) return;

    // Check duplicate code
    if (penalCodes.some((c) => c.code.toLowerCase() === newCode.trim().toLowerCase())) {
      alert(`Kode pasal ${newCode} sudah digunakan!`);
      return;
    }

    addPenalCode({
      code: newCode.trim().toUpperCase(),
      title: newTitle.trim(),
      category: newCategory,
      description: newDescription.trim(),
      fine: Number(newFine),
      jailTime: Number(newJailTime),
    });

    // Reset Form
    setNewCode('');
    setNewTitle('');
    setNewDescription('');
    setNewFine(0);
    setNewJailTime(0);
    setShowAddForm(false);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="penal-codes-editor-panel">
      
      {/* List / Selection Panel */}
      <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-lg overflow-hidden shadow-lg flex flex-col h-[750px] text-left">
        {/* Header bar */}
        <div className="bg-slate-850 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Scale className="w-5 h-5 text-sky-400" />
            <h2 className="text-sm font-bold font-mono text-slate-200 uppercase tracking-widest">KIT UNDANG-UNDANG KOTA LSPD (UUD)</h2>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={resetPenalCodes}
              className="p-1 px-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-805 text-slate-400 hover:text-red-400 rounded text-xs font-bold font-mono flex items-center gap-1 cursor-pointer transition-colors"
              title="Reset ke pengaturan UUD default kota"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>RESET</span>
            </button>
            <button
              onClick={() => {
                setShowAddForm(true);
                setEditingCode(null);
              }}
              className="p-1 px-[10px] bg-sky-500 hover:bg-sky-400 text-slate-950 rounded text-xs font-bold font-mono flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>TAMBAH PASAL</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="p-3 bg-slate-950/80 border-b border-slate-850 flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-slate-600" />
            <input
              type="text"
              placeholder="Cari kode pasal, denda atau undang-undang..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-905 border border-slate-805 pl-9 pr-3 py-1.5 text-xs text-slate-101 rounded outline-none placeholder-slate-650 font-mono"
            />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-slate-905 border border-slate-805 text-xs px-3 py-1.5 rounded outline-none cursor-pointer text-slate-205 font-mono"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat === 'All' ? 'SEMUA KATEGORI' : cat.toUpperCase()}
              </option>
            ))}
          </select>
        </div>

        {/* List scroll view */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 divide-y divide-slate-850 font-mono text-xs">
          {filteredCodes.length === 0 ? (
            <div className="text-center py-12 text-slate-600 italic">
              Tidak ada undang-undang yang cocok dengan penelusuran Anda.
            </div>
          ) : (
            filteredCodes.map((c) => {
              const isEditingThis = editingCode === c.code;
              return (
                <div
                  key={c.code}
                  className={`p-3.5 rounded border transition-all text-left relative flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isEditingThis
                      ? 'bg-sky-955/20 border-sky-900 text-sky-400 shadow shadow-sky-950/10'
                      : 'bg-slate-950/30 border-slate-805/60 hover:bg-slate-950/60'
                  }`}
                >
                  <div className="space-y-1.5 max-w-xl text-left">
                    <div className="flex items-center gap-2 flex-wrap pb-1 border-b border-slate-900">
                      <span className="bg-slate-900 text-[10.5px] border border-slate-800 text-slate-350 px-1.5 py-0.5 rounded font-bold">
                        {c.code}
                      </span>
                      <h4 className="text-xs font-bold text-slate-200">{c.title}</h4>
                      <span className="text-[10px] text-sky-500 uppercase font-semibold">({c.category})</span>
                    </div>
                    <p className="text-[11px] text-slate-400 font-sans leading-relaxed">{c.description}</p>
                    <div className="flex items-center gap-4 text-[10.5px] text-slate-450 pt-1">
                      <span>
                        Denda: <span className="text-amber-500 font-bold">${c.fine.toLocaleString()}</span>
                      </span>
                      <span>
                        Hukuman Kurungan: <span className="text-rose-500 font-bold">{c.jailTime} Bulan</span>
                      </span>
                    </div>
                  </div>

                  <div className="flex sm:flex-col justify-end gap-2 shrink-0 self-end sm:self-center">
                    <button
                      onClick={() => handleStartEdit(c)}
                      className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-sky-405 hover:text-sky-305 text-[10.5px] rounded cursor-pointer flex items-center gap-1 font-bold"
                    >
                      <Edit2 className="w-3" />
                      <span>EDIT PASAL</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Editor sidebar column */}
      <div className="lg:col-span-5 space-y-4">
        {editingCode ? (
          <form onSubmit={handleSaveEdit} className="bg-slate-900 border border-slate-800 rounded-lg p-5 shadow-lg space-y-4 text-left font-mono text-xs">
            <div className="border-b border-slate-800 pb-2.5 flex items-center justify-between">
              <span className="text-xs font-bold text-sky-400 uppercase tracking-widest">EDIT PASAL DI KOTA</span>
              <span className="text-[10.5px] bg-sky-950/85 border border-sky-900 text-sky-400 px-2 py-0.5 rounded">
                KODE {editingCode}
              </span>
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] text-slate-450 uppercase font-bold">Judul Undang-Undang / Pasal</label>
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded text-xs text-slate-101 outline-none focus:border-sky-505"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] text-slate-450 uppercase font-bold">Kategori</label>
              <select
                value={editCategory}
                onChange={(e) => setEditCategory(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded text-xs text-slate-101 outline-none focus:border-sky-550 cursor-pointer"
              >
                <option value="Kejahatan Ringan">Kejahatan Ringan</option>
                <option value="Kejahatan Sedang">Kejahatan Sedang</option>
                <option value="Kejahatan Kejahatan">Kejahatan Berat</option>
                <option value="Trafik / Lalu Lintas">Trafik / Lalu Lintas</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-[10px] text-slate-450 uppercase font-bold">Denda Administrasi ($)</label>
                <input
                  type="number"
                  value={editFine}
                  onChange={(e) => setEditFine(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded text-xs text-slate-101 outline-none focus:border-sky-505"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="block text-[10px] text-slate-450 uppercase font-bold">Waktu Kurungan (Bulan)</label>
                <input
                  type="number"
                  value={editJailTime}
                  onChange={(e) => setEditJailTime(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded text-xs text-slate-101 outline-none focus:border-sky-505"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] text-slate-450 uppercase font-bold">Ringkasan Deskripsi Hukum</label>
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                className="w-full h-24 bg-slate-950 border border-slate-800 p-2.5 rounded text-xs text-slate-200 outline-none focus:border-sky-505 font-sans resize-none"
                required
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t border-slate-800/60">
              <button
                type="button"
                onClick={() => setEditingCode(null)}
                className="px-3.5 py-1.5 border border-slate-800 text-slate-400 hover:text-slate-200 rounded cursor-pointer transition-colors"
              >
                BATAL
              </button>
              <button
                type="submit"
                className="px-5 py-1.5 bg-sky-500 hover:bg-sky-455 text-slate-950 font-bold rounded cursor-pointer flex items-center gap-1.5 transition-colors"
              >
                <Save className="w-3.5 h-3.5" />
                <span>SIMPAN PASAL</span>
              </button>
            </div>
          </form>
        ) : showAddForm ? (
          <form onSubmit={handleCreateCode} className="bg-slate-900 border border-slate-800 rounded-lg p-5 shadow-lg space-y-4 text-left font-mono text-xs">
            <div className="border-b border-slate-800 pb-2.5 flex items-center justify-between">
              <span className="text-xs font-bold text-sky-400 uppercase tracking-widest">BUAT PASAL BARU KOTA</span>
              <span className="text-[10px] bg-emerald-950/60 border border-emerald-900 text-emerald-400 px-2 py-0.5 rounded">
                MDT DAFTAR BARU
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-left">
              <div className="space-y-1 col-span-1">
                <label className="block text-[10px] text-slate-450 uppercase font-bold">Kode Undang-undang</label>
                <input
                  type="text"
                  placeholder="cth. PC-1049"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded text-xs text-slate-100 outline-none focus:border-sky-505"
                  required
                />
              </div>
              <div className="space-y-1 col-span-1">
                <label className="block text-[10px] text-slate-450 uppercase font-bold">Kategori</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded text-xs text-slate-101 outline-none focus:border-sky-505 cursor-pointer"
                >
                  <option value="Kejahatan Ringan">Kejahatan Ringan</option>
                  <option value="Kejahatan Sedang">Kejahatan Sedang</option>
                  <option value="Kejahatan Berat">Kejahatan Berat</option>
                  <option value="Trafik / Lalu Lintas">Trafik / Lalu Lintas</option>
                </select>
              </div>
            </div>

            <div className="space-y-1 text-left">
              <label className="block text-[10px] text-slate-450 uppercase font-bold">Judul Undang-undang / Ketentuan</label>
              <input
                type="text"
                placeholder="cth. Kepemilikan Barang Curian"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded text-xs text-slate-101 outline-none focus:border-sky-505"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3 text-left">
              <div className="space-y-1">
                <label className="block text-[10px] text-slate-350 uppercase font-bold">Denda Pelanggaran ($)</label>
                <input
                  type="number"
                  placeholder="0"
                  value={newFine}
                  onChange={(e) => setNewFine(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded text-xs text-slate-101 outline-none focus:border-sky-505"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="block text-[10px] text-slate-350 uppercase font-bold">Hukuman Kurungan (Bulan)</label>
                <input
                  type="number"
                  placeholder="0"
                  value={newJailTime}
                  onChange={(e) => setNewJailTime(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded text-xs text-slate-101 outline-none focus:border-sky-505"
                  required
                />
              </div>
            </div>

            <div className="space-y-1 text-left">
              <label className="block text-[10px] text-slate-450 uppercase font-bold font-mono">Ringkasan Ketentuan / Diskripsi Hukum</label>
              <textarea
                placeholder="Tulis uraian hukum atau deskripsi mengenai tindakan kriminal ini..."
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                className="w-full h-24 bg-slate-950 border border-slate-800 p-2.5 rounded text-xs text-slate-200 outline-none focus:border-sky-505 font-sans resize-none"
                required
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t border-slate-800/60 font-mono">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-3.5 py-1.5 border border-slate-800 text-slate-400 hover:text-slate-200 rounded cursor-pointer transition-colors"
              >
                BATAL
              </button>
              <button
                type="submit"
                className="px-5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded cursor-pointer flex items-center gap-1.5 transition-colors"
              >
                <Check className="w-3.5 h-3.5" />
                <span>TERBITKAN PASAL</span>
              </button>
            </div>
          </form>
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-8 shadow-lg text-center font-mono text-slate-500 space-y-4">
            <div className="w-12 h-12 rounded-full bg-slate-950 border border-slate-805 flex items-center justify-center mx-auto text-sky-455 animate-pulse">
              <Scale className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xs font-bold text-slate-350 uppercase">MDT PENAL CODE EDITOR</h3>
              <p className="text-[10px] text-slate-500 leading-relaxed max-w-[280px] mx-auto pt-1">
                Silahkan pilih pasal di sebelah kiri untuk melakukan perubahan denda atau masa penjara sel, atau buat pasal baru untuk kota Anda.
              </p>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};
