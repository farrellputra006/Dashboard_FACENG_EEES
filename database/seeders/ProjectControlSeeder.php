<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Project;
use App\Models\ProjectWeeklyMetric;
use App\Models\WbsCategory;
use App\Models\SCurveMetric;
use App\Models\SubcontractorPackage;
use App\Models\WeeklyActivity;
use App\Models\ProgressPhoto;
use App\Models\HseReport;
use App\Models\NextWeekPlan;
use App\Models\ProjectDocument;
use App\Models\ProjectSchedule;
use App\Models\ScheduleWeeklyProgress;
use App\Http\Controllers\ProjectScheduleController;

class ProjectControlSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // =========================================================================
        // 1. MASTER PROJECTS DEFINITION
        // =========================================================================
        $projectsData = [
            [
                'project_code' => 'GBKB-55',
                'project_name' => 'Booster Gas Compressor 55 MMSCFD',
                'location' => 'Kampung Baru, Wajo, South Sulawesi',
                'contractor_name' => 'PT Triguna Internusa Pratama',
                'contract_value' => 25330000000.00, // Rp 25.33 Miliar
                'currency' => 'IDR',
                'start_date' => '2024-10-15',
                'end_date' => '2025-10-31',
                'current_week' => 'Week 12',
                'cutoff_date' => '2025-08-29',
                'plan_cumulative' => 89.82,
                'actual_cumulative' => 93.45,
                'deviation' => 3.63,
                'status' => 'Ahead',
            ],
            [
                'project_code' => 'KP9-FL',
                'project_name' => 'KP-9 Flowline Construction',
                'location' => 'Sengkang Gas Field, Wajo',
                'contractor_name' => 'PT Meindo Elang Indah',
                'contract_value' => 25330000000.00,
                'currency' => 'IDR',
                'start_date' => '2025-01-10',
                'end_date' => '2025-11-30',
                'current_week' => 'Week 12',
                'cutoff_date' => '2025-08-29',
                'plan_cumulative' => 92.40,
                'actual_cumulative' => 86.20,
                'deviation' => -6.15,
                'status' => 'Delayed',
            ],
            [
                'project_code' => 'PIS-03',
                'project_name' => 'Pipeline Integrity Survey',
                'location' => 'Offshore & Main Trunkline Sengkang',
                'contractor_name' => 'PT Radiant Utama Interinsco',
                'contract_value' => 8650000000.00,
                'currency' => 'IDR',
                'start_date' => '2025-03-01',
                'end_date' => '2025-10-15',
                'current_week' => 'Week 12',
                'cutoff_date' => '2025-08-29',
                'plan_cumulative' => 45.00,
                'actual_cumulative' => 45.50,
                'deviation' => 0.50,
                'status' => 'On Track',
            ],
            [
                'project_code' => 'CPF-04',
                'project_name' => 'CPF Facility Upgrade',
                'location' => 'Central Processing Facility, Kampung Baru',
                'contractor_name' => 'PT Timas Suplindo',
                'contract_value' => 32100000000.00,
                'currency' => 'IDR',
                'start_date' => '2024-11-01',
                'end_date' => '2025-12-15',
                'current_week' => 'Week 12',
                'cutoff_date' => '2025-08-29',
                'plan_cumulative' => 61.20,
                'actual_cumulative' => 62.00,
                'deviation' => 0.80,
                'status' => 'On Track',
            ],
            [
                'project_code' => 'ARR-05',
                'project_name' => 'Access Road Rehabilitation',
                'location' => 'Field Access Corridors, Gilireng',
                'contractor_name' => 'PT Waskita Karya',
                'contract_value' => 4200000000.00,
                'currency' => 'IDR',
                'start_date' => '2025-02-15',
                'end_date' => '2025-09-30',
                'current_week' => 'Week 12',
                'cutoff_date' => '2025-08-29',
                'plan_cumulative' => 88.00,
                'actual_cumulative' => 84.50,
                'deviation' => -3.50,
                'status' => 'Watchlist',
            ],
        ];

        $projects = [];
        foreach ($projectsData as $pData) {
            $projects[$pData['project_code']] = Project::updateOrCreate(
                ['project_code' => $pData['project_code']],
                $pData
            );
        }

        // =========================================================================
        // 2. MULTI-WEEK DATA PER PROJECT (Week 10, Week 11, Week 12)
        // =========================================================================

        $weeksConfig = [
            'Week 10' => [
                'number' => 10,
                'cutoff' => '2025-08-15',
                'GBKB-55' => ['plan' => 81.20, 'actual' => 79.50, 'dev' => -1.70, 'status' => 'Delayed', 'safe_hours' => 160000, 'manhours' => 12400],
                'KP9-FL'  => ['plan' => 80.00, 'actual' => 78.50, 'dev' => -1.50, 'status' => 'On Track', 'safe_hours' => 140000, 'manhours' => 11000],
                'PIS-03'  => ['plan' => 35.00, 'actual' => 34.80, 'dev' => -0.20, 'status' => 'On Track', 'safe_hours' => 95000, 'manhours' => 7500],
                'CPF-04'  => ['plan' => 52.00, 'actual' => 50.50, 'dev' => -1.50, 'status' => 'Watchlist', 'safe_hours' => 210000, 'manhours' => 14500],
                'ARR-05'  => ['plan' => 75.00, 'actual' => 76.00, 'dev' => 1.00, 'status' => 'Ahead', 'safe_hours' => 70000, 'manhours' => 5500],
            ],
            'Week 11' => [
                'number' => 11,
                'cutoff' => '2025-08-22',
                'GBKB-55' => ['plan' => 85.50, 'actual' => 86.80, 'dev' => 1.30, 'status' => 'Ahead', 'safe_hours' => 173000, 'manhours' => 13000],
                'KP9-FL'  => ['plan' => 86.20, 'actual' => 82.10, 'dev' => -4.10, 'status' => 'Delayed', 'safe_hours' => 151000, 'manhours' => 11000],
                'PIS-03'  => ['plan' => 40.00, 'actual' => 40.50, 'dev' => 0.50, 'status' => 'On Track', 'safe_hours' => 102500, 'manhours' => 7500],
                'CPF-04'  => ['plan' => 56.50, 'actual' => 57.00, 'dev' => 0.50, 'status' => 'On Track', 'safe_hours' => 224500, 'manhours' => 14500],
                'ARR-05'  => ['plan' => 82.00, 'actual' => 80.00, 'dev' => -2.00, 'status' => 'Watchlist', 'safe_hours' => 75500, 'manhours' => 5500],
            ],
            'Week 12' => [
                'number' => 12,
                'cutoff' => '2025-08-29',
                'GBKB-55' => ['plan' => 89.82, 'actual' => 93.45, 'dev' => 3.63, 'status' => 'Ahead', 'safe_hours' => 186056, 'manhours' => 13064],
                'KP9-FL'  => ['plan' => 92.40, 'actual' => 86.20, 'dev' => -6.15, 'status' => 'Delayed', 'safe_hours' => 162000, 'manhours' => 11000],
                'PIS-03'  => ['plan' => 45.00, 'actual' => 45.50, 'dev' => 0.50, 'status' => 'On Track', 'safe_hours' => 110000, 'manhours' => 7500],
                'CPF-04'  => ['plan' => 61.20, 'actual' => 62.00, 'dev' => 0.80, 'status' => 'On Track', 'safe_hours' => 239000, 'manhours' => 14500],
                'ARR-05'  => ['plan' => 88.00, 'actual' => 84.50, 'dev' => -3.50, 'status' => 'Watchlist', 'safe_hours' => 81000, 'manhours' => 5500],
            ],
        ];

        foreach ($projects as $code => $project) {
            foreach ($weeksConfig as $weekLabel => $wConfig) {
                $stat = $wConfig[$code];

                // 2A. Seed project_weekly_metrics
                ProjectWeeklyMetric::updateOrCreate(
                    [
                        'project_id' => $project->id,
                        'week_label' => $weekLabel,
                    ],
                    [
                        'week_number' => $wConfig['number'],
                        'cutoff_date' => $wConfig['cutoff'],
                        'plan_cumulative' => $stat['plan'],
                        'actual_cumulative' => $stat['actual'],
                        'deviation' => $stat['dev'],
                        'status' => $stat['status'],
                        'highlights' => "Snapshot progress {$project->project_name} pada {$weekLabel} dengan deviasi {$stat['dev']}%.",
                    ]
                );

                // 2B. Seed HSE Report for this week
                HseReport::updateOrCreate(
                    [
                        'project_id' => $project->id,
                        'week_label' => $weekLabel,
                    ],
                    [
                        'total_personnel' => 175 + $wConfig['number'],
                        'period_manhours' => $stat['manhours'],
                        'cumulative_manhours' => $stat['safe_hours'],
                        'near_miss' => 0,
                        'first_aid' => 0,
                        'mtc' => 0,
                        'lta' => 0,
                        'fatality' => 0,
                        'oil_spill' => 0,
                        'gas_leaks' => 0,
                        'safety_induction' => 30 + ($wConfig['number'] * 2),
                        'toolbox_meeting' => 12 + ($wConfig['number'] - 10),
                        'safety_inspection' => 6,
                    ]
                );
            }
        }

        // =========================================================================
        // 3. SEED WBS CATEGORIES PER WEEK (Project 1: GBKB-55)
        // =========================================================================
        $project1 = $projects['GBKB-55'];

        $wbsTemplates = [
            'Week 10' => [
                ['A', 'PREPARATION', 3.06, 3.06, 3.06, 0.00, 0.00, 3.06, 3.06, 0.00, 1],
                ['B.1', 'ENGINEERING', 2.54, 2.54, 2.54, 0.00, 0.00, 2.54, 2.54, 0.00, 2],
                ['B.2', 'PROCUREMENT', 77.85, 68.00, 66.50, 2.50, 2.20, 70.50, 68.70, -1.80, 3],
                ['B.3', 'CONSTRUCTION', 15.17, 5.00, 5.10, 0.10, 0.10, 5.10, 5.20, 0.10, 4],
                ['B.4', 'PRE-COMMISSIONING & START UP', 1.37, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 5],
            ],
            'Week 11' => [
                ['A', 'PREPARATION', 3.06, 3.06, 3.06, 0.00, 0.00, 3.06, 3.06, 0.00, 1],
                ['B.1', 'ENGINEERING', 2.54, 2.54, 2.54, 0.00, 0.00, 2.54, 2.54, 0.00, 2],
                ['B.2', 'PROCUREMENT', 77.85, 70.50, 68.70, 2.00, 3.40, 72.50, 72.10, -0.40, 3],
                ['B.3', 'CONSTRUCTION', 15.17, 6.80, 7.50, 0.60, 1.60, 7.40, 9.10, 1.70, 4],
                ['B.4', 'PRE-COMMISSIONING & START UP', 1.37, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 5],
            ],
            'Week 12' => [
                ['A', 'PREPARATION', 3.06, 3.06, 3.06, 0.00, 0.00, 3.06, 3.06, 0.00, 1],
                ['B.1', 'ENGINEERING', 2.54, 2.54, 2.54, 0.00, 0.00, 2.54, 2.54, 0.00, 2],
                ['B.2', 'PROCUREMENT', 77.85, 74.45, 76.28, 0.47, 0.75, 74.92, 77.03, 2.11, 3],
                ['B.3', 'CONSTRUCTION', 15.17, 9.06, 10.32, 0.47, 0.73, 9.53, 11.05, 1.52, 4],
                ['B.4', 'PRE-COMMISSIONING & START UP', 1.37, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 5],
            ],
        ];

        foreach ($wbsTemplates as $weekLabel => $categories) {
            foreach ($categories as $cat) {
                WbsCategory::updateOrCreate(
                    [
                        'project_id' => $project1->id,
                        'week_label' => $weekLabel,
                        'code' => $cat[0],
                    ],
                    [
                        'name' => $cat[1],
                        'weight_factor' => $cat[2],
                        'prev_week_plan' => $cat[3],
                        'prev_week_actual' => $cat[4],
                        'this_week_plan' => $cat[5],
                        'this_week_actual' => $cat[6],
                        'cum_plan' => $cat[7],
                        'cum_actual' => $cat[8],
                        'variance' => $cat[9],
                        'sort_order' => $cat[10],
                    ]
                );
            }
        }

        // Juga seed WBS untuk 4 project lainnya
        foreach (['KP9-FL', 'PIS-03', 'CPF-04', 'ARR-05'] as $otherCode) {
            $otherProj = $projects[$otherCode];
            foreach ($wbsTemplates as $weekLabel => $categories) {
                $stat = $weeksConfig[$weekLabel][$otherCode];
                $scale = $stat['actual'] / 93.45;

                foreach ($categories as $cat) {
                    WbsCategory::updateOrCreate(
                        [
                            'project_id' => $otherProj->id,
                            'week_label' => $weekLabel,
                            'code' => $cat[0],
                        ],
                        [
                            'name' => $cat[1],
                            'weight_factor' => $cat[2],
                            'prev_week_plan' => round($cat[3] * $scale, 2),
                            'prev_week_actual' => round($cat[4] * $scale, 2),
                            'this_week_plan' => round($cat[5] * $scale, 2),
                            'this_week_actual' => round($cat[6] * $scale, 2),
                            'cum_plan' => round($cat[7] * $scale, 2),
                            'cum_actual' => round($cat[8] * $scale, 2),
                            'variance' => round(($cat[8] - $cat[7]) * $scale, 2),
                            'sort_order' => $cat[10],
                        ]
                    );
                }
            }
        }

        // =========================================================================
        // 4. SEED SUBCONTRACTOR PACKAGES PER WEEK (Project 1: GBKB-55)
        // =========================================================================
        $packagesTemplate = [
            'Week 10' => [
                [1, 'Civil Foundation for Gas Compressor Bay A & B', 'PT Rekayasa Industri', 'PO-2024-001', 'Aug 2025', 'Pengecoran beton pedestal compressor 70%', 75.00, 70.00, 'Delayed', 'Keterlambatan semen curah'],
                [2, 'Compressor Shelter Structural Steel Erection', 'PT Bukaka Teknik Utama', 'PO-2024-002', 'Sep 2025', 'Erection kolom baja shelter 65%', 70.00, 65.00, 'Delayed', null],
                [3, 'Pipe Rack & Pipe Support Fabrication/Installation', 'PT Citra Panji Manunggal', 'PO-2024-003', 'Aug 2025', 'Fit up spool pipa dan support 80%', 85.00, 80.00, 'Delayed', null],
                [4, 'Underground Piping & Cable Trench Installation', 'PT Waskita Karya', 'PO-2024-004', 'Jul 2025', 'Galian parit dan proteksi kabel 90%', 95.00, 90.00, 'Delayed', null],
                [5, 'Electrical & Instrumentation Bulk Installation', 'PT Siemens Indonesia', 'PO-2024-005', 'Sep 2025', 'Pulling kabel instrument awal 50%', 55.00, 50.00, 'Delayed', null],
                [6, 'Heavy Equipment Lifting & Skidding Operation', 'PT Sanggar Sarana Baja', 'PO-2024-006', 'Aug 2025', 'Persiapan landasan hydraulic skidding 60%', 65.00, 60.00, 'On Track', null],
                [7, 'Non-Destructive Testing (NDT) & Radiography', 'PT Radiant Utama Interinsco', 'PO-2024-007', 'Oct 2025', 'Inspeksi las pipa 100 joint', 85.00, 82.00, 'On Track', null],
                [8, 'Painting & Protective Coating Field Application', 'PT Hempel Indonesia', 'PO-2024-008', 'Oct 2025', 'Sandblasting & primer coat 40%', 45.00, 40.00, 'On Track', null],
                [9, 'Fire & Gas Detection System Integration', 'PT Honeywell Indonesia', 'PO-2024-009', 'Sep 2025', 'Wiring junction box F&G 55%', 60.00, 55.00, 'On Track', null],
                [10, 'Pre-commissioning Line Flushing & Hydrotest', 'PT Elnusa Tbk', 'PO-2024-010', 'Oct 2025', 'Persiapan paket test loop', 15.00, 15.00, 'On Track', null],
                [11, 'General Site Cleaning, Grading & Road Finishing', 'Local Contractors (Wajo)', 'PO-2024-011', 'Oct 2025', 'Pembersihan material sisa galian', 60.00, 60.00, 'On Track', null],
            ],
            'Week 11' => [
                [1, 'Civil Foundation for Gas Compressor Bay A & B', 'PT Rekayasa Industri', 'PO-2024-001', 'Aug 2025', 'Curing beton pedestal selesai, siap unit', 85.00, 85.00, 'On Track', null],
                [2, 'Compressor Shelter Structural Steel Erection', 'PT Bukaka Teknik Utama', 'PO-2024-002', 'Sep 2025', 'Rafter shelter terpasang, baut kencang', 82.00, 80.00, 'On Track', null],
                [3, 'Pipe Rack & Pipe Support Fabrication/Installation', 'PT Citra Panji Manunggal', 'PO-2024-003', 'Aug 2025', 'Pengelasan header utama 92%', 90.00, 92.00, 'Ahead', null],
                [4, 'Underground Piping & Cable Trench Installation', 'PT Waskita Karya', 'PO-2024-004', 'Jul 2025', 'Pemasangan penutup parit beton 98%', 98.00, 98.00, 'On Track', null],
                [5, 'Electrical & Instrumentation Bulk Installation', 'PT Siemens Indonesia', 'PO-2024-005', 'Sep 2025', 'Terminasi kabel panel CCR 70%', 65.00, 70.00, 'Ahead', null],
                [6, 'Heavy Equipment Lifting & Skidding Operation', 'PT Sanggar Sarana Baja', 'PO-2024-006', 'Aug 2025', 'Skidding GEC#1 sukses ke pondasi', 75.00, 80.00, 'Ahead', null],
                [7, 'Non-Destructive Testing (NDT) & Radiography', 'PT Radiant Utama Interinsco', 'PO-2024-007', 'Oct 2025', 'NDT sambungan pipa 92% lolos uji', 90.00, 92.00, 'Ahead', null],
                [8, 'Painting & Protective Coating Field Application', 'PT Hempel Indonesia', 'PO-2024-008', 'Oct 2025', 'Coating sambungan las lapangan 60%', 55.00, 60.00, 'Ahead', null],
                [9, 'Fire & Gas Detection System Integration', 'PT Honeywell Indonesia', 'PO-2024-009', 'Sep 2025', 'Sensor gas terpasang di Bay #1-#3', 70.00, 72.00, 'Ahead', null],
                [10, 'Pre-commissioning Line Flushing & Hydrotest', 'PT Elnusa Tbk', 'PO-2024-010', 'Oct 2025', 'Flushing paket pipa gas inlet', 25.00, 25.00, 'On Track', null],
                [11, 'General Site Cleaning, Grading & Road Finishing', 'Local Contractors (Wajo)', 'PO-2024-011', 'Oct 2025', 'Perataan akses jalan staging area', 75.00, 75.00, 'On Track', null],
            ],
            'Week 12' => [
                [1, 'Civil Foundation for Gas Compressor Bay A & B', 'PT Rekayasa Industri', 'PO-2024-001', 'Aug 2025', 'Semua pondasi kompresor 100% selesai', 100.00, 100.00, 'Completed', null],
                [2, 'Compressor Shelter Structural Steel Erection', 'PT Bukaka Teknik Utama', 'PO-2024-002', 'Sep 2025', 'Semua tiang dan atap shelter 100% terpasang', 100.00, 100.00, 'Completed', null],
                [3, 'Pipe Rack & Pipe Support Fabrication/Installation', 'PT Citra Panji Manunggal', 'PO-2024-003', 'Aug 2025', 'Erection pipa gas header 100% tuntas', 100.00, 100.00, 'Completed', null],
                [4, 'Underground Piping & Cable Trench Installation', 'PT Waskita Karya', 'PO-2024-004', 'Jul 2025', 'Pekerjaan parit kabel bawah tanah selesai', 100.00, 100.00, 'Completed', null],
                [5, 'Electrical & Instrumentation Bulk Installation', 'PT Siemens Indonesia', 'PO-2024-005', 'Sep 2025', 'Pemasangan kabel tray & MCC Panel CCR', 82.00, 88.00, 'Ahead', null],
                [6, 'Heavy Equipment Lifting & Skidding Operation', 'PT Sanggar Sarana Baja', 'PO-2024-006', 'Aug 2025', 'Skidding GEC#2 ke pondasi permanen selesai', 85.00, 95.00, 'Ahead', null],
                [7, 'Non-Destructive Testing (NDT) & Radiography', 'PT Radiant Utama Interinsco', 'PO-2024-007', 'Oct 2025', 'NDT 100% lolos tanpa repair defect', 95.00, 98.00, 'Ahead', null],
                [8, 'Painting & Protective Coating Field Application', 'PT Hempel Indonesia', 'PO-2024-008', 'Oct 2025', 'Aplikasi cat finish coat warna abu-abu', 75.00, 78.00, 'Ahead', null],
                [9, 'Fire & Gas Detection System Integration', 'PT Honeywell Indonesia', 'PO-2024-009', 'Sep 2025', 'Loop test F&G detector dengan control room', 80.00, 85.00, 'Ahead', null],
                [10, 'Pre-commissioning Line Flushing & Hydrotest', 'PT Elnusa Tbk', 'PO-2024-010', 'Oct 2025', 'Hydrotest paket discharge pipa 12-inch', 30.00, 35.00, 'Ahead', null],
                [11, 'General Site Cleaning, Grading & Road Finishing', 'Local Contractors (Wajo)', 'PO-2024-011', 'Oct 2025', 'Pengecoran parit drainase sekeliling shelter', 80.00, 85.00, 'Ahead', null],
            ],
        ];

        foreach ($packagesTemplate as $weekLabel => $packages) {
            foreach ($packages as $pkg) {
                SubcontractorPackage::updateOrCreate(
                    [
                        'project_id' => $project1->id,
                        'week_label' => $weekLabel,
                        'item_no' => $pkg[0],
                    ],
                    [
                        'work_description' => $pkg[1],
                        'subcontractor_name' => $pkg[2],
                        'po_number' => $pkg[3],
                        'completion_plan' => $pkg[4],
                        'current_status_text' => $pkg[5],
                        'plan_progress' => $pkg[6],
                        'actual_progress' => $pkg[7],
                        'status_badge' => $pkg[8],
                        'obstacles' => $pkg[9],
                        'notes' => 'Status dilaporkan per cutoff ' . $weekLabel,
                    ]
                );
            }
        }

        // =========================================================================
        // 5. SEED WEEKLY ACTIVITIES PER WEEK (Project 1: GBKB-55)
        // =========================================================================
        $activitiesConfig = [
            'Week 10' => [
                'actual' => [
                    ['Engineering & QC', 'Finalisasi Drawing Tie-in spool suction & discharge gas', 1],
                    ['Procurement', 'Kedatangan 2 unit gas scrubber di pelabuhan Makassar', 2],
                    ['Construction', 'Pengecoran beton pondasi Bay A compressor pad', 3],
                    ['HSE', 'DCU harian dan safety induction untuk 18 pekerja erection baja', 4],
                ],
                'plan' => [
                    ['Engineering & QC', 'Review paket test loop hydrotest line 12-inch', 1],
                    ['Procurement', 'Mobilisasi armada multi-axle trailer untuk angkut unit GEC', 2],
                    ['Construction', 'Erection kolom baja dan rafter shelter kompresor', 3],
                    ['HSE', 'Audit kelayakan sling crane dan sertifikasi rigger lapangan', 4],
                ],
            ],
            'Week 11' => [
                ['actual' => [
                    ['Engineering & QC', 'Inspeksi dimensi dan leveling base plate pondasi kompresor', 1],
                    ['Procurement', 'Delivery unit GEC #1 tiba di staging area lapangan Sengkang', 2],
                    ['Construction', 'Pemasangan atap metal sheet dan gantry crane rel shelter', 3],
                    ['HSE', '173,000 jam kerja selamat tanpa kecelakaan (Zero LTA)', 4],
                ]],
                ['plan' => [
                    ['Engineering & QC', 'Penyusunan prosedur skidding gas engine compressor unit #2', 1],
                    ['Procurement', 'Pengiriman bulk instrument kabel dan explosion-proof light', 2],
                    ['Construction', 'Persiapan landasan hydraulic jack dan skidding beam', 3],
                    ['HSE', 'Simulasi tanggap darurat tumpahan hidrokarbon dan evakuasi medis', 4],
                ]],
            ],
            'Week 12' => [
                'actual' => [
                    ['Engineering & QC', 'Punchlist walkdown sistem drainase dan proteksi katodik', 1],
                    ['Procurement', 'Delivery LV Switchgear & Distribution Panel ke CCR room', 2],
                    ['Construction', 'Skidding GEC#2 (Gas Engine Compressor) ke pondasi permanen', 3],
                    ['Construction', 'Pemasangan cable tray di CCR building dan pipa rack header', 4],
                    ['HSE', '186,056 jam kerja selamat tercapai dengan zero accident record', 5],
                ],
                'plan' => [
                    ['Engineering & QC', 'Sertifikasi bejana tekan dan kalibrasi pressure safety valve', 1],
                    ['Procurement', 'Leak test Manual Valve di gudang staging site', 2],
                    ['Construction', 'Install GEC Unit #6 ke pondasi dengan laser alignment', 3],
                    ['Construction', 'Penarikan kabel instrumen dari Junction Box ke CCR', 4],
                    ['HSE', 'Weekly HSE inspection dan Daily Check Up (DCU) crew berisiko tinggi', 5],
                ],
            ],
        ];

        foreach ($activitiesConfig as $weekLabel => $acts) {
            $actuals = isset($acts['actual']) ? $acts['actual'] : (isset($acts[0]['actual']) ? $acts[0]['actual'] : []);
            $plans = isset($acts['plan']) ? $acts['plan'] : (isset($acts[1]['plan']) ? $acts[1]['plan'] : []);

            foreach ($actuals as $a) {
                WeeklyActivity::updateOrCreate(
                    [
                        'project_id' => $project1->id,
                        'week_label' => $weekLabel,
                        'activity_type' => 'this_week_actual',
                        'sort_order' => $a[2],
                    ],
                    [
                        'discipline' => $a[0],
                        'description' => $a[1],
                    ]
                );
            }

            foreach ($plans as $p) {
                WeeklyActivity::updateOrCreate(
                    [
                        'project_id' => $project1->id,
                        'week_label' => $weekLabel,
                        'activity_type' => 'next_week_plan',
                        'sort_order' => $p[2],
                    ],
                    [
                        'discipline' => $p[0],
                        'description' => $p[1],
                    ]
                );
            }
        }

        // =========================================================================
        // 6. SEED PROGRESS PHOTOS PER WEEK (Project 1: GBKB-55)
        // =========================================================================
        $photosConfig = [
            'Week 10' => [
                ['Pengecoran Pondasi Utama Compressor Bay A', 'Pekerjaan pengecoran pedestal beton dengan mutu K-350.', '/storage/progress_photos/EE_W46_01.jpg', '2025-08-15'],
                ['Pengiriman Scrubber Vessel di Dermaga', 'Unloading vessel dari barge ke trailer multi-axle.', '/storage/progress_photos/EE_W46_02.jpg', '2025-08-14'],
            ],
            'Week 11' => [
                ['Erection Kolom dan Rafter Shelter Kompresor', 'Pemasangan balok baja structural shelter menggunakan crane 80-ton.', '/storage/progress_photos/EE_W46_04.jpg', '2025-08-22'],
                ['Kedatangan GEC Unit #1 di Site Sengkang', 'Multi-axle trailer tiba di site dengan pengawalan safety escort.', '/storage/progress_photos/EE_W46_02.jpg', '2025-08-21'],
            ],
            'Week 12' => [
                ['Skidding GEC#2 ke Pondasi Permanen', 'Operasi hydraulic jacking dan skidding unit 42-ton ke anchor bolts.', '/storage/progress_photos/EE_W46_03.jpg', '2025-08-29'],
                ['Instalasi Electrical Lighting Shelter Kompresor', 'Pemasangan 12 unit lampu explosion-proof LED di langit-langit shelter.', '/storage/progress_photos/EE_W46_04.jpg', '2025-08-28'],
                ['Penyelesaian Konstruksi Pipe Rack Utama', 'Struktur rak pipa terpasang sejajar koridor inlet gas field.', '/storage/progress_photos/EE_W46_01.jpg', '2025-08-27'],
            ],
        ];

        foreach ($photosConfig as $weekLabel => $photos) {
            foreach ($photos as $ph) {
                ProgressPhoto::updateOrCreate(
                    [
                        'project_id' => $project1->id,
                        'week_label' => $weekLabel,
                        'title' => $ph[0],
                    ],
                    [
                        'caption' => $ph[1],
                        'image_path' => $ph[2],
                        'taken_at' => $ph[3],
                        'location' => 'Compressor Pad Bay, Gilireng, Wajo',
                    ]
                );
            }
        }

        // =========================================================================
        // 6b. SEED NEXT WEEK PLANS (TO-DO LIST) PER WEEK
        // =========================================================================
        $toDoPlansConfig = [
            'Week 10' => [
                ['Review dokumen shop drawing piping isometric dan tie-in point existing facility', 'Engineering FACENG', '2025-08-18', true],
                ['Pengecoran pondasi utama compressor bay A dengan volume 120 m3 beton mutu tinggi', 'Civil & Structure Team', '2025-08-20', true],
                ['Penyusunan preliminary HAZOP action items dan safety bridging document', 'HSE Officer FACENG', '2025-08-21', true],
            ],
            'Week 11' => [
                ['Persiapan pondasi pedestal dan perataan lantai kerja shelter unit kompresor', 'Construction Team', '2025-08-25', true],
                ['Kedatangan unit genset emergency dan transformer auxiliary di site Sengkang', 'Procurement Specialist', '2025-08-27', true],
                ['Inspeksi berkala alat pemadam api ringan (APAR) dan rambu keselamatan zona berbahaya', 'HSE Officer FACENG', '2025-08-26', true],
                ['Kalibrasi torque wrench dan peralatan rigging sebelum lifting operation', 'QC Engineer FACENG', '2025-08-28', false],
            ],
            'Week 12' => [
                ['Mobilisasi hydraulic crane 80-ton dan rigging accessories untuk pengangkatan modul kompresor unit #2', 'Construction Team', '2025-09-03', true],
                ['Finalisasi Permit To Work (PTW) panas dan cold work area flare line bersama Pertamina EP / EEES', 'HSE Officer FACENG', '2025-09-02', true],
                ['Penyelesaian hydrostatic test spool piping 6-inch header gas dan verifikasi visual NDT', 'QC Engineer FACENG', '2025-09-05', false],
                ['Pengiriman batch kedua kabel instrumentasi dan junction box explosion-proof dari Makassar port', 'Procurement Specialist', '2025-09-06', false],
                ['Pre-commissioning lube oil system compressor package GEC#1 dengan vendor specialist', 'Engineering FACENG', '2025-09-08', false],
                ['Penyelarasan elevasi pipe support dan torqueing anchor bolts struktur shelter kompresor', 'Civil & Structure Team', '2025-09-07', false],
            ],
        ];

        foreach ($toDoPlansConfig as $wLabel => $plans) {
            foreach ($plans as $p) {
                NextWeekPlan::updateOrCreate(
                    [
                        'project_id' => $project1->id,
                        'week' => $wLabel,
                        'task_description' => $p[0],
                    ],
                    [
                        'pic' => $p[1],
                        'target_date' => $p[2],
                        'is_completed' => $p[3],
                    ]
                );
            }
        }

        // =========================================================================
        // 6c. SEED PROJECT DOCUMENT (RICH TEXT REPORT & NOTES)
        // =========================================================================
        $initialDocContent = '<h1>Laporan Eksekutif Progres Mingguan — Booster Gas Compressor 55 MMSCFD</h1>' .
            '<h2>1. Ringkasan Status Fisik Lapangan</h2>' .
            '<p>Pada periode evaluasi <strong>Week 12 (Cut-off 29 Agustus 2025)</strong>, proyek menunjukkan performa <em>ahead schedule</em> dengan deviasi kumulatif positif sebesar <strong>+3.63%</strong> (Rencana: 89.82%, Aktual: 93.45%). Seluruh pengiriman unit utama kompresor GEC#1 dan GEC#2 telah tiba di site Sengkang dengan kondisi baik.</p>' .
            '<h2>2. Matriks Pencapaian Sub-Sistem EPC</h2>' .
            '<table style="border-collapse: collapse; width: 100%; border: 1px solid #cbd5e1;">' .
            '<thead>' .
            '<tr style="background-color: #f1f5f9;">' .
            '<th style="border: 1px solid #cbd5e1; padding: 8px; text-align: left;">Disiplin EPC</th>' .
            '<th style="border: 1px solid #cbd5e1; padding: 8px; text-align: center;">Bobot (%)</th>' .
            '<th style="border: 1px solid #cbd5e1; padding: 8px; text-align: center;">Aktual (%)</th>' .
            '<th style="border: 1px solid #cbd5e1; padding: 8px; text-align: left;">Catatan Lapangan</th>' .
            '</tr>' .
            '</thead>' .
            '<tbody>' .
            '<tr>' .
            '<td style="border: 1px solid #cbd5e1; padding: 8px;">Engineering & QC</td>' .
            '<td style="border: 1px solid #cbd5e1; padding: 8px; text-align: center;">2.54%</td>' .
            '<td style="border: 1px solid #cbd5e1; padding: 8px; text-align: center;">2.54%</td>' .
            '<td style="border: 1px solid #cbd5e1; padding: 8px;">100% Final As-Built drawing diterbitkan.</td>' .
            '</tr>' .
            '<tr>' .
            '<td style="border: 1px solid #cbd5e1; padding: 8px;">Procurement</td>' .
            '<td style="border: 1px solid #cbd5e1; padding: 8px; text-align: center;">77.85%</td>' .
            '<td style="border: 1px solid #cbd5e1; padding: 8px; text-align: center;">77.03%</td>' .
            '<td style="border: 1px solid #cbd5e1; padding: 8px;">Unit kompresor utama dan auxiliary lengkap.</td>' .
            '</tr>' .
            '<tr>' .
            '<td style="border: 1px solid #cbd5e1; padding: 8px;">Construction</td>' .
            '<td style="border: 1px solid #cbd5e1; padding: 8px; text-align: center;">15.17%</td>' .
            '<td style="border: 1px solid #cbd5e1; padding: 8px; text-align: center;">11.05%</td>' .
            '<td style="border: 1px solid #cbd5e1; padding: 8px;">Erection shelter baja dan pipe rack on schedule.</td>' .
            '</tr>' .
            '</tbody>' .
            '</table>' .
            '<h2>3. Rencana Tindak Lanjut Prioritas (Next Action Items)</h2>' .
            '<ul>' .
            '<li>Pelaksanaan hydrotest spool piping 6-inch header gas bersama tim inspeksi pihak ketiga.</li>' .
            '<li>Pre-commissioning electrical distribution switchgear dan grounding resistance test.</li>' .
            '<li>Koordinasi izin kerja panas (PTW) untuk pengelasan tie-in spool ke stasiun eksisting.</li>' .
            '</ul>' .
            '<p><em>Dokumen ini disusun oleh Tim Project Control dan disahkan untuk koordinasi manajemen FACENG Energy Equity Sengkang.</em></p>';

        ProjectDocument::updateOrCreate(
            [
                'project_id' => $project1->id,
                'week' => 'Week 12',
            ],
            [
                'title' => 'Laporan Eksekutif Mingguan — Week 12 (GBKB-55)',
                'content' => $initialDocContent,
                'updated_by' => 'Project Control FACENG',
            ]
        );

        // =========================================================================
        // 7. SEED S-CURVE METRICS TIME-SERIES (55 Weeks)
        // =========================================================================
        $sCurveBase = [
            1 => [0.15, 0.15], 2 => [0.42, 0.40], 3 => [0.85, 0.88], 4 => [1.45, 1.50],
            5 => [2.30, 2.35], 6 => [3.50, 3.60], 7 => [5.10, 5.25], 8 => [7.20, 7.40],
            9 => [9.80, 10.10], 10 => [13.20, 13.50], 11 => [17.50, 17.80], 12 => [22.80, 23.20],
            13 => [28.90, 29.40], 14 => [35.40, 36.10], 15 => [42.10, 43.00], 16 => [48.90, 49.80],
            17 => [55.40, 56.50], 18 => [61.50, 62.80], 19 => [67.00, 68.50], 20 => [71.80, 73.40],
            21 => [75.90, 77.60], 22 => [79.20, 81.00], 23 => [81.80, 83.70], 24 => [83.80, 85.80],
            25 => [85.30, 87.40], 26 => [86.40, 88.60], 27 => [87.20, 89.50], 28 => [87.80, 90.20],
            29 => [88.20, 90.70], 30 => [88.50, 91.10], 31 => [88.75, 91.45], 32 => [88.95, 91.75],
            33 => [89.10, 92.00], 34 => [89.25, 92.20], 35 => [89.38, 92.38], 36 => [89.50, 92.55],
            37 => [89.60, 92.70], 38 => [89.68, 92.85], 39 => [89.75, 93.00], 40 => [89.80, 93.12],
            41 => [89.81, 93.22], 42 => [89.81, 93.30], 43 => [89.82, 93.36], 44 => [89.82, 93.40],
            45 => [89.82, 93.43], 46 => [89.82, 93.45],
        ];

        // Weeks 1 to 55
        for ($w = 1; $w <= 55; $w++) {
            $weekLabel = 'Week ' . $w;
            $cutoffDate = date('Y-m-d', strtotime("2024-10-15 + " . (($w - 1) * 7) . " days"));

            $cumPlan = $sCurveBase[$w][0] ?? min(100.00, round(89.82 + (($w - 46) * 1.13), 2));
            $cumActual = isset($sCurveBase[$w]) ? $sCurveBase[$w][1] : null;
            $cumForecast = ($w >= 46) ? min(100.00, round(93.45 + (($w - 46) * 0.73), 2)) : null;

            SCurveMetric::updateOrCreate(
                [
                    'project_id' => $project1->id,
                    'week_number' => $w,
                ],
                [
                    'week_label' => $weekLabel,
                    'cutoff_date' => $cutoffDate,
                    'cum_plan' => $cumPlan,
                    'cum_actual' => $cumActual,
                    'cum_forecast' => $cumForecast,
                ]
            );
        }

        // Juga seed SCurve untuk project ke-2 hingga 5
        foreach (['KP9-FL', 'PIS-03', 'CPF-04', 'ARR-05'] as $code) {
            $proj = $projects[$code];
            $factor = $proj->actual_cumulative / 93.45;

            for ($w = 1; $w <= 55; $w++) {
                $weekLabel = 'Week ' . $w;
                $cutoffDate = date('Y-m-d', strtotime("2025-01-10 + " . (($w - 1) * 7) . " days"));

                $plan = round(($sCurveBase[$w][0] ?? 90.0) * $factor, 2);
                $actual = isset($sCurveBase[$w]) ? round($sCurveBase[$w][1] * $factor, 2) : null;
                $forecast = ($w >= 46) ? round(min(100.00, $proj->actual_cumulative + (($w - 46) * 0.8)), 2) : null;

                SCurveMetric::updateOrCreate(
                    [
                        'project_id' => $proj->id,
                        'week_number' => $w,
                    ],
                    [
                        'week_label' => $weekLabel,
                        'cutoff_date' => $cutoffDate,
                        'cum_plan' => min(100.00, $plan),
                        'cum_actual' => $actual !== null ? min(100.00, $actual) : null,
                        'cum_forecast' => $forecast !== null ? min(100.00, $forecast) : null,
                    ]
                );
            }
        }

        // =========================================================================
        // 9. PROJECT SCHEDULES & WEEKLY PROGRESS (MS Project Style & Progress Summary)
        // =========================================================================
        $project1Schedules = [
            [
                'task_name' => 'Preparation, Mobilization & Permitting',
                'price' => 775098000.00,
                'duration' => 60,
                'start_date' => '2024-10-15',
                'finish_date' => '2024-12-14',
                'baseline_start' => '2024-10-15',
                'baseline_finish' => '2024-12-14',
                'prev_plan' => 3.06,
                'prev_act' => 3.06,
                'this_plan' => 0.00,
                'this_act' => 0.00,
            ],
            [
                'task_name' => 'Detailed Engineering & 3D Modeling Studies',
                'price' => 643382000.00,
                'duration' => 90,
                'start_date' => '2024-11-01',
                'finish_date' => '2025-01-29',
                'baseline_start' => '2024-11-01',
                'baseline_finish' => '2025-01-29',
                'prev_plan' => 2.54,
                'prev_act' => 2.54,
                'this_plan' => 0.00,
                'this_act' => 0.00,
            ],
            [
                'task_name' => 'Procurement & Delivery of Booster Gas Compressor Package',
                'price' => 19719405000.00,
                'duration' => 240,
                'start_date' => '2024-12-01',
                'finish_date' => '2025-07-29',
                'baseline_start' => '2024-12-01',
                'baseline_finish' => '2025-07-29',
                'prev_plan' => 74.45,
                'prev_act' => 76.28,
                'this_plan' => 0.47,
                'this_act' => 0.75,
            ],
            [
                'task_name' => 'Civil Foundation, Structural & Piping Construction',
                'price' => 3842561000.00,
                'duration' => 180,
                'start_date' => '2025-02-15',
                'finish_date' => '2025-08-14',
                'baseline_start' => '2025-02-15',
                'baseline_finish' => '2025-08-14',
                'prev_plan' => 9.06,
                'prev_act' => 10.32,
                'this_plan' => 0.47,
                'this_act' => 0.73,
            ],
            [
                'task_name' => 'Pre-Commissioning, Hydrotest & Start-Up Execution',
                'price' => 349554000.00,
                'duration' => 75,
                'start_date' => '2025-07-15',
                'finish_date' => '2025-09-28',
                'baseline_start' => '2025-07-15',
                'baseline_finish' => '2025-09-28',
                'prev_plan' => 0.00,
                'prev_act' => 0.00,
                'this_plan' => 0.00,
                'this_act' => 0.00,
            ],
        ];

        // Seed Project 1 schedules
        foreach ($project1Schedules as $sData) {
            $prevP = $sData['prev_plan'];
            $prevA = $sData['prev_act'];
            $thisP = $sData['this_plan'];
            $thisA = $sData['this_act'];

            unset($sData['prev_plan'], $sData['prev_act'], $sData['this_plan'], $sData['this_act']);
            $sData['project_id'] = $project1->id;

            $schedule = ProjectSchedule::updateOrCreate(
                [
                    'project_id' => $project1->id,
                    'task_name' => $sData['task_name'],
                ],
                $sData
            );

            // Seed weekly progress (distribute prev across weeks 1..11, and this on week 12)
            $prevPerWeekP = $prevP > 0 ? round($prevP / 11, 4) : 0;
            $prevPerWeekA = $prevA > 0 ? round($prevA / 11, 4) : 0;

            for ($w = 1; $w <= 11; $w++) {
                ScheduleWeeklyProgress::updateOrCreate(
                    [
                        'project_schedule_id' => $schedule->id,
                        'week' => $w,
                    ],
                    [
                        'week_date' => date('Y-m-d', strtotime("2024-10-15 + " . (($w - 1) * 7) . " days")),
                        'plan_progress' => ($w == 11) ? round($prevP - ($prevPerWeekP * 10), 2) : round($prevPerWeekP, 2),
                        'actual_progress' => ($w == 11) ? round($prevA - ($prevPerWeekA * 10), 2) : round($prevPerWeekA, 2),
                    ]
                );
            }

            // Week 12
            ScheduleWeeklyProgress::updateOrCreate(
                [
                    'project_schedule_id' => $schedule->id,
                    'week' => 12,
                ],
                [
                    'week_date' => '2025-08-29',
                    'plan_progress' => $thisP,
                    'actual_progress' => $thisA,
                ]
            );
        }
        ProjectScheduleController::recalculateWeights($project1->id);

        // Seed schedules for the other projects
        $otherProjectsScheduleConfigs = [
            'KP9-FL' => [
                ['task_name' => 'Right of Way (ROW) & Survey Alignment', 'price' => 1200000000.00, 'duration' => 60, 'start' => '2025-01-10', 'finish' => '2025-03-11', 'prev_p' => 8.10, 'prev_a' => 8.10, 'this_p' => 0.00, 'this_a' => 0.00],
                ['task_name' => 'Engineering & Stress Analysis', 'price' => 950000000.00, 'duration' => 60, 'start' => '2025-01-20', 'finish' => '2025-03-21', 'prev_p' => 6.42, 'prev_a' => 6.42, 'this_p' => 0.00, 'this_a' => 0.00],
                ['task_name' => 'Line Pipe & Fittings Procurement (8-inch)', 'price' => 14850000000.00, 'duration' => 150, 'start' => '2025-02-01', 'finish' => '2025-07-01', 'prev_p' => 59.80, 'prev_a' => 54.20, 'this_p' => 0.50, 'this_a' => 0.30],
                ['task_name' => 'Trenching, Stringing, Welding & Lowering In', 'price' => 7330000000.00, 'duration' => 150, 'start' => '2025-03-15', 'finish' => '2025-08-12', 'prev_p' => 16.58, 'prev_a' => 16.08, 'this_p' => 1.00, 'this_a' => 1.10],
                ['task_name' => 'Hydrostatic Testing, Caliper Pigging & Tie-In', 'price' => 1000000000.00, 'duration' => 45, 'start' => '2025-08-01', 'finish' => '2025-09-15', 'prev_p' => 0.00, 'prev_a' => 0.00, 'this_p' => 0.00, 'this_a' => 0.00],
            ],
            'PIS-03' => [
                ['task_name' => 'Inspection Plan & Tool Mobilization', 'price' => 850000000.00, 'duration' => 40, 'start' => '2025-03-01', 'finish' => '2025-04-10', 'prev_p' => 9.83, 'prev_a' => 9.83, 'this_p' => 0.00, 'this_a' => 0.00],
                ['task_name' => 'Inline Inspection (ILI) Ultrasonic & MFL Run', 'price' => 4200000000.00, 'duration' => 70, 'start' => '2025-04-05', 'finish' => '2025-06-14', 'prev_p' => 28.50, 'prev_a' => 29.00, 'this_p' => 0.50, 'this_a' => 0.60],
                ['task_name' => 'Verification Digging & Non-Destructive Testing', 'price' => 2400000000.00, 'duration' => 60, 'start' => '2025-06-15', 'finish' => '2025-08-14', 'prev_p' => 6.17, 'prev_a' => 6.07, 'this_p' => 0.00, 'this_a' => 0.00],
                ['task_name' => 'Integrity Assessment Report & Fitness For Service', 'price' => 1200000000.00, 'duration' => 60, 'start' => '2025-08-15', 'finish' => '2025-10-14', 'prev_p' => 0.00, 'prev_a' => 0.00, 'this_p' => 0.00, 'this_a' => 0.00],
            ],
            'CPF-04' => [
                ['task_name' => 'HAZOP & Engineering Upgrades', 'price' => 2500000000.00, 'duration' => 60, 'start' => '2024-11-01', 'finish' => '2024-12-31', 'prev_p' => 7.79, 'prev_a' => 7.79, 'this_p' => 0.00, 'this_a' => 0.00],
                ['task_name' => 'Vessel & Separator Procurement', 'price' => 18000000000.00, 'duration' => 200, 'start' => '2024-12-01', 'finish' => '2025-06-19', 'prev_p' => 45.20, 'prev_a' => 46.00, 'this_p' => 0.40, 'this_a' => 0.40],
                ['task_name' => 'Piping & Instrument Skid Installation', 'price' => 9600000000.00, 'duration' => 120, 'start' => '2025-04-01', 'finish' => '2025-07-30', 'prev_p' => 7.81, 'prev_a' => 7.81, 'this_p' => 0.00, 'this_a' => 0.00],
                ['task_name' => 'Commissioning & Plant Performance Run', 'price' => 2000000000.00, 'duration' => 60, 'start' => '2025-08-01', 'finish' => '2025-09-30', 'prev_p' => 0.00, 'prev_a' => 0.00, 'this_p' => 0.00, 'this_a' => 0.00],
            ],
            'ARR-05' => [
                ['task_name' => 'Land Survey, Clearing & Grubbing', 'price' => 600000000.00, 'duration' => 30, 'start' => '2025-02-15', 'finish' => '2025-03-17', 'prev_p' => 14.28, 'prev_a' => 14.28, 'this_p' => 0.00, 'this_a' => 0.00],
                ['task_name' => 'Sub-base Aggregate Compaction & Drainage Culvert', 'price' => 2100000000.00, 'duration' => 90, 'start' => '2025-03-18', 'finish' => '2025-06-16', 'prev_p' => 50.00, 'prev_a' => 48.00, 'this_p' => 0.00, 'this_a' => 0.00],
                ['task_name' => 'Rigid Pavement Concrete Pouring (K-350)', 'price' => 1200000000.00, 'duration' => 60, 'start' => '2025-06-17', 'finish' => '2025-08-16', 'prev_p' => 23.72, 'prev_a' => 22.22, 'this_p' => 0.00, 'this_a' => 0.00],
                ['task_name' => 'Road Marking, Guardrail & Final Handover', 'price' => 300000000.00, 'duration' => 30, 'start' => '2025-08-17', 'finish' => '2025-09-16', 'prev_p' => 0.00, 'prev_a' => 0.00, 'this_p' => 0.00, 'this_a' => 0.00],
            ],
        ];

        foreach ($otherProjectsScheduleConfigs as $code => $items) {
            if (isset($projects[$code])) {
                $p = $projects[$code];
                foreach ($items as $itm) {
                    $pp = $itm['prev_p'];
                    $pa = $itm['prev_a'];
                    $tp = $itm['this_p'];
                    $ta = $itm['this_a'];

                    $sched = ProjectSchedule::updateOrCreate(
                        [
                            'project_id' => $p->id,
                            'task_name' => $itm['task_name'],
                        ],
                        [
                            'price' => $itm['price'],
                            'duration' => $itm['duration'],
                            'start_date' => $itm['start'],
                            'finish_date' => $itm['finish'],
                            'baseline_start' => $itm['start'],
                            'baseline_finish' => $itm['finish'],
                        ]
                    );

                    for ($w = 1; $w <= 11; $w++) {
                        ScheduleWeeklyProgress::updateOrCreate(
                            [
                                'project_schedule_id' => $sched->id,
                                'week' => $w,
                            ],
                            [
                                'week_date' => date('Y-m-d', strtotime("{$itm['start']} + " . (($w - 1) * 7) . " days")),
                                'plan_progress' => round($pp / 11, 2),
                                'actual_progress' => round($pa / 11, 2),
                            ]
                        );
                    }

                    ScheduleWeeklyProgress::updateOrCreate(
                        [
                            'project_schedule_id' => $sched->id,
                            'week' => 12,
                        ],
                        [
                            'week_date' => $p->cutoff_date ?: '2025-08-29',
                            'plan_progress' => $tp,
                            'actual_progress' => $ta,
                        ]
                    );
                }
                ProjectScheduleController::recalculateWeights($p->id);
            }
        }
    }
}
