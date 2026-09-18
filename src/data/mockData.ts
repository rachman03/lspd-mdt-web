import { Citizen, Vehicle, Charge, CriminalReport, Detainee, DispatchCall, OfficerRank, DigitalEvidence } from '../types';

export const PENAL_CODE: Charge[] = [
  // Lalu Lintas
  { code: 'TR-01', title: 'Ngebut (Over-speeding)', category: 'Lalu Lintas', fine: 500, jailTime: 0, description: 'Mengemudi melebihi batas kecepatan jalan yang ditentukan.' },
  { code: 'TR-02', title: 'Menerobos Lampu Merah', category: 'Lalu Lintas', fine: 400, jailTime: 0, description: 'Mengabaikan rambu lalu lintas atau isyarat lampu merah.' },
  { code: 'TR-03', title: 'Mengemudi Tanpa Surat Izin (SIM)', category: 'Lalu Lintas', fine: 1000, jailTime: 0, description: 'Mengemudi kendaraan tanpa membawa atau memiliki SIM aktif.' },
  { code: 'TR-04', title: 'Mengemudi Di Bawah Pengaruh (DUI)', category: 'Lalu Lintas', fine: 2500, jailTime: 10, description: 'Mengemudi di bawah pengaruh alkohol atau obat-obatan terlarang.' },
  { code: 'TR-05', title: 'Balapan Liar', category: 'Lalu Lintas', fine: 5000, jailTime: 20, description: 'Mengorganisir atau mengikuti balapan jalanan ilegal.' },

  // Kejahatan Ringan
  { code: 'MS-01', title: 'Pelecehan / Gangguan Ketertiban', category: 'Kejahatan Ringan', fine: 850, jailTime: 5, description: 'Membuat keributan atau mengganggu kenyamanan publik.' },
  { code: 'MS-02', title: 'Vandalisme', category: 'Kejahatan Ringan', fine: 1500, jailTime: 10, description: 'Merusak properti umum atau pribadi secara sengaja.' },
  { code: 'MS-03', title: 'Pencurian Ringan (Kuping/Dompet)', category: 'Kejahatan Ringan', fine: 1200, jailTime: 15, description: 'Mengambil barang orang lain senilai di bawah $1,000.' },
  { code: 'MS-04', title: 'Kepemilikan Ganja Ringan (< 10g)', category: 'Kejahatan Ringan', fine: 1000, jailTime: 5, description: 'Membawa barang narkotika jenis ganja dalam jumlah kecil.' },
  { code: 'MS-05', title: 'Melawan Petugas (Resisting Arrest)', category: 'Kejahatan Ringan', fine: 1800, jailTime: 20, description: 'Menolak diamankan atau melawan secara verbal/fisik ringan saat penangkapan.' },

  // Kejahatan Berat
  { code: 'FL-01', title: 'Pencurian Kendaraan Bermotor (Curanmor)', category: 'Kejahatan Berat', fine: 4500, jailTime: 30, description: 'Mengambil secara paksa atau mencuri mobil/motor milik orang lain.' },
  { code: 'FL-02', title: 'Perampokan Toko / Bank', category: 'Kejahatan Berat', fine: 12000, jailTime: 60, description: 'Merampok dengan paksaan atau ancaman terhadap kasir atau institusi keuangan.' },
  { code: 'FL-03', title: 'Kepemilikan Senjata Api Ilegal', category: 'Kejahatan Berat', fine: 8500, jailTime: 45, description: 'Membawa senjata api api tanpa izin sah (Class-A/Tactical).' },
  { code: 'FL-04', title: 'Penyerangan dengan Senjata Mematikan', category: 'Kejahatan Berat', fine: 10000, jailTime: 50, description: 'Menyerang warga atau petugas menggunakan benda tumpul/tadjam/senpi.' },
  { code: 'FL-05', title: 'Makar / Terorisme', category: 'Kejahatan Berat', fine: 30000, jailTime: 120, description: 'Melakukan tindakan merusak fasilitas vital, pemboman, atau kudeta wilayah.' },
  { code: 'FL-06', title: 'Pembunuhan Tingkat Satu', category: 'Kejahatan Berat', fine: 25000, jailTime: 90, description: 'Merencanakan dan membunuh warga sipil atau aparat penegak hukum secara sengaja.' },
  { code: 'FL-07', title: 'Pengedaran Narkotika Skala Besar', category: 'Kejahatan Berat', fine: 15000, jailTime: 75, description: 'Menyimpan, memproses, atau mendistribusikan narkotika dalam jumlah besar.' }
];

export const MOCK_CITIZENS: Citizen[] = [
  {
    id: 'CTZ-9012',
    firstName: 'Michael',
    lastName: 'De Santa',
    phone: '555-0139',
    dob: '1968-12-14',
    gender: 'Laki-laki',
    licenseStatus: {
      drivers: 'Active',
      weapons: 'Active',
      ktp: 'None'
    },
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
    isWanted: false,
    convictions: ['Pencurian Ringan', 'Kepemilikan Senjata Api Ilegal'],
    notes: 'Terduga berafiliasi dengan aksi perampokan Bank di masa lalu. Berperilaku sopan namun patut dicurigai.'
  },
  {
    id: 'CTZ-3045',
    firstName: 'Franklin',
    lastName: 'Clinton',
    phone: '555-0156',
    dob: '1988-05-24',
    gender: 'Laki-laki',
    licenseStatus: {
      drivers: 'Active',
      weapons: 'Active',
      ktp: 'Active'
    },
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200',
    isWanted: false,
    convictions: ['Mengemudi Di Bawah Pengaruh (DUI)'],
    notes: 'Ahli mengemudi dan mekanik handal. Sering terlihat di daerah Chamberlain Hills.'
  },
  {
    id: 'CTZ-6666',
    firstName: 'Trevor',
    lastName: 'Philips',
    phone: '555-0199',
    dob: '1967-11-21',
    gender: 'Laki-laki',
    licenseStatus: {
      drivers: 'Suspended',
      weapons: 'Suspended',
      ktp: 'Suspended'
    },
    avatar: 'https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?auto=format&fit=crop&q=80&w=200',
    isWanted: true,
    wantedReason: 'Menyerang petugas LSPD, kepemilikan laboratorium meth ilegal, dan merusak fasilitas pangkalan militer.',
    convictions: ['Makar / Terorisme', 'Pengedaran Narkotika Skala Besar', 'Penyerangan dengan Senjata Mematikan'],
    notes: 'SANGAT BERBAHAYA. Jika terlihat, panggil bantuan SWAT segera. Tidak stabil secara emosional.'
  },
  {
    id: 'CTZ-1289',
    firstName: 'Lester',
    lastName: 'Crest',
    phone: '555-0144',
    dob: '1974-03-09',
    gender: 'Laki-laki',
    licenseStatus: {
      drivers: 'Active',
      weapons: 'None',
      ktp: 'None'
    },
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
    isWanted: false,
    convictions: [],
    notes: 'Disabilitas fisik. Jenius teknologi. Jarang keluar rumah, dicurigai sebagai dalang peretas sistem LSPD.'
  },
  {
    id: 'CTZ-4820',
    firstName: 'Tracey',
    lastName: 'De Santa',
    phone: '555-0210',
    dob: '1991-07-01',
    gender: 'Perempuan',
    licenseStatus: {
      drivers: 'Active',
      weapons: 'None',
      ktp: 'None'
    },
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200',
    isWanted: false,
    convictions: ['Pelecehan / Gangguan Ketertiban'],
    notes: 'Anak perempuan Michael De Santa, sering terlibat kasus perselisihan di kelab malam Vinewood.'
  },
  {
    id: 'CTZ-1111',
    firstName: 'Jimmy',
    lastName: 'De Santa',
    phone: '555-0182',
    dob: '1993-02-12',
    gender: 'Laki-laki',
    licenseStatus: {
      drivers: 'Suspended',
      weapons: 'None',
      ktp: 'None'
    },
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=200',
    isWanted: false,
    convictions: ['Kepemilikan Ganja Ringan (< 10g)'],
    notes: 'Sering membeli narkoba di bawah umur. Mengemudi mobil ayahnya tanpa izin.'
  }
];

export const MOCK_VEHICLES: Vehicle[] = [
  { id: 'VEH-01', plate: '83LSPD01', model: 'Vapid Stanier (Interceptor)', ownerName: 'LSPD Command', ownerId: 'DEPT-1', color: 'Hitam/Putih', isStolen: false, notes: 'Kendaraan dinas patroli K9 LSPD.' },
  { id: 'VEH-02', plate: 'DESTA01', model: 'Obey Tailgater', ownerName: 'Michael De Santa', ownerId: 'CTZ-9012', color: 'Abu-abu Metalik', isStolen: false, notes: 'Kendaraan harian Michael.' },
  { id: 'VEH-03', plate: 'BUFFALO2', model: 'Bravado Buffalo S', ownerName: 'Franklin Clinton', ownerId: 'CTZ-3045', color: 'Putih', isStolen: false, notes: 'Kendaraan Franklin dengan modifikasi mesin tinggi.' },
  { id: 'VEH-04', plate: 'TP1STOLN', model: 'Canis Bodhi', ownerName: 'Trevor Philips', ownerId: 'CTZ-6666', color: 'Merah Karat', isStolen: false, notes: 'Truk off-road berkarat. Tercium bau bensin menyengat.' },
  { id: 'VEH-05', plate: 'VINEWD99', model: 'Pegassi Zentorno', ownerName: 'Unknown', ownerId: 'UNKNOWN', color: 'Kuning Neon', isStolen: true, notes: 'Dilaporkan dicuri dari depan Hotel Richman Resort.' }
];

export const MOCK_DETAINEES: Detainee[] = [
  {
    id: 'DET-101',
    citizenName: 'Jimmy De Santa',
    citizenId: 'CTZ-1111',
    jailTime: 10,
    remainingTime: 600, // 600 seconds for visual simulation
    fine: 1500,
    cellNumber: 'Sel B-3',
    status: 'Dalam Sel',
    dateArrested: '2026-06-18T22:30:00Z',
    arrestingOfficer: 'Sgt. J. Kowalski'
  },
  {
    id: 'DET-102',
    citizenName: 'Tracey De Santa',
    citizenId: 'CTZ-4820',
    jailTime: 5,
    remainingTime: 300,
    fine: 850,
    cellNumber: 'Ruang Interogasi A',
    status: 'Interogasi',
    dateArrested: '2026-06-18T23:15:00Z',
    arrestingOfficer: 'Ofc. Davis'
  }
];

export const MOCK_REPORTS: CriminalReport[] = [
  {
    id: 'REP-02',
    title: 'Penangkapan Jimmy De Santa atas Kepemilikan Ganja',
    date: '2026-06-18T22:30:00Z',
    suspectId: 'CTZ-1111',
    suspectName: 'Jimmy De Santa',
    officerName: 'Sgt. Kowalski',
    officerBadge: 'K9-30',
    charges: [
      { code: 'MS-04', title: 'Kepemilikan Ganja Ringan (< 10g)', category: 'Kejahatan Ringan', fine: 1000, jailTime: 5, description: 'Membawa ganja kering di jok motor.' },
      { code: 'MS-05', title: 'Melawan Petugas (Resisting)', category: 'Kejahatan Ringan', fine: 500, jailTime: 5, description: 'Menolak diborgol dan mencoba bersilat lidah.' }
    ],
    totalFine: 1500,
    totalJailTime: 10,
    description: 'Tersangka terjaring razia K9 di Vespucci Beach. Menunjukkan gerak-gerik mencurigakan, setelah digeledah ditemukan 5 gram narkotika golongan 1 (ganja). Sempat membantah dan mendorong petugas sebelum akhirnya berhasil diamankan ke dalam mobil patroli.',
    isProcessed: true
  },
  {
    id: 'REP-01',
    title: 'Pelanggaran Lalu Lintas Berat - Franklin Clinton',
    date: '2026-06-17T14:10:00Z',
    suspectId: 'CTZ-3045',
    suspectName: 'Franklin Clinton',
    officerName: 'Ofc. Davis',
    officerBadge: 'PD-442',
    charges: [
      { code: 'TR-01', title: 'Ngebut (Over-speeding)', category: 'Lalu Lintas', fine: 500, jailTime: 0, description: 'Melebihi batas kecepatan jalan raya.' },
      { code: 'TR-04', title: 'Mengemudi Di Bawah Pengaruh (DUI)', category: 'Lalu Lintas', fine: 2500, jailTime: 10, description: 'Mengemudi kendaraan roda empat dengan kadar alkohol terlampau tinggi.' }
    ],
    totalFine: 3000,
    totalJailTime: 10,
    description: 'Terdeteksi speed radar melaju 130mph di daerah Vinewood Boulevard. Saat dihentikan pelaku berbau bir kental dan tes breathalyzer menunjukkan angka 0.18%. SIM ditangguhkan sementara dan mobil disita ke impound LSPD.',
    isProcessed: true
  }
];

export const MOCK_DISPATCH: DispatchCall[] = [
  {
    id: 'DSP-01',
    title: 'Tembakan Teror di Ammu-Nation',
    location: 'Pillbox Hill Ammu-Nation',
    description: 'Panggilan 911 melaporkan terdengar rentetan senjata otomatis di dalam toko senjata. Pelaku berbaju loreng militer.',
    time: '23:54',
    priority: 'Kritis',
    status: 'Aktif',
    respondingUnits: []
  },
  {
    id: 'DSP-02',
    title: 'Pencurian Toko Kelontong 24/7',
    location: 'Strawberry Avenue',
    description: 'Kasir melaporkan pria bertopeng badut mengancam menggunakan pisau lipat meminta uang kas.',
    time: '23:48',
    priority: 'Tinggi',
    status: 'Merespon',
    respondingUnits: ['PD-442', 'K9-30']
  },
  {
    id: 'DSP-03',
    title: 'Kendaraan Parkir Liar',
    location: 'Del Perro Pier',
    description: 'Mobil sport Zentorno terparkir melintang menghalangi akses jalan pejalan kaki.',
    time: '23:20',
    priority: 'Rendah',
    status: 'Aktif',
    respondingUnits: []
  }
];

export const MOCK_EVIDENCES: DigitalEvidence[] = [
  {
    id: 'EVI-4091',
    caseId: 'REP-02',
    caseTitle: 'Penangkapan Jimmy De Santa atas Kepemilikan Ganja',
    title: 'Ganja Kering (Marijuana Bag)',
    description: 'Bahan narkotika jenis ganja seberat 5.8 gram dikemas dalam klip plastik transparan. Ditemukan di dalam jok motor milik tersangka.',
    tag: 'Narcotics',
    imageUrl: 'https://images.unsplash.com/photo-1533240332313-0db49b439ad3?auto=format&fit=crop&q=80&w=300',
    collectedBy: 'Jack Bennett',
    collectedByBadge: '21',
    dateCollected: '2026-06-18T22:35:00Z',
    status: 'Dalam Gudang'
  },
  {
    id: 'EVI-8842',
    caseId: 'REP-02',
    caseTitle: 'Penangkapan Jimmy De Santa atas Kepemilikan Ganja',
    title: 'Kertas Linting & Pemantik (Rolling Paper)',
    description: 'Dua bungkus kertas linting merk RAW beserta satu buah pemantik gas berwarna hijau, disita dari saku celana kanan depan tersangka.',
    tag: 'Other',
    collectedBy: 'Jack Bennett',
    collectedByBadge: '21',
    dateCollected: '2026-06-18T22:36:00Z',
    status: 'Uji Lab'
  }
];

