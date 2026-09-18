import React, { useState } from 'react';
import { useMdt } from '../context/MdtContext';
import { OfficerRank, OfficerDivision } from '../types';
import { Shield, FileText, Target, Car, Scale, GraduationCap, Megaphone, Trophy, Award, Search, Users, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';

// Division Banner Images
import lspdSwatImg from '../assets/images/lspd_division_swat_1784039884227.jpg';
import lspdPatrolImg from '../assets/images/lspd_division_patrol_1784039900671.jpg';
import lspdCibImg from '../assets/images/lspd_division_cib_1784039916451.jpg';
import lspdIaImg from '../assets/images/lspd_division_ia_1784039932311.jpg';
import lspdTrdImg from '../assets/images/lspd_division_trd_1784039946381.jpg';
import lspdPublicImg from '../assets/images/lspd_division_public_1784039962392.jpg';

export const PerformanceBoard: React.FC = () => {
  const {
    currentOfficer,
    registeredOfficers,
    reports,
    updateOfficerDivision
  } = useMdt();

  const [officerSearchQuery, setOfficerSearchQuery] = useState('');
  const [selectedDivisionFilter, setSelectedDivisionFilter] = useState<'ALL' | OfficerDivision>('ALL');

  const isGovernment = currentOfficer?.rank === OfficerRank.GOVERNMENT;

  // Helper to count reports for a specific officer
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

  // Enhance registered officers with report counts
  const enrichedOfficers = registeredOfficers.map((off) => {
    return {
      ...off,
      reportCount: getOfficerReportCount(off.badgeNumber, off.name)
    };
  });

  // Filter & Sort Officers
  const filteredAndRankedOfficers = enrichedOfficers
    .filter((off) => {
      const matchesSearch = 
        off.name.toLowerCase().includes(officerSearchQuery.toLowerCase()) ||
        off.badgeNumber.includes(officerSearchQuery) ||
        off.rank.toLowerCase().includes(officerSearchQuery.toLowerCase());
      
      const matchesDivision = 
        selectedDivisionFilter === 'ALL' ||
        off.division === selectedDivisionFilter;

      return matchesSearch && matchesDivision;
    })
    .sort((a, b) => b.reportCount - a.reportCount);

  // Stats summaries
  const divisionConfigs = [
    {
      id: OfficerDivision.SWAT,
      title: 'SWAT (Special Weapons & Tactics)',
      slogan: 'Operasi Taktis & Penegakan Resiko Tinggi',
      description: 'Menangani situasi darurat bersenjata, pembajakan, penyanderaan, dan penyerbuan barikade dengan perlindungan lapis baja berat.',
      themeColor: 'border-rose-500/20 text-rose-450 hover:border-rose-500/50 hover:bg-rose-500/5 bg-rose-950/5',
      tagColor: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
      icon: Target,
      spec: 'Senjata Berat • Bearcat Tactical • Taktis 10-29',
      image: lspdSwatImg,
    },
    {
      id: OfficerDivision.PATROL_TRAFFIC,
      title: 'Patrol Traffic (Patroli Lalu Lintas)',
      slogan: 'Ketertiban Jalan Raya, Pengawalan & DUI',
      description: 'Mengatur ketertiban lalu lintas, patroli jalan bebas hambatan, pencegahan balap liar, razia kelayakan berkendara, serta tes alkohol.',
      themeColor: 'border-amber-500/20 text-amber-455 hover:border-amber-500/50 hover:bg-amber-500/5 bg-amber-950/5',
      tagColor: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      icon: Car,
      spec: 'Speed Radar • High-Speed Pursuit Interceptor',
      image: lspdPatrolImg,
    },
    {
      id: OfficerDivision.CIB,
      title: 'CIB (Criminal Investigation Bureau)',
      slogan: 'Reserse Kriminal, Forensik & Narkotika',
      description: 'Melakukan penyelidikan kriminal mendalam, investigasi TKP, pelacakan sindikat narkoba, pengumpulan bukti sidik jari, dan penuntutan hukum.',
      themeColor: 'border-emerald-500/20 text-emerald-450 hover:border-emerald-500/50 hover:bg-emerald-500/5 bg-emerald-950/5',
      tagColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      icon: FileText,
      spec: 'Forensic Lab Access • Intel Case Tracking',
      image: lspdCibImg,
    },
    {
      id: OfficerDivision.INTERNAL_AFFAIRS,
      title: 'Internal Affairs (IA / Propam)',
      slogan: 'Pengawasan Kode Etik & Audit Personel',
      description: 'Menjaga kepatuhan hukum internal seluruh personel LSPD, memproses laporan penyalahgunaan wewenang, pungutan liar, dan audit integritas.',
      themeColor: 'border-violet-500/20 text-violet-450 hover:border-violet-500/50 hover:bg-violet-500/5 bg-violet-950/5',
      tagColor: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
      icon: Scale,
      spec: 'Ethics Compliance • Secret Audit Priority',
      image: lspdIaImg,
    },
    {
      id: OfficerDivision.TRD,
      title: 'TRD (Training & Recruitment Division)',
      slogan: 'Akademi Pelatihan, Rekrutmen & Ujian Kadet',
      description: 'Mengelola sekolah kepolisian (academy), melatih fisik & taktis Cadet, menguji kelayakan promosi, serta menyeleksi calon anggota baru.',
      themeColor: 'border-cyan-500/20 text-cyan-450 hover:border-cyan-500/50 hover:bg-cyan-500/5 bg-cyan-950/5',
      tagColor: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
      icon: GraduationCap,
      spec: 'Academy Drill Master • Recruit & Exam Board',
      image: lspdTrdImg,
    },
    {
      id: OfficerDivision.PUBLIC_ADMIN,
      title: 'Public Administration (Humas LSPD)',
      slogan: 'Hubungan Masyarakat, Adum & Press Release',
      description: 'Menghubungkan kepolisian dengan warga sipil, merilis siaran pers resmi balai kota, mengelola media sosial, dan koordinasi administrasi publik.',
      themeColor: 'border-pink-500/20 text-pink-455 hover:border-pink-500/50 hover:bg-pink-500/5 bg-pink-950/5',
      tagColor: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
      icon: Megaphone,
      spec: 'Press Release Dispatch • Media Relations',
      image: lspdPublicImg,
    }
  ];

  return (
    <div className="space-y-6">
      {/* Page Title Header */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1 text-left">
          <h1 className="text-base font-black font-mono text-white flex items-center gap-2 uppercase tracking-wider">
            <Trophy className="w-5 h-5 text-amber-500" /> KINERJA & SPESIALISASI DIVISI
          </h1>
          <p className="text-xs text-slate-400 font-sans leading-relaxed">
            Pusat monitoring kinerja personil kepolisian Los Santos, statistik laporan penanganan kasus, serta manajemen divisi taktis aktif.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-slate-950 border border-slate-850 px-3 py-1.5 rounded text-xs font-mono">
          <span className="text-slate-500 uppercase">Total Berkas BAP:</span>
          <span className="text-rose-400 font-bold">{reports.length} Laporan</span>
        </div>
      </div>

      {/* SECTION 1: DIVISI SPESIALISASI DEPARTEMEN (INTERACTIVE BENTO GRID) */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 shadow-lg space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <Shield className="w-5 h-5 text-sky-450 text-sky-400" />
            <h2 className="text-sm font-bold font-mono text-slate-200 uppercase tracking-widest">
              DIVISI SPESIALISASI LSPD (TACTICAL DIVISIONS)
            </h2>
          </div>
          <span className="text-[10px] bg-slate-950 border border-slate-850 text-slate-500 px-2 py-0.5 rounded font-mono uppercase tracking-wider">
            6 Departemen Terdaftar
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {divisionConfigs.map((div) => {
            const members = registeredOfficers.filter((o) => o.division === div.id);
            const onDutyMembers = members.filter((o) => o.onDuty);
            const isMyDivision = currentOfficer?.division === div.id;
            const IconComponent = div.icon;

            return (
              <div
                key={div.id}
                className={`flex flex-col justify-between border rounded-lg overflow-hidden transition-all duration-300 bg-slate-950/20 hover:bg-slate-950/40 ${div.themeColor}`}
              >
                {/* Division Image Banner */}
                <div className="h-28 w-full relative overflow-hidden border-b border-slate-900/50">
                  <img 
                    src={div.image} 
                    alt={div.title}
                    className="w-full h-full object-cover brightness-[0.55] contrast-[1.05] hover:scale-105 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/45 to-transparent"></div>
                  
                  {/* Floating active count badge on top of image */}
                  <span className={`absolute top-2.5 right-2.5 text-[8.5px] font-mono font-bold uppercase border px-2 py-0.5 rounded backdrop-blur-sm ${div.tagColor}`}>
                    {onDutyMembers.length} Aktif / {members.length} Anggota
                  </span>
                </div>

                <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2.5">
                    <div className="flex items-center space-x-2">
                      <div className="p-1.5 bg-slate-950 border border-slate-850 rounded">
                        <IconComponent className="w-3.5 h-3.5 text-sky-400" />
                      </div>
                      <h3 className="text-xs font-bold text-slate-100 flex items-center gap-1.5 font-mono">
                        {div.title}
                        {isMyDivision && (
                          <span className="text-[7.5px] bg-emerald-950 border border-emerald-900 text-emerald-400 px-1.5 py-0.2 rounded uppercase font-bold tracking-wider animate-pulse">
                            ANDA
                          </span>
                        )}
                      </h3>
                    </div>

                    <div className="text-left font-mono">
                      <p className="text-[9px] text-sky-400 font-bold tracking-wide uppercase">
                        {div.slogan}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-2 leading-relaxed font-sans font-normal">
                        {div.description}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-950 flex flex-col gap-2 font-mono text-[9px]">
                    <div className="flex items-center justify-between text-slate-500">
                      <span>SPESIALISASI:</span>
                      <span className="text-slate-300 uppercase text-right truncate max-w-[170px]" title={div.spec}>
                        {div.spec}
                      </span>
                    </div>

                    {/* Roster list avatars */}
                    {members.length > 0 && (
                      <div className="flex items-center space-x-1.5 py-1">
                        <div className="flex -space-x-1.5 overflow-hidden">
                          {members.slice(0, 5).map((m) => (
                            <img
                              key={m.badgeNumber}
                              src={m.avatar && m.avatar.trim() !== "" ? m.avatar : "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100"}
                              alt={m.name}
                              className={`w-5 h-5 rounded-full border object-cover ${m.onDuty ? 'border-emerald-500 shadow-sm' : 'border-slate-800'}`}
                              title={`LSPD-${m.badgeNumber} ${m.name} [${m.onDuty ? 'ON DUTY' : 'OFF DUTY'}]`}
                              referrerPolicy="no-referrer"
                            />
                          ))}
                        </div>
                        <span className="text-[8px] text-slate-500 uppercase">
                          {members.length} Agen Terdaftar
                        </span>
                      </div>
                    )}

                    {!isGovernment && (
                      <button
                        onClick={() => {
                          if (currentOfficer) {
                            if (isMyDivision) {
                              updateOfficerDivision(currentOfficer.badgeNumber, undefined);
                            } else {
                              updateOfficerDivision(currentOfficer.badgeNumber, div.id as OfficerDivision);
                            }
                          } else {
                            alert('Anda harus masuk/login sebagai petugas terlebih dahulu!');
                          }
                        }}
                        className={`w-full py-1.5 rounded text-[9px] font-bold uppercase transition-all tracking-wider flex items-center justify-center gap-1 cursor-pointer border ${
                          isMyDivision
                            ? 'bg-rose-950/30 text-rose-450 border-rose-900/30 hover:bg-rose-900/20 hover:text-slate-100'
                            : 'bg-slate-955 text-slate-300 border-slate-850 hover:border-slate-750 hover:bg-slate-900'
                        }`}
                      >
                        <Shield className="w-3 h-3" />
                        <span>{isMyDivision ? 'KELUAR DIVISI' : 'GABUNG DIVISI'}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 2: PAPAN KINERJA ANGGOTA (OFFICER PERFORMANCE LEADERBOARD) */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 shadow-lg space-y-4">
        
        {/* Header with Search and Division filters */}
        <div className="border-b border-slate-800 pb-4 space-y-3">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="flex items-center space-x-2 text-left">
              <Award className="w-5 h-5 text-amber-500 animate-pulse" />
              <h2 className="text-sm font-bold font-mono text-slate-200 uppercase tracking-widest">
                PERINGKAT KEAKTIFAN ANGGOTA LSPD (LEADERBOARD)
              </h2>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 font-mono text-xs w-full lg:w-auto">
              {/* Search officer name/badge */}
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Cari badge / nama petugas..."
                  value={officerSearchQuery}
                  onChange={(e) => setOfficerSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-850 focus:border-rose-500 text-xs text-slate-100 rounded outline-none"
                />
              </div>

              {/* Division Select Filter */}
              <select
                value={selectedDivisionFilter}
                onChange={(e) => setSelectedDivisionFilter(e.target.value as 'ALL' | OfficerDivision)}
                className="bg-slate-955 border border-slate-850 text-slate-300 px-2.5 py-1.5 rounded text-xs outline-none cursor-pointer hover:border-slate-750"
              >
                <option value="ALL">Semua Divisi</option>
                {Object.values(OfficerDivision).map((divVal) => (
                  <option key={divVal} value={divVal}>{divVal.split('(')[0].trim()}</option>
                ))}
              </select>
            </div>
          </div>
          <p className="text-xs text-slate-400 font-sans leading-relaxed text-left">
            Peringkat keaktifan penegak hukum Los Santos berdasarkan akumulasi berkas penyelidikan, berita acara pemeriksaan (BAP), dan penindakan kriminalitas yang terbit di MDTerminal.
          </p>
        </div>

        {/* Leaderboard grid layout */}
        {filteredAndRankedOfficers.length === 0 ? (
          <div className="py-12 text-center border border-dashed border-slate-805 rounded font-mono">
            <Search className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-xs text-slate-400 font-semibold uppercase">Tidak ada petugas ditemukan</p>
            <p className="text-[10px] text-slate-550 mt-1">Gunakan kata kunci lain atau pilih filter divisi yang berbeda.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {filteredAndRankedOfficers.map((off, idx) => {
              // Determine Medal Styling based on rank index
              let medalBg = 'bg-slate-955/80 border-slate-850/60 text-slate-400';
              let medalText = `Rank #${idx + 1}`;

              if (idx === 0) {
                medalBg = 'bg-amber-550/10 border-amber-500/35 text-amber-400';
                medalText = '🏆 TERRAJIN #1';
              } else if (idx === 1) {
                medalBg = 'bg-slate-300/10 border-slate-300/30 text-slate-300';
                medalText = '🥈 AKTIF #2';
              } else if (idx === 2) {
                medalBg = 'bg-amber-700/10 border-amber-700/30 text-amber-600';
                medalText = '🥉 AKTIF #3';
              }

              return (
                <div 
                  key={off.badgeNumber}
                  className={`border rounded-lg p-3.5 flex flex-col justify-between hover:border-slate-700 transition-all hover:bg-slate-950/40 relative overflow-hidden group ${
                    idx === 0 ? 'ring-1 ring-amber-500/20 bg-amber-950/5' : 'bg-slate-955/40'
                  }`}
                >
                  {/* Background decorative rank number */}
                  <div className="absolute right-1 -bottom-4 text-[44px] font-bold font-mono text-slate-800/15 group-hover:text-slate-750/20 transition-all pointer-events-none select-none">
                    {idx + 1}
                  </div>

                  <div className="space-y-2.5">
                    {/* Badge & Avatar Header */}
                    <div className="flex items-center space-x-2 text-left">
                      <img
                        src={off.avatar && off.avatar.trim() !== '' ? off.avatar : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100'}
                        alt={off.name}
                        className="w-9 h-9 rounded border border-slate-800 object-cover shrink-0"
                        referrerPolicy="no-referrer"
                      />
                      <div className="min-w-0">
                        <h4 className="text-[11.5px] font-bold text-slate-200 truncate font-mono" title={off.name}>
                          {off.name}
                        </h4>
                        <p className="text-[9px] font-mono text-slate-500">
                          LSPD-{off.badgeNumber}
                        </p>
                      </div>
                    </div>

                    {/* Medal/Rank Indicator */}
                    <div className={`text-[8px] font-bold font-mono py-0.5 rounded text-center tracking-wider border ${medalBg}`}>
                      {medalText}
                    </div>

                    {/* Details row: Rank and division badge */}
                    <div className="text-left space-y-1">
                      <div className="text-[9.5px] font-mono text-slate-400 truncate">
                        Rank: <span className="text-slate-300 font-bold">{off.rank}</span>
                      </div>
                      <div className="text-[9px] font-mono text-slate-500 truncate flex items-center gap-1">
                        Divisi: 
                        {off.division ? (
                          <span className="text-sky-400 font-bold bg-sky-500/5 border border-sky-500/10 px-1 py-0.1 rounded text-[8px]">
                            {off.division.split('(')[0].trim()}
                          </span>
                        ) : (
                          <span className="text-slate-600">-</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-950 flex justify-between items-center font-mono">
                    <span className="text-[8.5px] text-slate-500 uppercase">LAPORAN BAP:</span>
                    <span className="text-xs font-black text-rose-400 flex items-center gap-0.5">
                      <FileText className="w-3.5 h-3.5 text-rose-500" />
                      {off.reportCount} Berkas
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
