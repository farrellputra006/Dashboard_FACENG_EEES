# Energy Equity - Project Control Dashboard

Komponen halaman Dashboard Enterprise yang interaktif, bersih, modern, dan responsif untuk **Energy Equity - Project Control**, dibangun menggunakan **React**, **Tailwind CSS**, **Lucide Icons**, dan **Recharts**.

---

## 🚀 Fitur & Struktur Implementasi

### 1. Struktur Layout Utama
- **Container Utama:** Full screen (`min-h-screen bg-slate-50 flex font-sans text-slate-800`).
- **Sidebar Kiri (`w-80 bg-slate-900 text-white`):**
  - **Header Logo:** Ikon segitiga geometris biru-cyan bercahaya di samping teks tebal **Energy Equity** dan sub-teks `PROJECT CONTROL`.
  - **Section Title:** "All Projects" dengan badge counter `5`.
  - **Project List Interaktif:**
    1. **Booster Gas Compressor 55 MMSCFD** (Active state dengan border biru muda menyala `border-blue-500 bg-slate-800/90` dan status `+3.63% Ahead` / toggleable).
    2. **KP-9 Flowline Construction** (`-6.15% Delayed`, Last update: 19 Aug 2025).
    3. **Pipeline Integrity Survey** (`On Track`, Last update: 18 Aug 2025).
    4. **CPF Facility Upgrade** (`On Track`, Last update: 17 Aug 2025).
    5. **Access Road Rehabilitation** (`Watchlist`, Last update: 16 Aug 2025).
  - **User Profile Footer:** Inisial `AR`, Andi Rahman, *Project Control Engineer*, tombol Settings dan Logout.

### 2. Area Konten Utama (`flex-1 p-8 overflow-y-auto`)
- **Top Bar:** Breadcrumb navigasi hierarki & search bar dengan ikon kaca pembesar.
- **Header Proyek:**
  - Judul `Booster Gas Compressor 55 MMSCFD — Dashboard`.
  - Sub-judul: "Selected project overview • Updated 29 Aug 2025, 14:30 WITA".
  - Badge hijau `• LIVE`, dropdown pilihan siklus (`Week: W-46`), dan tombol `Export PDF`.

### 3. Sistem Tab Navigasi (6 Tab Interaktif)
Didesain dengan button pill rounded border (`bg-slate-800 text-white` untuk tab aktif):
1. **Overview**
2. **S-Curve**
3. **Progress Summary** *(diletakkan persis setelah S-Curve)*
4. **Progress Detail**
5. **This Week Progress**
6. **Next Week Plan**

---

### 4. Detail Konten Tab

#### A. Tab `Overview`
- **3 Kartu KPI Utama:**
  1. Base Cost / Contract Value: **Rp 25,33 Miliar** (`↑ Budget Approved • Nilai Kontrak (IDR)`). Dilengkapi badge simbol **`Rp`** resmi (tanpa simbol dollar).
  2. Plan vs Actual (W-46): **89.82% / 93.45%** (`Actual 3.63% ahead of plan`).
  3. Deviation: **+3.63%** (`Ahead / On Track`).
- **4 Kartu Mini Breakdown Kategori:**
  - Engineering: Plan 2.54% | Act 2.54% | Dev 0.00%
  - Procurement: Plan 74.92% | Act 77.03% | Dev +2.10%
  - Construction: Plan 9.53% | Act 11.05% | Dev +1.53%
  - Commissioning: Plan 0.00% | Act 0.00% | Dev 0.00%
- *(Sesuai catatan spesifikasi: Tidak menampilkan Cost Breakdown bar atau tabel Progress Detail di tab ini).*

#### B. Tab `S-Curve`
- **Horizontal Summary Card:** Plan Cum: 89.82%, Actual Cum: 93.45%, Deviation: +3.63% (Ahead).
- **Diagram 1: S-Curve — Progress (Base Cost) W-46 (Recharts):**
  - Rentang sumbu X dari `W-28` sampai `W-46` (beserta garis proyeksi `W-47` s/d `W-50`).
  - Legend: `CUM PLAN PROGRESS` (Garis biru), `CUM ACTUAL PROGRESS` (Garis hijau solid tebal), `CUM FORECAST PROGRESS` (Garis merah putus-putus).
  - Anotasi penanda eksplisit pada titik `W-46 (29-Aug-25)`: Plan 89.82% & Actual 93.45%.
- **Diagram 2: Diagram Forecast — Completion & Lookahead Trajectory:**
  - Visualisasi proyeksi penyelesaian proyek dari titik *Cutoff Week 46* menuju *Commercial Operation Date (COD)*.
  - 4 Kartu KPI Forecast: **Estimated Completion Date (19 Sep 2025 / W-49 — 7 Hari Lebih Cepat)**, **SPI Index (1.040 Favorable)**, **Required Run-Rate (1.64%/minggu vs aktual 2.15%)**, dan **P80 Confidence Level (96.8%)**.
  - Multi-Scenario Sensitivity: Garis Baseline Plan (W-50), Verified Actual, Forecast Trend (Most Likely), Early Finish Target (W-49 / 100%), serta Conservative / Delay Risk (W-51).
  - Dilengkapi switcher interaktif: **Completion Trajectory (S-Curve Multi-Scenario)** dan **Weekly Required Velocity (%/minggu Bar Chart)**.
  - Kartu milestone lookahead: W-47 (*Mechanical Completion*), W-48 (*Pre-Commissioning*), W-49 (*RFSU & First Gas Target*), dan W-50 (*Contractual COD Target*).
- **Tabel Data S-Curve Horizontal:** Angka mingguan dari `W-28` sampai `W-46` untuk Plan, Actual, dan Variance.

#### C. Tab `Progress Summary`
- **Fitur Impor File Lokal & Akses Perangkat:**
  - **Tombol Impor File Lokal:** Membuka modal dialog untuk memilih atau *drag-and-drop* file spreadsheet dari komputer/perangkat lokal (`.xlsx`, `.xls`, `.csv`, atau `.json`).
  - **Parsing Engine Otomatis:** Membaca baris WBS, bobot (*Weight Factor*), progres minggu lalu (*Prev Week*), progres minggu berjalan (*This Week*), kumulatif (*Cumulative*), variansi, dan status pekerjaan secara otomatis.
  - **Pratinjau & Validasi Data Langsung:** Menampilkan ringkasan jumlah item WBS, total bobot, total plan, total actual, serta preview tabel sebelum data diterapkan ke dashboard.
  - **Download Template Excel / CSV:** Satu klik untuk mengunduh template spreadsheet resmi berformat rapi yang siap diisi oleh tim engineer / kontraktor.
  - **Riwayat File Lokal Tersimpan:** Menyimpan daftar file laporan mingguan yang pernah diakses untuk kemudahan beralih (*switch file*) secara instan.
  - **Indikator Sumber Data & Reset:** Menampilkan badge nama file lokal yang sedang aktif dan tombol *"Reset Baseline"* untuk kembali ke baseline asli Rev-02 kapan saja.
- **Tabel Eksekutif Summary Progress (W-46):** Kolom No, Item Description, Weight Factor, Previous Week, This Week, Cumulative, dan Variance yang terkalkulasi otomatis secara dinamis dari data file.
- **HSE Performance Summary Widget:** Total Manhours 186,056 hrs, This Week 13,064 hrs, LTA / Fatality: 0 (Zero Accident), 284 Safe Days.

#### D. Tab `Progress Detail`
- Tabel progres visual dengan dual progress bar (Plan marker vs Actual bar):
  - *Site Preparation* (100% | Completed | PT. Toha Sittah Energi)
  - *Piling & Foundations* (100% | Completed | PT. Karya Pancang Jaya)
  - *Piping Fabrication & Installation* (74.67% vs Plan 98.44% | Delayed | PT. Matra Engineering | Kendala: Welding repairs & generator broken)
  - *Field Instrument & Gas Metering* (94.90% | On Track | PT. Yokogawa Indonesia | Kendala: Delivery time long lead items)
  - *Electrical Works* (86.20% | Watchlist | PT. Dwi Tunggal Jaya Agung | All 12 pendant lights installed)
- Dilengkapi filter status (*ALL, Completed, Delayed, On Track, Watchlist*) dan pencarian live.

#### E. Tab `This Week Progress`
- **Daftar Aktivitas Mingguan (W-46: 23 - 29 Aug 2025):** 3 kartu kolom untuk *Engineering & QC*, *Procurement*, dan *Construction & HSE*.
- **Photo Documentation Grid:** 4 kartu galeri foto dokumentasi lapangan dengan timestamp, tag teknis, dan modal inspeksi gambar beresolusi tinggi saat diklik.

#### F. Tab `Next Week Plan`
- **Next Week Lookahead Plan (W-47: 30 Aug - 05 Sep 2025):**
  - Engineering, Procurement, dan Construction & HSE.
  - Dilengkapi interactive checklist toggle, level prioritas, Person-in-Charge (PIC), dan deadline.

---

## 🗄️ Arsitektur Database MySQL (Laravel Backend)

Proyek ini dilengkapi arsitektur backend Laravel 11/12 yang terintegrasi dengan MySQL secara presisi:

### 1. Daftar Migration & Skema Tabel (Berurutan)
1. [**`2025_01_01_000001_create_projects_table.php`**](file:///c:/Users/alifarel/OneDrive/Dokumen/Dashboard_FACENG%20EEES/database/migrations/2025_01_01_000001_create_projects_table.php): Data master proyek (kode proyek unik, nama proyek, kontraktor, nilai kontrak `decimal(18,2)`, mata uang `IDR`, tanggal mulai/selesai/cutoff, rencana/aktual kumulatif, deviasi, status).
2. [**`2025_01_01_000002_create_wbs_categories_table.php`**](file:///c:/Users/alifarel/OneDrive/Dokumen/Dashboard_FACENG%20EEES/database/migrations/2025_01_01_000002_create_wbs_categories_table.php): Rincian WBS (Preparation, Engineering, Procurement, Construction, Pre-Commissioning) dengan `foreignId('project_id')->constrained()->cascadeOnDelete()` dan `weight_factor decimal(6,2)`.
3. [**`2025_01_01_000003_create_s_curve_metrics_table.php`**](file:///c:/Users/alifarel/OneDrive/Dokumen/Dashboard_FACENG%20EEES/database/migrations/2025_01_01_000003_create_s_curve_metrics_table.php): Data runtun waktu mingguan S-Curve (W-28 s/d W-50) mencakup `cum_plan`, `cum_actual`, dan `cum_forecast`.
4. [**`2025_01_01_000004_create_subcontractor_packages_table.php`**](file:///c:/Users/alifarel/OneDrive/Dokumen/Dashboard_FACENG%20EEES/database/migrations/2025_01_01_000004_create_subcontractor_packages_table.php): Paket pekerjaan PO subkontraktor, deskripsi kerja, rencana penyelesaian, status badge, kendala, dan catatan.
5. [**`2025_01_01_000005_create_weekly_activities_table.php`**](file:///c:/Users/alifarel/OneDrive/Dokumen/Dashboard_FACENG%20EEES/database/migrations/2025_01_01_000005_create_weekly_activities_table.php): Log aktivitas mingguan terbagi atas tipe `this_week_actual` dan `next_week_plan` per disiplin (Engineering & QC, Procurement, Construction, HSE).
6. [**`2025_01_01_000006_create_progress_photos_table.php`**](file:///c:/Users/alifarel/OneDrive/Dokumen/Dashboard_FACENG%20EEES/database/migrations/2025_01_01_000006_create_progress_photos_table.php): Galeri foto dokumentasi lapangan berstempel waktu, lokasi, dan path media.
7. [**`2025_01_01_000007_create_hse_reports_table.php`**](file:///c:/Users/alifarel/OneDrive/Dokumen/Dashboard_FACENG%20EEES/database/migrations/2025_01_01_000007_create_hse_reports_table.php): Laporan metrik K3 / HSE (personil, manhours mingguan/kumulatif, zero accident, insiden, safety meeting).

### 2. Eloquent Models dengan Relasi Lengkap (`app/Models/`)
- [**`Project.php`**](file:///c:/Users/alifarel/OneDrive/Dokumen/Dashboard_FACENG%20EEES/app/Models/Project.php): `hasMany` ke `wbsCategories`, `sCurveMetrics`, `subcontractorPackages`, `weeklyActivities`, `progressPhotos`, dan `hseReports`.
- [**`WbsCategory.php`**](file:///c:/Users/alifarel/OneDrive/Dokumen/Dashboard_FACENG%20EEES/app/Models/WbsCategory.php): `belongsTo(Project::class)` & `hasMany(SubcontractorPackage::class)`.
- [**`SCurveMetric.php`**](file:///c:/Users/alifarel/OneDrive/Dokumen/Dashboard_FACENG%20EEES/app/Models/SCurveMetric.php): `belongsTo(Project::class)`.
- [**`SubcontractorPackage.php`**](file:///c:/Users/alifarel/OneDrive/Dokumen/Dashboard_FACENG%20EEES/app/Models/SubcontractorPackage.php): `belongsTo(Project::class)` & `belongsTo(WbsCategory::class)`.
- [**`WeeklyActivity.php`**](file:///c:/Users/alifarel/OneDrive/Dokumen/Dashboard_FACENG%20EEES/app/Models/WeeklyActivity.php): `belongsTo(Project::class)`.
- [**`ProgressPhoto.php`**](file:///c:/Users/alifarel/OneDrive/Dokumen/Dashboard_FACENG%20EEES/app/Models/ProgressPhoto.php): `belongsTo(Project::class)`.
- [**`HseReport.php`**](file:///c:/Users/alifarel/OneDrive/Dokumen/Dashboard_FACENG%20EEES/app/Models/HseReport.php): `belongsTo(Project::class)`.

### 3. Database Seeder Data Riil Proyek (`database/seeders/`)
- [**`ProjectControlSeeder.php`**](file:///c:/Users/alifarel/OneDrive/Dokumen/Dashboard_FACENG%20EEES/database/seeders/ProjectControlSeeder.php): Mengisi 5 data proyek Energy Equity Sengkang serta seluruh paket data relasional Project 1 (WBS Categories, S-Curve W-28 s/d W-50, 6 Paket Subkontraktor, Aktivitas W-46/W-47, Foto Dokumentasi, dan HSE Report 186.056 manhours zero accident).
- [**`DatabaseSeeder.php`**](file:///c:/Users/alifarel/OneDrive/Dokumen/Dashboard_FACENG%20EEES/database/seeders/DatabaseSeeder.php): Master seeder pemanggil `ProjectControlSeeder`.

### 4. Controller & Integrasi Frontend
- [**`DashboardController.php`**](file:///c:/Users/alifarel/OneDrive/Dokumen/Dashboard_FACENG%20EEES/app/Http/Controllers/DashboardController.php): Menyediakan endpoint `index()` dan `api()` dengan *eager loading* seluruh relasi anak dan otomatis mendeteksi format permintaan (JSON API atau Blade View).
- [**`routes/api.php`**](file:///c:/Users/alifarel/OneDrive/Dokumen/Dashboard_FACENG%20EEES/routes/api.php) & [**`routes/web.php`**](file:///c:/Users/alifarel/OneDrive/Dokumen/Dashboard_FACENG%20EEES/routes/web.php): Definisi routing API `/api/dashboard` dan view web.
- [**`src/App.jsx`**](file:///c:/Users/alifarel/OneDrive/Dokumen/Dashboard_FACENG%20EEES/src/App.jsx) & [**`src/utils/laravelAdapter.js`**](file:///c:/Users/alifarel/OneDrive/Dokumen/Dashboard_FACENG%20EEES/src/utils/laravelAdapter.js): Frontend React yang otomatis menyinkronkan data langsung dari MySQL database saat API aktif.

---

## 🛠️ Menjalankan Migration & Seeder di Laravel

```bash
# Jalankan migration untuk membuat tabel di MySQL
php artisan migrate

# Isi tabel dengan data riil Energy Equity Sengkang
php artisan db:seed --class=ProjectControlSeeder

# Menjalankan server backend Laravel
php artisan serve
```

Server lokal saat ini aktif di: **`http://localhost:5173/`**

