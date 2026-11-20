<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Models\Project;
use App\Models\ProjectWeeklyMetric;
use App\Models\WbsCategory;
use App\Models\SCurveMetric;
use App\Models\SubcontractorPackage;
use App\Models\WeeklyActivity;
use App\Models\ProgressPhoto;
use App\Models\HseReport;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\StreamedResponse;

class DashboardController extends Controller
{
    /**
     * Memuat data dashboard enterprise (Web view atau JSON)
     */
    public function index(Request $request)
    {
        return $this->api($request);
    }

    /**
     * Endpoint API utama: /api/dashboard?project_id=...&week=...
     */
    public function api(Request $request): JsonResponse
    {
        // 1. Ambil seluruh master proyek untuk navigasi Sidebar
        $projects = Project::orderBy('id', 'asc')->get();

        // 2. Ambil ID proyek terpilih
        $requestedProjectId = $request->query('project_id');
        $selectedProject = null;

        if ($requestedProjectId) {
            $selectedProject = Project::find($requestedProjectId);
        }
        if (!$selectedProject) {
            $selectedProject = $projects->first();
        }

        if (!$selectedProject) {
            return response()->json([
                'success' => false,
                'message' => 'No project found in database.',
            ], 404);
        }

        // 3. Ambil daftar minggu yang tersedia untuk proyek ini
        $availableWeeks = ProjectWeeklyMetric::where('project_id', $selectedProject->id)
            ->orderBy('week_number', 'asc')
            ->pluck('week_label')
            ->unique()
            ->values()
            ->toArray();

        // Fallback jika belum ada di weekly metrics
        if (empty($availableWeeks)) {
            $availableWeeks = WbsCategory::where('project_id', $selectedProject->id)
                ->pluck('week_label')
                ->unique()
                ->values()
                ->toArray();
        }
        if (empty($availableWeeks)) {
            $availableWeeks = ['Week 10', 'Week 11', 'Week 12'];
        }

        // 4. Tentukan minggu terpilih
        $requestedWeek = $request->query('week');
        if (!$requestedWeek || !in_array($requestedWeek, $availableWeeks)) {
            // Default ke minggu terakhir / current_week
            $requestedWeek = in_array($selectedProject->current_week, $availableWeeks)
                ? $selectedProject->current_week
                : end($availableWeeks);
        }

        // 5. Muat KPI snapshot untuk minggu yang dipilih
        $weeklyMetric = ProjectWeeklyMetric::where('project_id', $selectedProject->id)
            ->where('week_label', $requestedWeek)
            ->first();

        if ($weeklyMetric) {
            $selectedProject->plan_cumulative = $weeklyMetric->plan_cumulative;
            $selectedProject->actual_cumulative = $weeklyMetric->actual_cumulative;
            $selectedProject->deviation = $weeklyMetric->deviation;
            $selectedProject->status = $weeklyMetric->status;
            $selectedProject->current_week = $weeklyMetric->week_label;
            if ($weeklyMetric->cutoff_date) {
                $selectedProject->cutoff_date = $weeklyMetric->cutoff_date;
            }
        }

        // 6. Muat WBS Categories untuk minggu terpilih
        $wbsCategories = WbsCategory::where('project_id', $selectedProject->id)
            ->where('week_label', $requestedWeek)
            ->orderBy('sort_order', 'asc')
            ->get();

        if ($wbsCategories->isEmpty()) {
            $wbsCategories = WbsCategory::where('project_id', $selectedProject->id)
                ->orderBy('sort_order', 'asc')
                ->limit(5)
                ->get();
        }

        // 7. Muat S-Curve Metrics (Tailored to requested week)
        preg_match('/\d+/', $requestedWeek, $weekMatches);
        $currentWeekNumber = !empty($weekMatches) ? (int)$weekMatches[0] : 12;

        $rawSCurve = SCurveMetric::where('project_id', $selectedProject->id)
            ->orderBy('week_number', 'asc')
            ->get();

        // Modulasi actual curve agar berhenti di minggu yang dipilih jika cutoff historis
        $sCurveMetrics = $rawSCurve->map(function ($item) use ($currentWeekNumber) {
            $clone = clone $item;
            if ($clone->week_number > $currentWeekNumber) {
                $clone->cum_actual = null;
            }
            return $clone;
        });

        // 8. Muat Subcontractor Packages untuk minggu terpilih
        $subcontractorPackages = SubcontractorPackage::where('project_id', $selectedProject->id)
            ->where('week_label', $requestedWeek)
            ->orderBy('item_no', 'asc')
            ->get();

        if ($subcontractorPackages->isEmpty()) {
            $subcontractorPackages = SubcontractorPackage::where('project_id', $selectedProject->id)
                ->orderBy('item_no', 'asc')
                ->limit(11)
                ->get();
        }

        // 9. Muat Weekly Activities untuk minggu terpilih
        $weeklyActivities = WeeklyActivity::where('project_id', $selectedProject->id)
            ->where('week_label', $requestedWeek)
            ->orderBy('sort_order', 'asc')
            ->get();

        if ($weeklyActivities->isEmpty()) {
            $weeklyActivities = WeeklyActivity::where('project_id', $selectedProject->id)
                ->orderBy('sort_order', 'asc')
                ->get();
        }

        // 10. Muat Progress Photos untuk minggu terpilih
        $progressPhotos = ProgressPhoto::where('project_id', $selectedProject->id)
            ->where('week_label', $requestedWeek)
            ->latest('id')
            ->get();

        // 11. Muat HSE Reports untuk minggu terpilih
        $hseReports = HseReport::where('project_id', $selectedProject->id)
            ->where('week_label', $requestedWeek)
            ->get();

        if ($hseReports->isEmpty()) {
            $hseReports = HseReport::where('project_id', $selectedProject->id)
                ->latest('id')
                ->limit(1)
                ->get();
        }

        // 12. Muat Next Week Plans (To-Do List) untuk minggu terpilih
        $nextWeekPlans = \App\Models\NextWeekPlan::where('project_id', $selectedProject->id)
            ->where('week', $requestedWeek)
            ->orderBy('id', 'asc')
            ->get();

        // Pasangkan relasi ke instance selectedProject
        $selectedProject->setRelation('wbsCategories', $wbsCategories);
        $selectedProject->setRelation('sCurveMetrics', $sCurveMetrics);
        $selectedProject->setRelation('subcontractorPackages', $subcontractorPackages);
        $selectedProject->setRelation('weeklyActivities', $weeklyActivities);
        $selectedProject->setRelation('progressPhotos', $progressPhotos);
        $selectedProject->setRelation('hseReports', $hseReports);
        $selectedProject->setRelation('nextWeekPlans', $nextWeekPlans);
        $selectedProject->setAttribute('available_weeks', $availableWeeks);
        $selectedProject->setAttribute('selected_week', $requestedWeek);

        return response()->json([
            'success' => true,
            'source' => 'MySQL Database',
            'projects' => $projects,
            'selected_project' => $selectedProject,
            'selected_week' => $requestedWeek,
            'available_weeks' => $availableWeeks,
        ]);
    }

    /**
     * Endpoint untuk membuat / mengunggah proyek baru
     * POST /api/projects
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'project_name' => ['required', 'string', 'max:255'],
            'project_code' => ['required', 'string', 'max:50', 'unique:projects,project_code'],
            'location' => ['nullable', 'string', 'max:255'],
            'contractor_name' => ['nullable', 'string', 'max:255'],
            'contract_value' => ['nullable', 'numeric', 'min:0'],
            'currency' => ['nullable', 'string', 'max:10'],
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date'],
            'current_week' => ['nullable', 'string', 'max:50'],
            'cutoff_date' => ['nullable', 'date'],
            'plan_cumulative' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'actual_cumulative' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'status' => ['nullable', 'string'],
        ]);

        $planCum = isset($validated['plan_cumulative']) ? (float)$validated['plan_cumulative'] : 15.00;
        $actCum = isset($validated['actual_cumulative']) ? (float)$validated['actual_cumulative'] : 15.00;
        $deviation = round($actCum - $planCum, 2);
        $status = $validated['status'] ?? ($deviation > 0 ? 'Ahead' : ($deviation < 0 ? 'Delayed' : 'On Track'));
        $currentWeek = !empty($validated['current_week']) ? $validated['current_week'] : 'Week 1';
        preg_match('/\d+/', $currentWeek, $wMatch);
        $weekNumber = !empty($wMatch) ? (int)$wMatch[0] : 1;

        // Sanitasi plain text anti-XSS
        $validated['project_name'] = strip_tags(trim($validated['project_name']));
        $validated['project_code'] = strip_tags(trim($validated['project_code']));
        if (isset($validated['location'])) $validated['location'] = strip_tags(trim($validated['location']));
        if (isset($validated['contractor_name'])) $validated['contractor_name'] = strip_tags(trim($validated['contractor_name']));

        // 1. Buat master Project
        $project = Project::create([
            'project_code' => strtoupper(trim($validated['project_code'])),
            'project_name' => trim($validated['project_name']),
            'location' => $validated['location'] ?? 'Sengkang - Sulawesi Selatan',
            'contractor_name' => $validated['contractor_name'] ?? 'PT Energy Equity Engineering',
            'contract_value' => isset($validated['contract_value']) ? (float)$validated['contract_value'] : 15000000000.00,
            'currency' => $validated['currency'] ?? 'IDR',
            'start_date' => $validated['start_date'] ?? now()->startOfMonth()->toDateString(),
            'end_date' => $validated['end_date'] ?? now()->addMonths(6)->toDateString(),
            'current_week' => $currentWeek,
            'cutoff_date' => $validated['cutoff_date'] ?? now()->toDateString(),
            'plan_cumulative' => $planCum,
            'actual_cumulative' => $actCum,
            'deviation' => $deviation,
            'status' => $status,
        ]);

        // 2. Simpan WBS Categories (baik dari file upload jika ada atau dari default standard EPC)
        $wbsRows = $request->input('rows');
        if (!empty($wbsRows) && is_array($wbsRows)) {
            $sort = 1;
            foreach ($wbsRows as $r) {
                $code = $r['code'] ?? ('WBS-' . $sort);
                $name = $r['item'] ?? ('Item ' . $sort);
                $weight = (float)($r['weight'] ?? 0);
                $prevPlan = (float)($r['prevWeek']['plan'] ?? $r['prev_week_plan'] ?? 0);
                $prevAct = (float)($r['prevWeek']['actual'] ?? $r['prev_week_actual'] ?? 0);
                $thisPlan = (float)($r['thisWeek']['plan'] ?? $r['this_week_plan'] ?? 0);
                $thisAct = (float)($r['thisWeek']['actual'] ?? $r['this_week_actual'] ?? 0);
                $cPlan = (float)($r['cumulative']['plan'] ?? $r['cum_plan'] ?? ($prevPlan + $thisPlan));
                $cAct = (float)($r['cumulative']['actual'] ?? $r['cum_actual'] ?? ($prevAct + $thisAct));
                $v = (float)($r['variance'] ?? ($cAct - $cPlan));

                WbsCategory::create([
                    'project_id' => $project->id,
                    'week_label' => $currentWeek,
                    'code' => $code,
                    'name' => $name,
                    'weight_factor' => $weight,
                    'prev_week_plan' => $prevPlan,
                    'prev_week_actual' => $prevAct,
                    'this_week_plan' => $thisPlan,
                    'this_week_actual' => $thisAct,
                    'cum_plan' => $cPlan,
                    'cum_actual' => $cAct,
                    'variance' => $v,
                    'sort_order' => $sort++,
                ]);
            }
        } else {
            // Default 5 standard EPC categories
            $standardCategories = [
                ['code' => 'A',   'name' => 'PREPARATION',    'weight' => 3.06,  'ratio' => 1.0],
                ['code' => 'B.1', 'name' => 'ENGINEERING',    'weight' => 2.54,  'ratio' => 0.8],
                ['code' => 'B.2', 'name' => 'PROCUREMENT',    'weight' => 77.85, 'ratio' => 0.5],
                ['code' => 'B.3', 'name' => 'CONSTRUCTION',   'weight' => 15.55, 'ratio' => 0.2],
                ['code' => 'C',   'name' => 'COMMISSIONING',  'weight' => 1.00,  'ratio' => 0.0],
            ];

            $sort = 1;
            foreach ($standardCategories as $cat) {
                $cPlan = round($planCum * ($cat['weight'] / 100), 2);
                $cAct = round($actCum * ($cat['weight'] / 100), 2);
                $v = round($cAct - $cPlan, 2);

                WbsCategory::create([
                    'project_id' => $project->id,
                    'week_label' => $currentWeek,
                    'code' => $cat['code'],
                    'name' => $cat['name'],
                    'weight_factor' => $cat['weight'],
                    'prev_week_plan' => max(0, round($cPlan * 0.9, 2)),
                    'prev_week_actual' => max(0, round($cAct * 0.9, 2)),
                    'this_week_plan' => round($cPlan * 0.1, 2),
                    'this_week_actual' => round($cAct * 0.1, 2),
                    'cum_plan' => $cPlan,
                    'cum_actual' => $cAct,
                    'variance' => $v,
                    'sort_order' => $sort++,
                ]);
            }
        }

        // 3. Simpan ProjectWeeklyMetric awal
        ProjectWeeklyMetric::create([
            'project_id' => $project->id,
            'week_label' => $currentWeek,
            'week_number' => $weekNumber,
            'cutoff_date' => $project->cutoff_date,
            'plan_cumulative' => $planCum,
            'actual_cumulative' => $actCum,
            'deviation' => $deviation,
            'status' => $status,
            'highlights' => "Inisialisasi proyek {$project->project_name} pada {$currentWeek}.",
        ]);

        // 4. Inisialisasi S-Curve time series (55 minggu realistis sigmoid curve)
        for ($w = 1; $w <= 55; $w++) {
            $x = ($w - 27.5) / 6.0;
            $curve = 100.0 / (1.0 + exp(-$x));
            $pPlan = round($curve, 2);
            $pAct = $w <= $weekNumber ? round($pPlan + ($deviation * ($w / max(1, $weekNumber))), 2) : null;
            $pForecast = $w >= $weekNumber ? round(min(100.0, $pPlan + ($deviation * 0.8)), 2) : null;

            SCurveMetric::create([
                'project_id' => $project->id,
                'week_label' => 'W-' . str_pad($w, 2, '0', STR_PAD_LEFT),
                'week_number' => $w,
                'cutoff_date' => now()->copy()->subWeeks($weekNumber - $w)->toDateString(),
                'period_plan' => round(100.0 / 55.0, 2),
                'cum_plan' => $pPlan,
                'period_actual' => $w <= $weekNumber ? round(100.0 / 55.0, 2) : null,
                'cum_actual' => $pAct,
                'cum_forecast' => $pForecast,
            ]);
        }

        // 5. Inisialisasi Subcontractor Packages
        $subPackages = [
            [
                'item_no' => '01',
                'work_description' => 'Site Preparation, Survey & Civil Foundation',
                'subcontractor_name' => $project->contractor_name,
                'plan_progress' => min(100, $planCum * 1.5),
                'actual_progress' => min(100, $actCum * 1.5),
                'status_badge' => $deviation >= 0 ? 'Ahead' : 'Delayed',
                'notes' => 'Pekerjaan pondasi sipil awal dan perimeter fencing.',
            ],
            [
                'item_no' => '02',
                'work_description' => 'Mechanical Equipment Procurement & Inspection',
                'subcontractor_name' => 'PT Global Energi Mandiri',
                'plan_progress' => min(100, $planCum * 0.9),
                'actual_progress' => min(100, $actCum * 0.9),
                'status_badge' => 'On Track',
                'notes' => 'Fabrikasi dan verifikasi material equipment utama.',
            ],
            [
                'item_no' => '03',
                'work_description' => 'Piping Fabrication & NDT Testing',
                'subcontractor_name' => 'PT Duta Sarana Migas',
                'plan_progress' => min(100, $planCum * 0.7),
                'actual_progress' => min(100, $actCum * 0.7),
                'status_badge' => 'On Track',
                'notes' => 'Spool piping hydrotest dan verifikasi radiografi.',
            ],
        ];

        foreach ($subPackages as $pkg) {
            SubcontractorPackage::create([
                'project_id' => $project->id,
                'week_label' => $currentWeek,
                'item_no' => $pkg['item_no'],
                'work_description' => $pkg['work_description'],
                'subcontractor_name' => $pkg['subcontractor_name'],
                'plan_progress' => $pkg['plan_progress'],
                'actual_progress' => $pkg['actual_progress'],
                'status_badge' => $pkg['status_badge'],
                'notes' => $pkg['notes'],
                'obstacles' => null,
            ]);
        }

        // 6. Inisialisasi HSE Report
        HseReport::create([
            'project_id' => $project->id,
            'week_label' => $currentWeek,
            'total_personnel' => 65,
            'period_manhours' => 3850,
            'cumulative_manhours' => 28500,
            'near_miss' => 0,
            'first_aid' => 0,
            'mtc' => 0,
            'lta' => 0,
            'fatality' => 0,
            'oil_spill' => 0,
            'gas_leaks' => 0,
            'safety_induction' => 24,
            'toolbox_meeting' => 6,
            'safety_inspection' => 2,
        ]);

        // 7. Inisialisasi Weekly Activities
        $initialActivities = [
            [
                'activity_type' => 'this_week_actual',
                'discipline' => 'Engineering & QC',
                'description' => "Kickoff meeting dan verifikasi shop drawing proyek {$project->project_name}.",
                'sort_order' => 1,
            ],
            [
                'activity_type' => 'this_week_actual',
                'discipline' => 'Procurement',
                'description' => 'Finalisasi vendor list dan penerbitan initial Purchase Order (PO).',
                'sort_order' => 2,
            ],
            [
                'activity_type' => 'next_week_plan',
                'discipline' => 'Construction',
                'description' => 'Mobilisasi alat berat dan verifikasi izin kerja lapangan (PTW).',
                'sort_order' => 1,
            ],
            [
                'activity_type' => 'next_week_plan',
                'discipline' => 'HSE',
                'description' => 'Safety induction menyeluruh untuk kontraktor dan inspeksi alat.',
                'sort_order' => 2,
            ],
        ];

        foreach ($initialActivities as $act) {
            WeeklyActivity::create([
                'project_id' => $project->id,
                'week_label' => $currentWeek,
                'activity_type' => $act['activity_type'],
                'discipline' => $act['discipline'],
                'description' => $act['description'],
                'sort_order' => $act['sort_order'],
            ]);
        }

        // Ambil list semua proyek terkini
        $allProjects = Project::orderBy('id', 'asc')->get();

        return response()->json([
            'success' => true,
            'message' => "Proyek baru '{$project->project_name}' berhasil ditambahkan ke database.",
            'project' => $project,
            'projects' => $allProjects,
        ], 201);
    }

    /**
     * Endpoint untuk menghapus proyek beserta seluruh data relasi (Cascade)
     * DELETE /api/projects/{id}
     */
    public function destroy(Request $request, $id): JsonResponse
    {
        $project = Project::find($id);

        if (!$project) {
            return response()->json([
                'success' => false,
                'message' => 'Proyek tidak ditemukan atau telah dihapus sebelumnya.',
            ], 404);
        }

        $projectName = $project->project_name;
        $projectCode = $project->project_code;

        // Lakukan penghapusan berurutan di dalam Database Transaction untuk memastikan integritas
        DB::transaction(function () use ($project) {
            $project->wbsCategories()->delete();
            $project->sCurveMetrics()->delete();
            $project->subcontractorPackages()->delete();
            $project->weeklyActivities()->delete();
            $project->nextWeekPlans()->delete();
            $project->documents()->delete();
            $project->progressPhotos()->delete();
            $project->hseReports()->delete();
            $project->weeklyMetrics()->delete();
            $project->schedules()->delete();
            $project->delete();
        });

        // Ambil daftar proyek tersisa
        $remainingProjects = Project::orderBy('id', 'asc')->get();

        return response()->json([
            'success' => true,
            'message' => "Proyek '{$projectName}' ({$projectCode}) beserta seluruh data progres berhasil dihapus.",
            'deleted_id' => (int)$id,
            'projects' => $remainingProjects,
        ]);
    }

    /**
     * Endpoint untuk Manual Edit / Override data baris WBS & progres mingguan
     * PUT /api/projects/{project}/wbs/{id?} atau PUT /api/wbs/{id}
     */
    public function updateWbs(Request $request, $projectId = null, $wbsId = null): JsonResponse
    {
        $id = $wbsId ?? $request->input('id') ?? $request->input('wbs_id');
        $targetProjectId = $projectId ?? $request->input('project_id');

        $wbs = null;
        if ($id) {
            $wbs = WbsCategory::find($id);
        }

        $project = null;
        if ($wbs) {
            $project = $wbs->project;
        } elseif ($targetProjectId) {
            $project = Project::find($targetProjectId);
        }

        if (!$project) {
            $project = Project::first();
        }

        if (!$project) {
            return response()->json([
                'success' => false,
                'message' => 'Proyek tidak ditemukan.',
            ], 404);
        }

        $weekLabel = $request->input('week_label') ?? ($wbs ? $wbs->week_label : $project->current_week);

        // Jika wbs belum ditemukan berdasarkan ID, cari berdasarkan project_id, week_label, dan code
        if (!$wbs) {
            $code = $request->input('code') ?? 'A';
            $wbs = WbsCategory::where('project_id', $project->id)
                ->where('week_label', $weekLabel)
                ->where('code', $code)
                ->first();
        }

        // Validasi input
        $validated = $request->validate([
            'code' => ['nullable', 'string', 'max:50'],
            'item' => ['nullable', 'string', 'max:255'],
            'name' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:255'],
            'weight' => ['nullable', 'numeric', 'min:0'],
            'weight_factor' => ['nullable', 'numeric', 'min:0'],
            'prev_week_plan' => ['nullable', 'numeric', 'min:0'],
            'prev_week_actual' => ['nullable', 'numeric', 'min:0'],
            'this_week_plan' => ['nullable', 'numeric', 'min:0'],
            'this_week_actual' => ['nullable', 'numeric', 'min:0'],
            'plan_progress' => ['nullable', 'numeric', 'min:0'],
            'actual_progress' => ['nullable', 'numeric', 'min:0'],
            'cum_plan' => ['nullable', 'numeric', 'min:0'],
            'cum_actual' => ['nullable', 'numeric', 'min:0'],
            'variance' => ['nullable', 'numeric'],
            'status' => ['nullable', 'string', 'max:50'],
            'kpi_status' => ['nullable', 'string', 'max:50'],
            'next_week_plan' => ['nullable', 'string', 'max:500'],
        ]);

        $itemDescription = $validated['description'] ?? $validated['item'] ?? $validated['name'] ?? ($wbs ? $wbs->name : 'WBS Item');
        $code = $validated['code'] ?? ($wbs ? $wbs->code : 'WBS-1');
        $weight = isset($validated['weight_factor']) ? (float)$validated['weight_factor'] : (isset($validated['weight']) ? (float)$validated['weight'] : ($wbs ? (float)$wbs->weight_factor : 10.0));

        $prevPlan = isset($validated['prev_week_plan']) ? (float)$validated['prev_week_plan'] : ($wbs ? (float)$wbs->prev_week_plan : 0.0);
        $prevAct = isset($validated['prev_week_actual']) ? (float)$validated['prev_week_actual'] : ($wbs ? (float)$wbs->prev_week_actual : 0.0);

        $thisPlan = isset($validated['this_week_plan']) ? (float)$validated['this_week_plan'] : (isset($validated['plan_progress']) ? (float)$validated['plan_progress'] : ($wbs ? (float)$wbs->this_week_plan : 0.0));
        $thisAct = isset($validated['this_week_actual']) ? (float)$validated['this_week_actual'] : (isset($validated['actual_progress']) ? (float)$validated['actual_progress'] : ($wbs ? (float)$wbs->this_week_actual : 0.0));

        // Kumulatif: jika user menginput langsung cum_plan/cum_actual atau plan_progress, gunakan yang diinput
        if (isset($validated['cum_plan'])) {
            $cumPlan = (float)$validated['cum_plan'];
        } else {
            $cumPlan = round($prevPlan + $thisPlan, 2);
        }

        if (isset($validated['cum_actual'])) {
            $cumAct = (float)$validated['cum_actual'];
        } else {
            $cumAct = round($prevAct + $thisAct, 2);
        }

        $variance = isset($validated['variance']) ? (float)$validated['variance'] : round($cumAct - $cumPlan, 2);

        // Status badge
        $status = $validated['kpi_status'] ?? $validated['status'] ?? ($cumAct >= 100 ? 'Completed' : ($variance >= 0 ? 'Ahead' : 'Delayed'));

        if ($wbs) {
            $wbs->update([
                'code' => $code,
                'name' => $itemDescription,
                'weight_factor' => $weight,
                'prev_week_plan' => $prevPlan,
                'prev_week_actual' => $prevAct,
                'this_week_plan' => $thisPlan,
                'this_week_actual' => $thisAct,
                'cum_plan' => $cumPlan,
                'cum_actual' => $cumAct,
                'variance' => $variance,
            ]);
        } else {
            $wbs = WbsCategory::create([
                'project_id' => $project->id,
                'week_label' => $weekLabel,
                'code' => $code,
                'name' => $itemDescription,
                'weight_factor' => $weight,
                'prev_week_plan' => $prevPlan,
                'prev_week_actual' => $prevAct,
                'this_week_plan' => $thisPlan,
                'this_week_actual' => $thisAct,
                'cum_plan' => $cumPlan,
                'cum_actual' => $cumAct,
                'variance' => $variance,
                'sort_order' => 1,
            ]);
        }

        // Simpan catatan next_week_plan jika diberikan
        if (!empty($validated['next_week_plan'])) {
            WeeklyActivity::updateOrCreate(
                [
                    'project_id' => $project->id,
                    'week_label' => $weekLabel,
                    'activity_type' => 'next_week_plan',
                    'discipline' => 'General',
                ],
                [
                    'description' => trim($validated['next_week_plan']),
                    'sort_order' => 1,
                ]
            );
        }

        // Recalculate totals untuk minggu ini
        $allWbs = WbsCategory::where('project_id', $project->id)
            ->where('week_label', $weekLabel)
            ->get();

        $totalCumPlan = round(min(100.0, $allWbs->sum('cum_plan')), 2);
        $totalCumAct = round(min(100.0, $allWbs->sum('cum_actual')), 2);
        $overallDeviation = round($totalCumAct - $totalCumPlan, 2);
        $overallStatus = $overallDeviation > 0 ? 'Ahead' : ($overallDeviation < 0 ? 'Delayed' : 'On Track');

        preg_match('/\d+/', $weekLabel, $wMatches);
        $weekNumber = !empty($wMatches) ? (int)$wMatches[0] : 12;

        // Update ProjectWeeklyMetric untuk minggu ini
        ProjectWeeklyMetric::updateOrCreate(
            [
                'project_id' => $project->id,
                'week_label' => $weekLabel,
            ],
            [
                'week_number' => $weekNumber,
                'cutoff_date' => now()->toDateString(),
                'plan_cumulative' => $totalCumPlan,
                'actual_cumulative' => $totalCumAct,
                'deviation' => $overallDeviation,
                'status' => $overallStatus,
                'highlights' => "Diperbarui manual oleh tim pada " . now()->format('d M Y H:i WITA'),
            ]
        );

        // Update Master Project jika minggu yang diedit adalah minggu aktif proyek
        if ($project->current_week === $weekLabel) {
            $project->update([
                'plan_cumulative' => $totalCumPlan,
                'actual_cumulative' => $totalCumAct,
                'deviation' => $overallDeviation,
                'status' => $overallStatus,
            ]);
        }

        // Update S-Curve point untuk minggu ini
        SCurveMetric::where('project_id', $project->id)
            ->where(function ($q) use ($weekLabel, $weekNumber) {
                $q->where('week_label', $weekLabel)
                  ->orWhere('week_number', $weekNumber);
            })
            ->update([
                'cum_plan' => $totalCumPlan,
                'cum_actual' => $totalCumAct,
            ]);

        return response()->json([
            'success' => true,
            'message' => "Data '{$wbs->name}' berhasil diperbarui.",
            'wbs' => $wbs,
            'overall_metrics' => [
                'plan_cumulative' => $totalCumPlan,
                'actual_cumulative' => $totalCumAct,
                'deviation' => $overallDeviation,
                'status' => $overallStatus,
                'week_label' => $weekLabel,
            ],
        ]);
    }

    /**
     * Endpoint Import Data Progres Mingguan dari Excel / CSV
     * POST /api/projects/{project}/import atau POST /api/import
     */
    public function import(Request $request, $projectId = null): JsonResponse
    {
        $targetProjectId = $projectId ?? $request->input('project_id');
        $project = Project::find($targetProjectId) ?? Project::first();

        if (!$project) {
            return response()->json([
                'success' => false,
                'message' => 'Proyek tidak ditemukan untuk diimpor.',
            ], 404);
        }

        $weekLabel = $request->input('week_label') ?? $request->input('week');
        $parsedRows = [];

        // 1. Cek jika dikirim via JSON rows langsung dari frontend XLSX parser
        if ($request->has('rows') && is_array($request->input('rows'))) {
            $parsedRows = $request->input('rows');
        }
        // 2. Cek jika dikirim berupa file upload .csv / .xlsx
        elseif ($request->hasFile('file')) {
            $request->validate([
                'file' => 'required|file|mimes:csv,txt,xlsx,xls|max:20480',
            ]);
            $file = $request->file('file');
            $extension = strtolower($file->getClientOriginalExtension());

            if ($extension === 'csv' || $extension === 'txt') {
                $handle = fopen($file->getRealPath(), 'r');
                $header = null;
                $lineIndex = 0;

                while (($data = fgetcsv($handle, 2000, ',')) !== false) {
                    $lineIndex++;
                    if ($lineIndex === 1) {
                        $header = array_map(function ($h) {
                            return strtolower(trim(preg_replace('/[^a-zA-Z0-9]/', '', $h)));
                        }, $data);
                        continue;
                    }

                    if (empty(array_filter($data))) continue;

                    $row = [];
                    foreach ($header as $idx => $colName) {
                        $row[$colName] = $data[$idx] ?? '';
                    }

                    $cleanNum = function ($val, $default = 0) {
                        $c = preg_replace('/[^0-9.-]/', '', (string)$val);
                        return is_numeric($c) ? (float)$c : $default;
                    };

                    $code = $row['wbscode'] ?? $row['code'] ?? ('WBS-' . $lineIndex);
                    $item = $row['itemdescription'] ?? $row['item'] ?? $row['description'] ?? ('Item ' . $lineIndex);
                    $weight = $cleanNum($row['weightfactor'] ?? $row['weight'] ?? 0);
                    $prevPlan = $cleanNum($row['prevweekplan'] ?? $row['prevplan'] ?? 0);
                    $prevAct = $cleanNum($row['prevweekactual'] ?? $row['prevactual'] ?? 0);
                    $thisPlan = $cleanNum($row['thisweekplan'] ?? $row['thisplan'] ?? 0);
                    $thisAct = $cleanNum($row['thisweekactual'] ?? $row['thisactual'] ?? 0);
                    $cumPlan = $cleanNum($row['cumulativeplan'] ?? $row['cumplan'] ?? ($prevPlan + $thisPlan));
                    $cumAct = $cleanNum($row['cumulativeactual'] ?? $row['cumactual'] ?? ($prevAct + $thisAct));
                    $variance = $cleanNum($row['variance'] ?? ($cumAct - $cumPlan));
                    $status = $row['status'] ?? ($cumAct >= 100 ? 'Completed' : ($variance >= 0 ? 'Ahead' : 'Delayed'));

                    $parsedRows[] = [
                        'code' => $code,
                        'item' => $item,
                        'weight' => $weight,
                        'prevWeek' => ['plan' => $prevPlan, 'actual' => $prevAct],
                        'thisWeek' => ['plan' => $thisPlan, 'actual' => $thisAct],
                        'cumulative' => ['plan' => $cumPlan, 'actual' => $cumAct],
                        'variance' => $variance,
                        'status' => $status,
                    ];
                }
                fclose($handle);
            }
        }

        if (empty($parsedRows)) {
            return response()->json([
                'success' => false,
                'message' => 'Tidak ada baris data WBS yang valid untuk diimpor. Pastikan format kolom sesuai template.',
            ], 422);
        }

        // Tentukan week label jika belum ditentukan
        if (!$weekLabel) {
            $latestMetric = ProjectWeeklyMetric::where('project_id', $project->id)
                ->orderBy('week_number', 'desc')
                ->first();
            $nextWeekNum = $latestMetric ? ($latestMetric->week_number + 1) : 13;
            $weekLabel = 'Week ' . $nextWeekNum;
        }

        preg_match('/\d+/', $weekLabel, $wNumMatches);
        $weekNumber = !empty($wNumMatches) ? (int)$wNumMatches[0] : 13;

        // 3. Simpan baris-baris WBS ke tabel `wbs_categories`
        // Hapus entri lama untuk minggu ini agar tidak duplikat
        WbsCategory::where('project_id', $project->id)
            ->where('week_label', $weekLabel)
            ->delete();

        $totalCumPlan = 0;
        $totalCumAct = 0;
        $sortOrder = 1;

        foreach ($parsedRows as $row) {
            $code = $row['code'] ?? ('WBS-' . $sortOrder);
            $name = $row['item'] ?? ('Item ' . $sortOrder);
            $weight = (float)($row['weight'] ?? 0);
            $prevPlan = (float)($row['prevWeek']['plan'] ?? $row['prev_week_plan'] ?? 0);
            $prevAct = (float)($row['prevWeek']['actual'] ?? $row['prev_week_actual'] ?? 0);
            $thisPlan = (float)($row['thisWeek']['plan'] ?? $row['this_week_plan'] ?? 0);
            $thisAct = (float)($row['thisWeek']['actual'] ?? $row['this_week_actual'] ?? 0);
            $cumPlan = (float)($row['cumulative']['plan'] ?? $row['cum_plan'] ?? ($prevPlan + $thisPlan));
            $cumAct = (float)($row['cumulative']['actual'] ?? $row['cum_actual'] ?? ($prevAct + $thisAct));
            $variance = (float)($row['variance'] ?? ($cumAct - $cumPlan));

            $totalCumPlan += $cumPlan;
            $totalCumAct += $cumAct;

            WbsCategory::create([
                'project_id' => $project->id,
                'week_label' => $weekLabel,
                'code' => $code,
                'name' => $name,
                'weight_factor' => $weight,
                'prev_week_plan' => $prevPlan,
                'prev_week_actual' => $prevAct,
                'this_week_plan' => $thisPlan,
                'this_week_actual' => $thisAct,
                'cum_plan' => $cumPlan,
                'cum_actual' => $cumAct,
                'variance' => $variance,
                'sort_order' => $sortOrder++,
            ]);
        }

        // Normalisasi total kumulatif bila lebih dari 100
        $finalCumPlan = round(min(100.0, $totalCumPlan), 2);
        $finalCumAct = round(min(100.0, $totalCumAct), 2);
        $finalDeviation = round($finalCumAct - $finalCumPlan, 2);
        $status = $finalDeviation > 0 ? 'Ahead' : ($finalDeviation < 0 ? 'Delayed' : 'On Track');

        // 4. Update / Buat snapshot `project_weekly_metrics`
        ProjectWeeklyMetric::updateOrCreate(
            [
                'project_id' => $project->id,
                'week_label' => $weekLabel,
            ],
            [
                'week_number' => $weekNumber,
                'cutoff_date' => now()->toDateString(),
                'plan_cumulative' => $finalCumPlan,
                'actual_cumulative' => $finalCumAct,
                'deviation' => $finalDeviation,
                'status' => $status,
                'highlights' => "Diimpor melalui file data progres pada " . now()->format('d M Y H:i WITA'),
            ]
        );

        // Update project master jika minggu ini lebih baru
        $project->update([
            'current_week' => $weekLabel,
            'cutoff_date' => now()->toDateString(),
            'plan_cumulative' => $finalCumPlan,
            'actual_cumulative' => $finalCumAct,
            'deviation' => $finalDeviation,
            'status' => $status,
        ]);

        // 5. Update / Sinkronisasi ke tabel `s_curve_metrics` agar grafik langsung sinkron
        $existingSC = SCurveMetric::where('project_id', $project->id)
            ->where('week_number', $weekNumber)
            ->first();

        SCurveMetric::updateOrCreate(
            [
                'project_id' => $project->id,
                'week_number' => $weekNumber,
            ],
            [
                'week_label' => $weekLabel,
                'cutoff_date' => now()->toDateString(),
                'cum_plan' => $finalCumPlan,
                'cum_actual' => $finalCumAct,
                'cum_forecast' => ($existingSC && $existingSC->cum_forecast !== null) ? $existingSC->cum_forecast : $finalCumAct,
            ]
        );

        return response()->json([
            'success' => true,
            'message' => "Data progres berhasil diimpor ke {$project->project_name} untuk {$weekLabel}.",
            'imported_week' => $weekLabel,
            'rows_count' => count($parsedRows),
            'metrics' => [
                'plan' => $finalCumPlan,
                'actual' => $finalCumAct,
                'deviation' => $finalDeviation,
                'status' => $status,
            ],
        ]);
    }

    /**
     * Endpoint Download Template CSV Standar
     * GET /api/template/download
     */
    public function downloadTemplate(): StreamedResponse
    {
        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="Energy_Equity_Progress_Template.csv"',
        ];

        return response()->stream(function () {
            $handle = fopen('php://output', 'w');
            fputcsv($handle, [
                'No',
                'WBS Code',
                'Item Description',
                'Weight Factor (%)',
                'Prev Week Plan (%)',
                'Prev Week Actual (%)',
                'This Week Plan (%)',
                'This Week Actual (%)',
                'Cumulative Plan (%)',
                'Cumulative Actual (%)',
                'Variance (%)',
                'Status'
            ]);

            $sampleRows = [
                ['1', 'A', 'PREPARATION', '3.06', '3.06', '3.06', '0.00', '0.00', '3.06', '3.06', '0.00', 'Completed'],
                ['2', 'B.1', 'ENGINEERING', '2.54', '2.54', '2.54', '0.00', '0.00', '2.54', '2.54', '0.00', 'Completed'],
                ['3', 'B.2', 'PROCUREMENT', '77.85', '74.45', '76.28', '0.47', '0.75', '74.92', '77.03', '2.11', 'Ahead'],
                ['4', 'B.3', 'CONSTRUCTION', '15.17', '9.06', '10.32', '0.47', '0.73', '9.53', '11.05', '1.52', 'Ahead'],
                ['5', 'B.4', 'PRE-COMMISSIONING & START UP', '1.37', '0.00', '0.00', '0.00', '0.00', '0.00', '0.00', '0.00', 'On Track'],
            ];

            foreach ($sampleRows as $row) {
                fputcsv($handle, $row);
            }
            fclose($handle);
        }, 200, $headers);
    }

    /**
     * Endpoint API: Ambil galeri foto progres per proyek dan per minggu
     * GET /api/project-photos?project_id=...&week=...
     */
    public function getPhotos(Request $request): JsonResponse
    {
        $projectId = $request->query('project_id');
        $weekLabel = $request->query('week') ?: $request->query('week_label');

        $query = ProgressPhoto::query();

        if ($projectId) {
            $rawId = is_numeric($projectId) ? $projectId : str_replace('proj-', '', $projectId);
            $query->where('project_id', $rawId);
        }

        if ($weekLabel) {
            $query->where('week_label', $weekLabel);
        }

        $photos = $query->latest('id')->get();

        return response()->json([
            'success' => true,
            'photos' => $photos,
        ]);
    }

    /**
     * Endpoint API: Unggah foto dokumentasi progres mingguan (This Week Progress)
     * POST /api/project-photos
     */
    public function uploadPhoto(Request $request): JsonResponse
    {
        $request->validate([
            'project_id' => 'required',
            'week' => 'nullable|string|max:50',
            'week_label' => 'nullable|string|max:50',
            'title' => 'nullable|string|max:255',
            'caption' => 'nullable|string',
            'location' => 'nullable|string|max:255',
            'taken_at' => 'nullable|date',
            'photo' => 'nullable|file|image|mimes:jpeg,png,jpg,webp,gif|max:10240',
            'image' => 'nullable|file|image|mimes:jpeg,png,jpg,webp,gif|max:10240',
            'file' => 'nullable|file|image|mimes:jpeg,png,jpg,webp,gif|max:10240',
        ]);

        $file = $request->file('photo') ?? $request->file('image') ?? $request->file('file');

        if (!$file) {
            return response()->json([
                'success' => false,
                'message' => 'Berkas gambar belum dipilih atau tidak valid. Silakan pilih file gambar (JPG, PNG, WEBP).',
            ], 422);
        }

        // Resolusi ID Proyek
        $rawProjectId = $request->input('project_id');
        if (!is_numeric($rawProjectId)) {
            $rawProjectId = str_replace('proj-', '', $rawProjectId);
        }

        $project = Project::find($rawProjectId);
        if (!$project) {
            return response()->json([
                'success' => false,
                'message' => "Proyek dengan ID {$rawProjectId} tidak ditemukan.",
            ], 404);
        }

        // Resolusi label minggu dan teks ter-sanitasi
        $weekLabel = strip_tags(trim($request->input('week') ?: $request->input('week_label') ?: ($project->current_week ?: 'Week 12')));

        // Resolusi caption dan title anti-XSS
        $rawCaption = $request->input('caption') ?: $request->input('title') ?: ('Dokumentasi Progres ' . $weekLabel);
        $caption = strip_tags(trim($rawCaption));
        $title = strip_tags(trim($request->input('title') ?: Str::limit($caption, 60)));
        $location = strip_tags(trim($request->input('location') ?: ($project->location ?: 'Sengkang Field, Wajo')));
        $takenAt = $request->input('taken_at') ?: date('Y-m-d');

        // Simpan file gambar dengan nama acak aman
        $rawExt = strtolower($file->extension() ?: $file->getClientOriginalExtension() ?: 'jpg');
        $allowedImageExts = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
        $extension = in_array($rawExt, $allowedImageExts) ? $rawExt : 'jpg';
        $fileName = 'photo_' . $project->id . '_' . Str::slug($weekLabel) . '_' . time() . '_' . Str::random(8) . '.' . $extension;

        // 1. Simpan ke storage disk public (storage/app/public/project-photos)
        $storedPath = $file->storeAs('project-photos', $fileName, 'public');
        $webPath = '/storage/' . $storedPath;

        // 2. Redundansi salinan ke public/uploads/project-photos agar selalu bisa diakses langsung via web server
        $publicDir = public_path('uploads/project-photos');
        if (!file_exists($publicDir)) {
            @mkdir($publicDir, 0755, true);
        }
        @copy(storage_path('app/public/' . $storedPath), $publicDir . DIRECTORY_SEPARATOR . $fileName);

        // 3. Simpan ke database
        $photoRecord = ProgressPhoto::create([
            'project_id' => $project->id,
            'week_label' => $weekLabel,
            'title' => $title,
            'caption' => $caption,
            'image_path' => $webPath,
            'taken_at' => $takenAt,
            'location' => $location,
        ]);

        // Muat daftar foto terbaru untuk project & week ini
        $photos = ProgressPhoto::where('project_id', $project->id)
            ->where('week_label', $weekLabel)
            ->latest('id')
            ->get();

        return response()->json([
            'success' => true,
            'message' => "Foto dokumentasi \"{$title}\" berhasil diunggah untuk {$project->project_name} ({$weekLabel}).",
            'photo' => $photoRecord,
            'photos' => $photos,
        ], 201);
    }

    /**
     * Endpoint API: Hapus foto dokumentasi progres
     * DELETE /api/project-photos/{id}
     */
    public function deletePhoto(Request $request, $id): JsonResponse
    {
        $photo = ProgressPhoto::find($id);
        if (!$photo) {
            return response()->json([
                'success' => false,
                'message' => "Dokumentasi foto dengan ID {$id} tidak ditemukan.",
            ], 404);
        }

        $projectId = $photo->project_id;
        $weekLabel = $photo->week_label;
        $title = $photo->title;

        // Hapus fisik file jika ada di storage/app/public
        if (!empty($photo->image_path)) {
            $relativePath = str_replace('/storage/', '', $photo->image_path);
            if (Storage::disk('public')->exists($relativePath)) {
                Storage::disk('public')->delete($relativePath);
            }
            $fileName = basename($photo->image_path);
            $publicFallback = public_path('uploads/project-photos/' . $fileName);
            if (file_exists($publicFallback)) {
                @unlink($publicFallback);
            }
        }

        $photo->delete();

        // Ambil daftar foto tersisa untuk project & week ini
        $remainingPhotos = ProgressPhoto::where('project_id', $projectId)
            ->where('week_label', $weekLabel)
            ->latest('id')
            ->get();

        return response()->json([
            'success' => true,
            'message' => "Foto dokumentasi \"{$title}\" berhasil dihapus.",
            'photos' => $remainingPhotos,
        ]);
    }
}
