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
            ->latest('taken_at')
            ->get();

        if ($progressPhotos->isEmpty()) {
            $progressPhotos = ProgressPhoto::where('project_id', $selectedProject->id)
                ->latest('taken_at')
                ->get();
        }

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

        // Pasangkan relasi ke instance selectedProject
        $selectedProject->setRelation('wbsCategories', $wbsCategories);
        $selectedProject->setRelation('sCurveMetrics', $sCurveMetrics);
        $selectedProject->setRelation('subcontractorPackages', $subcontractorPackages);
        $selectedProject->setRelation('weeklyActivities', $weeklyActivities);
        $selectedProject->setRelation('progressPhotos', $progressPhotos);
        $selectedProject->setRelation('hseReports', $hseReports);
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
        // 2. Cek jika dikirim berupa file upload .csv
        elseif ($request->hasFile('file')) {
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
}
