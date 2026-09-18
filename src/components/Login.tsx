import React, { useState, useEffect } from 'react';
import { useMdt } from '../context/MdtContext';
import { Shield, Eye, EyeOff, Terminal, Clock, ShieldAlert, KeyRound } from 'lucide-react';
import { motion } from 'motion/react';
import lspdLogo from '../assets/images/lspd_logo_1781980741624.jpg';
import lspdTacticalBanner from '../assets/images/lspd_tactical_banner_1784039135073.jpg';
import lspdTacticalBadge from '../assets/images/lspd_tactical_badge_1784039151998.jpg';

export const Login: React.FC = () => {
  const { loginOfficer } = useMdt();
  const [badgeNumber, setBadgeNumber] = useState('');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState('');
  const [showDemoCreds, setShowDemoCreds] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setCurrentDate(now.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!badgeNumber.trim()) {
      setErrorMsg('Nomor Lencana wajib diisi.');
      return;
    }
    if (!pin.trim()) {
      setErrorMsg('PIN Akses Keamanan LSPD diperlukan.');
      return;
    }
    
    const res = loginOfficer(badgeNumber, pin);
    if (!res.success) {
      setErrorMsg(res.error || 'Akses Ditolak.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center relative overflow-hidden font-sans p-4">
      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none opacity-40"></div>
      
      {/* Tech line accents */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-sky-400 to-indigo-600 animate-pulse"></div>

      {/* Floating Tactical clock */}
      <div className="absolute top-6 left-6 text-slate-400 text-xs font-mono hidden md:flex items-center space-x-2 border border-slate-800 bg-slate-900/60 p-2 rounded">
        <Clock className="w-3.5 h-3.5 text-sky-400" />
        <span>[ {currentDate} | {currentTime} ]</span>
      </div>

      <motion.div 
         initial={{ opacity: 0, y: 20 }}
         animate={{ opacity: 1, y: 0 }}
         transition={{ duration: 0.6, ease: 'easeOut' }}
         className="w-full max-w-md bg-slate-900/95 border border-slate-800 rounded-lg shadow-2xl overflow-hidden relative backdrop-blur-md mb-6"
         id="lspd-login-card"
      >
        {/* Banner Image at top */}
        <div className="h-44 w-full relative overflow-hidden border-b border-slate-800/80">
          <img 
            src={lspdTacticalBanner} 
            alt="LSPD Command Center" 
            className="w-full h-full object-cover brightness-[0.6] contrast-[1.05]"
            referrerPolicy="no-referrer"
          />
          {/* Badge overlays the banner partially */}
          <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2">
            <img 
              src={lspdTacticalBadge} 
              alt="LSPD Badge" 
              className="w-20 h-20 object-cover rounded-full border-2 border-sky-500 shadow-xl shadow-black/90 bg-slate-950 animate-pulse-slow"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>

        {/* Card Tactical Header */}
        <div className="bg-slate-950 px-6 pt-12 pb-5 border-b border-slate-850 flex flex-col items-center text-center space-y-2">
          <div>
            <h1 className="text-base font-extrabold tracking-widest text-slate-100 font-mono">LOS SANTOS POLICE DEPT</h1>
            <p className="text-[10px] text-sky-400 font-bold uppercase tracking-widest mt-0.5">LSPD MOBILE DATA TERMINAL</p>
          </div>
         </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="text-center pb-2 border-b border-slate-850">
            <p className="text-xs text-slate-400">Pintu Gerbang Data Terpusat Kepolisian. Masuk menggunakan Nomor Lencana (Badge) & PIN sandi Anda.</p>
          </div>

          {errorMsg && (
            <div className="flex items-center space-x-2 bg-rose-950/60 border border-rose-800 text-rose-200 text-xs p-3 rounded font-mono">
              <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Badge Number */}
          <div className="space-y-1">
            <label className="block text-xs font-mono font-semibold text-slate-300 uppercase tracking-wider">Nomor Lencana (Badge #)</label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-500 text-xs font-mono">LSPD-</span>
              <input
                id="login-badge-input"
                type="text"
                placeholder="01"
                value={badgeNumber}
                onChange={(e) => {
                  setBadgeNumber(e.target.value);
                  setErrorMsg('');
                }}
                className="w-full pl-15 pr-3 py-2 bg-slate-950 border border-slate-800 focus:border-sky-500 rounded text-sm text-slate-100 placeholder-slate-600 font-mono outline-none uppercase transition-colors"
                required
              />
            </div>
          </div>

          {/* Access PIN */}
          <div className="space-y-1">
            <label className="block text-xs font-mono font-semibold text-slate-300 uppercase tracking-wider">PIN Akses Keamanan (LSPD PIN)</label>
            <div className="relative">
              <input
                id="login-pin-input"
                type={showPin ? 'text' : 'password'}
                placeholder="••••"
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value);
                  setErrorMsg('');
                }}
                className="w-full pl-3 pr-10 py-2 bg-slate-950 border border-slate-800 focus:border-sky-500 rounded text-sm text-slate-100 placeholder-slate-600 font-mono outline-none tracking-widest transition-colors"
                required
              />
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200"
              >
                {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[9.5px] text-slate-500 italic font-mono pt-1">Hanya petugas terdaftar yang dapat memverifikasi PIN keamanan.</p>
          </div>

          <button
            id="login-submit-btn"
            type="submit"
            className="w-full mt-4 bg-sky-500 hover:bg-sky-400 active:bg-sky-600 text-slate-950 py-2 rounded text-xs font-bold font-mono uppercase tracking-widest cursor-pointer transition-colors duration-150 shadow-md shadow-sky-500/10 flex items-center justify-center space-x-2"
          >
            <Shield className="w-4 h-4" />
            <span>Koneksikan Terminal (On Duty)</span>
          </button>
        </form>

        {/* Footer info lock */}
        <div className="bg-slate-950 px-6 py-3 border-t border-slate-800 text-center">
          <p className="text-[9px] text-slate-600 font-mono">
            Hanya untuk penggunaan resmi LSPD / Penegak Hukum Los Santos. Setiap pelanggaran akses sistem akan dicatat dan dituntut secara pidana sesuai Undang-Undang Kepolisian San Andreas Pasal 401.
          </p>
        </div>
      </motion.div>

      <button
        onClick={() => setShowDemoCreds(!showDemoCreds)}
        className="text-[10px] text-slate-600 hover:text-slate-400 font-mono transition-colors focus:outline-none mb-4 cursor-pointer"
      >
        {showDemoCreds ? '[ Sembunyikan Sandi Demo ]' : '[ Tampilkan Sandi Demo ]'}
      </button>

      {/* Demo credentials helper card */}
      {showDemoCreds && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="w-full max-w-md bg-slate-900 border border-slate-800/80 rounded-lg p-4 font-mono text-xs text-left"
        >
          <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
            <div className="flex items-center space-x-1.5 text-sky-450 font-bold">
              <KeyRound className="w-4 h-4" />
              <span className="uppercase text-[11px] tracking-wider">KREDENSIAL DEMO KEPOLISIAN</span>
            </div>
            <button
              onClick={() => setShowDemoCreds(false)}
              className="text-[10px] text-slate-500 hover:text-slate-300"
            >
              [Sembunyikan]
            </button>
          </div>
          <div className="space-y-1.5 text-slate-400 text-[11px] divide-y divide-slate-850">
            <div className="py-1 flex justify-between">
              <span>Chief Charles Davis (Badge #01):</span>
              <span className="text-sky-400 font-bold">LSPD-01 | PIN: 1010</span>
            </div>
            <div className="py-1 flex justify-between">
              <span>Lt. Alice Miller (Badge #05):</span>
              <span className="text-sky-400 font-bold">LSPD-05 | PIN: 1005</span>
            </div>
            <div className="py-1 flex justify-between">
              <span>Sgt. Jack Bennett (Badge #21):</span>
              <span className="text-sky-400 font-bold">LSPD-21 | PIN: 1021</span>
            </div>
          </div>
          <p className="text-[10px] text-slate-500 italic mt-2 text-center">
            *Setelah masuk, Anda dapat mendaftarkan akun polisi baru di tab menu Anggota Roster.
          </p>
        </motion.div>
      )}

      {/* Modern credit brand label */}
      <div className="mt-8 text-center text-[10px] font-mono text-slate-600 tracking-wider">
        <span>PRODUCT OF <span className="text-sky-400 font-bold hover:text-sky-300 transition-colors cursor-default">RCHCREATION</span> • ALL RIGHTS RESERVED</span>
      </div>
    </div>
  );
};
