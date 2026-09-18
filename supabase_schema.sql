-- =========================================================================
-- LOS SANTOS POLICE DEPARTMENT (LSPD) - MOBILE DATA TERMINAL (MDT)
-- SUPABASE DATABASE SCHEMA CONFIGURATION (BULLETPROOF & INTEGRATED)
-- =========================================================================
-- Petunjuk Penggunaan:
-- 1. Salin seluruh isi berkas ini.
-- 2. Buka Dashboard Supabase Anda (https://supabase.com).
-- 3. Pilih Proyek Anda -> Masuk ke menu "SQL Editor" -> Klik "New Query".
-- 4. Tempel (paste) kode ini, lalu klik "Run".
-- =========================================================================

-- 1. EXTENSIONS (Opsional, jika diperlukan)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABEL: OFFICERS (Petugas)
CREATE TABLE IF NOT EXISTS public.officers (
    badge_number TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    rank TEXT NOT NULL,
    rank_level INTEGER NOT NULL DEFAULT 1,
    on_duty BOOLEAN NOT NULL DEFAULT FALSE,
    avatar TEXT,
    pin TEXT,
    division TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Mengaktifkan Row Level Security (RLS) di Supabase (Akses publik langsung agar terintegrasi sempurna)
ALTER TABLE public.officers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Akses Publik Officers" ON public.officers;
CREATE POLICY "Akses Publik Officers" ON public.officers FOR ALL USING (true) WITH CHECK (true);

-- 3. TABEL: CITIZENS (Warga Negara / Suspect)
CREATE TABLE IF NOT EXISTS public.citizens (
    id TEXT PRIMARY KEY, -- KTP / No Registrasi Warga
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    phone TEXT,
    dob TEXT NOT NULL, -- Diubah ke TEXT agar tidak ada kegagalan parsing format tanggal
    gender TEXT NOT NULL,
    license_drivers TEXT NOT NULL DEFAULT 'None',
    license_weapons TEXT NOT NULL DEFAULT 'None',
    license_ktp TEXT NOT NULL DEFAULT 'Active',
    avatar TEXT,
    is_wanted BOOLEAN NOT NULL DEFAULT FALSE,
    wanted_reason TEXT,
    notes TEXT,
    convictions TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.citizens ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Akses Publik Citizens" ON public.citizens;
CREATE POLICY "Akses Publik Citizens" ON public.citizens FOR ALL USING (true) WITH CHECK (true);

-- 4. TABEL: VEHICLES (Kendaraan)
CREATE TABLE IF NOT EXISTS public.vehicles (
    id TEXT PRIMARY KEY,
    plate TEXT NOT NULL UNIQUE,
    model TEXT NOT NULL,
    owner_name TEXT NOT NULL,
    owner_id TEXT, -- Dilepas dari REFERENCES untuk mencegah kegagalan jika relasi belum disinkronisasi
    color TEXT NOT NULL,
    is_stolen BOOLEAN NOT NULL DEFAULT FALSE,
    notes TEXT,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Akses Publik Vehicles" ON public.vehicles;
CREATE POLICY "Akses Publik Vehicles" ON public.vehicles FOR ALL USING (true) WITH CHECK (true);

-- 5. TABEL: PENAL_CODES (Pasal & Denda Hukum)
CREATE TABLE IF NOT EXISTS public.penal_codes (
    code TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    fine INTEGER NOT NULL DEFAULT 0,
    jail_time INTEGER NOT NULL DEFAULT 0,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.penal_codes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Akses Publik Penal Codes" ON public.penal_codes;
CREATE POLICY "Akses Publik Penal Codes" ON public.penal_codes FOR ALL USING (true) WITH CHECK (true);

-- 6. TABEL: CRIMINAL_REPORTS (Arsip Kasus Kriminal)
CREATE TABLE IF NOT EXISTS public.criminal_reports (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    suspect_id TEXT, -- Longgar tanpa REFERENCES demi kelancaran sync data
    suspect_name TEXT NOT NULL,
    officer_name TEXT NOT NULL,
    officer_badge TEXT, -- Longgar tanpa REFERENCES demi kelancaran sync data
    total_fine INTEGER NOT NULL DEFAULT 0,
    total_jail_time INTEGER NOT NULL DEFAULT 0,
    description TEXT,
    is_processed BOOLEAN NOT NULL DEFAULT FALSE,
    assisting_officers TEXT,
    image_url TEXT,
    status TEXT DEFAULT 'Selesai',
    type TEXT DEFAULT 'LSPD',
    reporter_name TEXT,
    charges_json JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.criminal_reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Akses Publik Criminal Reports" ON public.criminal_reports;
CREATE POLICY "Akses Publik Criminal Reports" ON public.criminal_reports FOR ALL USING (true) WITH CHECK (true);

-- 7. TABEL JUNCTION: REPORT_CHARGES (Pasal Terkait Laporan - Relasi Many-to-Many)
CREATE TABLE IF NOT EXISTS public.report_charges (
    id BIGSERIAL PRIMARY KEY,
    report_id TEXT,
    charge_code TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.report_charges ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Akses Publik Report Charges" ON public.report_charges;
CREATE POLICY "Akses Publik Report Charges" ON public.report_charges FOR ALL USING (true) WITH CHECK (true);

-- 8. TABEL: DETAINEES (Tahanan Sel)
CREATE TABLE IF NOT EXISTS public.detainees (
    id TEXT PRIMARY KEY,
    citizen_name TEXT NOT NULL,
    citizen_id TEXT, -- Longgar tanpa REFERENCES demi kelancaran sync data
    jail_time INTEGER NOT NULL,
    remaining_time INTEGER NOT NULL,
    fine INTEGER NOT NULL DEFAULT 0,
    cell_number TEXT NOT NULL,
    status TEXT DEFAULT 'Dalam Sel',
    date_arrested TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    arresting_officer TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.detainees ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Akses Publik Detainees" ON public.detainees;
CREATE POLICY "Akses Publik Detainees" ON public.detainees FOR ALL USING (true) WITH CHECK (true);

-- 9. TABEL: DISPATCH_CALLS (Panggilan Pusat Radio / Dispatch)
CREATE TABLE IF NOT EXISTS public.dispatch_calls (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    location TEXT NOT NULL,
    description TEXT,
    time TEXT NOT NULL,
    priority TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Aktif',
    responding_units TEXT[] NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.dispatch_calls ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Akses Publik Dispatch Calls" ON public.dispatch_calls;
CREATE POLICY "Akses Publik Dispatch Calls" ON public.dispatch_calls FOR ALL USING (true) WITH CHECK (true);

-- 10. TABEL: ATTENDANCE_RECORDS (Log Absensi Harian)
CREATE TABLE IF NOT EXISTS public.attendance_records (
    id TEXT PRIMARY KEY,
    badge_number TEXT, -- Diubah ke TEXT biasa untuk kelancaran integrasi
    name TEXT NOT NULL,
    rank TEXT NOT NULL,
    date TEXT NOT NULL, -- Diubah ke TEXT untuk kelancaran berbagai format string dari frontend
    duty_on_time TEXT NOT NULL, -- Diubah ke TEXT agar format waktu ber-titik '14.35.21' (id-ID) tidak gagal
    duty_off_time TEXT, -- Diubah ke TEXT agar format waktu ber-titik '14.35.21' (id-ID) tidak gagal
    status TEXT NOT NULL DEFAULT 'OFF-DUTY',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Akses Publik Attendance" ON public.attendance_records;
CREATE POLICY "Akses Publik Attendance" ON public.attendance_records FOR ALL USING (true) WITH CHECK (true);

-- 11. TABEL: DIGITAL_EVIDENCES (Barang Bukti)
CREATE TABLE IF NOT EXISTS public.digital_evidences (
    id TEXT PRIMARY KEY,
    case_id TEXT, -- Longgar tanpa REFERENCES
    case_title TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    tag TEXT NOT NULL,
    image_url TEXT,
    collected_by TEXT NOT NULL,
    collected_by_badge TEXT, -- Longgar tanpa REFERENCES
    date_collected TEXT NOT NULL, -- Diubah ke TEXT untuk mencegah parsing error
    serial_number TEXT,
    status TEXT NOT NULL DEFAULT 'Dalam Gudang',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.digital_evidences ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Akses Publik Digital Evidences" ON public.digital_evidences;
CREATE POLICY "Akses Publik Digital Evidences" ON public.digital_evidences FOR ALL USING (true) WITH CHECK (true);

-- 12. TABEL: ACTIVITY_LOGS (Log Audit & Aktivitas Sistem - Retensi Otomatis 7 Hari)
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id TEXT PRIMARY KEY,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    officer_name TEXT NOT NULL,
    officer_badge TEXT NOT NULL,
    action TEXT NOT NULL,
    module TEXT NOT NULL,
    description TEXT NOT NULL,
    details TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Akses Publik Activity Logs" ON public.activity_logs;
CREATE POLICY "Akses Publik Activity Logs" ON public.activity_logs FOR ALL USING (true) WITH CHECK (true);

-- =========================================================================
-- SEED DATA AWAL (OPSIONAL)
-- Anda dapat menjalankan seed ini untuk mengisi data dummy awal pada Supabase
-- =========================================================================

-- Seed Officers Awal
INSERT INTO public.officers (badge_number, name, rank, rank_level, on_duty, avatar, pin, division) VALUES
('01', 'Charles Davis', 'Chief of Police', 6, false, 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200', '1122', 'Public Administration'),
('05', 'Alice Miller', 'Lieutenant', 4, false, 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200', '1234', 'Criminal Investigation Bureau (CIB)'),
('21', 'Jack Bennett', 'Sergeant', 3, false, 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200', '0000', 'Patrol Traffic'),
('45', 'Sam Houston', 'Police Officer', 2, false, 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200', '4545', 'SWAT'),
('99', 'Emma Watson', 'Cadet', 1, false, 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200', '9999', 'Training & Recruitment (TRD)')
ON CONFLICT (badge_number) DO NOTHING;
