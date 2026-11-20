<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use App\Models\Project;
use App\Models\ProjectSchedule;
use App\Models\ScheduleWeeklyProgress;
use App\Models\ProjectWeeklyMetric;
use App\Models\SCurveMetric;

class ProjectScheduleController extends Controller
{
    /**
     * Pastikan hanya role admin dan project_control yang boleh melakukan aksi write (tambah/edit/hapus)
     */
    protected function authorizeMutation(Request $request): void
    {
        $user = $request->user();
        if (!$user || !in_array($user->role, ['admin', 'project_control'])) {
            abort(403, 'Akses Ditolak: Role Viewer hanya memiliki akses baca (Read-Only). Hanya Project Control & Admin yang dapat memodifikasi data.');
        }
    }

    /**
     * Hitung ulang bobot seluruh item schedule dalam 1 proyek:
     * weight = (price / total_price_of_project) * 100
     */
    public static function recalculateWeights(int $projectId): void
    {
        $schedules = ProjectSchedule::where('project_id', $projectId)->get();
        if ($schedules->isEmpty()) {
            return;
        }

        $totalPrice = (float) $schedules->sum('price');
        $count = $schedules->count();

        if ($totalPrice > 0) {
            $runningWeight = 0.0;
            $maxSchedule = null;
            $maxPrice = -1;

            foreach ($schedules as $sched) {
                $schedPrice = (float) $sched->price;
                $weight = round(($schedPrice / $totalPrice) * 100, 2);
                $sched->weight = $weight;
                $sched->save();
                $runningWeight += $weight;

                if ($schedPrice > $maxPrice) {
                    $maxPrice = $schedPrice;
                    $maxSchedule = $sched;
                }
            }

            // Normalisasi pembulatan agar total persis 100.00%
            $diff = round(100.00 - $runningWeight, 2);
            if ($diff != 0 && $maxSchedule) {
                $maxSchedule->weight = round((float) $maxSchedule->weight + $diff, 2);
                $maxSchedule->save();
            }
        } else {
            // Jika harga total 0, bagi rata
            $evenWeight = round(100.00 / $count, 2);
            $runningWeight = 0.0;
            foreach ($schedules as $idx => $sched) {
                if ($idx === $count - 1) {
                    $sched->weight = round(100.00 - $runningWeight, 2);
                } else {
                    $sched->weight = $evenWeight;
                    $runningWeight += $evenWeight;
                }
                $sched->save();
            }
        }
    }

    /**
     * GET /api/project-schedules
     * Mengambil daftar schedule item ala MS Project beserta bobot aktual & kumulatif
     */
    public function index(Request $request): JsonResponse
    {
        $projectId = $request->query('project_id');
        $project = $projectId ? Project::find($projectId) : Project::first();

        if (!$project) {
            return response()->json([
                'success' => false,
                'message' => 'Proyek tidak ditemukan.'
            ], 404);
        }

        $weekInput = $request->query('week', $project->current_week ?? 'Week 12');
        preg_match('/\d+/', (string) $weekInput, $matches);
        $currentWeek = !empty($matches) ? (int)$matches[0] : 12;

        $schedules = ProjectSchedule::where('project_id', $project->id)
            ->with(['weeklyProgress'])
            ->orderBy('id', 'asc')
            ->get();

        $totalPrice = 0.0;
        $totalWeight = 0.0;
        $totalActualWeight = 0.0;

        $formattedSchedules = $schedules->map(function ($item) use ($currentWeek, &$totalPrice, &$totalWeight, &$totalActualWeight) {
            $price = (float) $item->price;
            $weight = (float) $item->weight;
            $totalPrice += $price;
            $totalWeight += $weight;

            // Hitung kumulatif aktual bobot hingga minggu aktif
            $cumActual = (float) $item->weeklyProgress
                ->where('week', '<=', $currentWeek)
                ->sum('actual_progress');

            // Nilai bobot aktual (earned weight)
            $actualWeight = min($weight, round($cumActual, 2));
            $totalActualWeight += $actualWeight;

            // Persentase penyelesaian fisik item (0 - 100%)
            $physicalProgress = $weight > 0 ? min(100.0, round(($actualWeight / $weight) * 100, 1)) : 0.0;

            return [
                'id' => $item->id,
                'project_id' => $item->project_id,
                'task_name' => $item->task_name,
                'price' => $price,
                'price_formatted' => 'Rp ' . number_format($price, 0, ',', '.'),
                'weight' => $weight,
                'duration' => $item->duration,
                'start_date' => $item->start_date ? $item->start_date->format('Y-m-d') : null,
                'finish_date' => $item->finish_date ? $item->finish_date->format('Y-m-d') : null,
                'baseline_start' => $item->baseline_start ? $item->baseline_start->format('Y-m-d') : null,
                'baseline_finish' => $item->baseline_finish ? $item->baseline_finish->format('Y-m-d') : null,
                'actual_weight' => $actualWeight,
                'physical_progress' => $physicalProgress,
                'status' => $actualWeight >= $weight ? 'Completed' : ($actualWeight > 0 ? 'In Progress' : 'Not Started'),
            ];
        });

        return response()->json([
            'success' => true,
            'project' => [
                'id' => $project->id,
                'project_code' => $project->project_code,
                'project_name' => $project->project_name,
                'current_week' => 'Week ' . $currentWeek,
                'contract_value' => (float) $project->contract_value,
            ],
            'schedules' => $formattedSchedules,
            'summary' => [
                'total_price' => round($totalPrice, 2),
                'total_price_formatted' => 'Rp ' . number_format($totalPrice, 0, ',', '.'),
                'total_weight' => round($totalWeight, 2),
                'total_actual_weight' => round($totalActualWeight, 2),
                'items_count' => $formattedSchedules->count(),
            ],
        ]);
    }

    /**
     * POST /api/project-schedules
     * Tambah item pekerjaan baru (ala MS Project)
     */
    public function store(Request $request): JsonResponse
    {
        $this->authorizeMutation($request);

        $validated = $request->validate([
            'project_id' => 'required|exists:projects,id',
            'task_name' => 'required|string|max:255',
            'price' => 'required|numeric|min:0',
            'duration' => 'nullable|integer|min:1',
            'start_date' => 'nullable|date',
            'finish_date' => 'nullable|date|after_or_equal:start_date',
            'baseline_start' => 'nullable|date',
            'baseline_finish' => 'nullable|date|after_or_equal:baseline_start',
        ]);

        if (isset($validated['task_name'])) {
            $validated['task_name'] = strip_tags(trim($validated['task_name']));
        }

        $schedule = DB::transaction(function () use ($validated) {
            $item = ProjectSchedule::create($validated);
            self::recalculateWeights($validated['project_id']);
            return $item->fresh();
        });

        return response()->json([
            'success' => true,
            'message' => "Item pekerjaan '{$schedule->task_name}' berhasil ditambahkan.",
            'schedule' => $schedule,
        ], 201);
    }

    /**
     * PUT/PATCH /api/project-schedules/{id}
     * Update item pekerjaan
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $this->authorizeMutation($request);

        $schedule = ProjectSchedule::findOrFail($id);

        $validated = $request->validate([
            'task_name' => 'nullable|string|max:255',
            'price' => 'nullable|numeric|min:0',
            'duration' => 'nullable|integer|min:1',
            'start_date' => 'nullable|date',
            'finish_date' => 'nullable|date',
            'baseline_start' => 'nullable|date',
            'baseline_finish' => 'nullable|date',
        ]);

        if (isset($validated['task_name'])) {
            $validated['task_name'] = strip_tags(trim($validated['task_name']));
        }

        DB::transaction(function () use ($schedule, $validated) {
            $schedule->update($validated);
            self::recalculateWeights($schedule->project_id);
        });

        return response()->json([
            'success' => true,
            'message' => "Data pekerjaan '{$schedule->task_name}' berhasil diperbarui.",
            'schedule' => $schedule->fresh(),
        ]);
    }

    /**
     * DELETE /api/project-schedules/{id}
     * Hapus item pekerjaan
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        $this->authorizeMutation($request);

        $schedule = ProjectSchedule::findOrFail($id);
        $projectId = $schedule->project_id;
        $taskName = $schedule->task_name;

        DB::transaction(function () use ($schedule, $projectId) {
            $schedule->delete();
            self::recalculateWeights($projectId);
        });

        return response()->json([
            'success' => true,
            'message' => "Item pekerjaan '{$taskName}' berhasil dihapus.",
            'deleted_id' => $id,
        ]);
    }

    /**
     * GET /api/progress-summary
     * Menghasilkan data Progress Summary sesuai standar FACENG dengan header bertingkat:
     * No | Item Description | Weight | Previous Week (Plan, Act) | This Week (Plan, Act) | Cumulative Week (Plan, Act) | Variance (Last Week, This Week)
     */
    public function progressSummary(Request $request): JsonResponse
    {
        $projectId = $request->query('project_id');
        $project = $projectId ? Project::find($projectId) : Project::first();

        if (!$project) {
            return response()->json([
                'success' => false,
                'message' => 'Proyek tidak ditemukan.'
            ], 404);
        }

        $weekParam = $request->query('week', $project->current_week ?? 'Week 12');
        preg_match('/\d+/', (string) $weekParam, $matches);
        $targetWeek = !empty($matches) ? (int)$matches[0] : 12;

        // Tentukan tanggal cutoff dan tanggal minggu sebelumnya
        $startDate = $project->start_date ? $project->start_date->format('Y-m-d') : '2024-10-15';
        $currentDateObj = new \DateTime($startDate);
        $currentDateObj->modify('+' . (($targetWeek - 1) * 7) . ' days');
        $currentWeekDate = $project->cutoff_date ? date('d M Y', strtotime($project->cutoff_date)) : $currentDateObj->format('d M Y');

        $prevDateObj = clone $currentDateObj;
        $prevDateObj->modify('-7 days');
        $previousWeekDate = $prevDateObj->format('d M Y');

        // Ambil data schedules beserta weekly progress-nya
        $schedules = ProjectSchedule::where('project_id', $project->id)
            ->with(['weeklyProgress'])
            ->orderBy('id', 'asc')
            ->get();

        $rows = [];
        $totalWeight = 0.0;
        $totalPrevPlan = 0.0;
        $totalPrevAct = 0.0;
        $totalThisPlan = 0.0;
        $totalThisAct = 0.0;
        $totalCumPlan = 0.0;
        $totalCumAct = 0.0;
        $totalLastWeekVariance = 0.0;
        $totalThisWeekVariance = 0.0;

        foreach ($schedules as $index => $item) {
            $weight = (float) $item->weight;
            $totalWeight += $weight;

            // Progres kumulatif sebelum minggu aktif (< targetWeek)
            $prevPlan = (float) $item->weeklyProgress->where('week', '<', $targetWeek)->sum('plan_progress');
            $prevAct = (float) $item->weeklyProgress->where('week', '<', $targetWeek)->sum('actual_progress');

            // Progres khusus minggu aktif (== targetWeek)
            $thisWeekRow = $item->weeklyProgress->where('week', $targetWeek)->first();
            $thisPlan = $thisWeekRow ? (float) $thisWeekRow->plan_progress : 0.0;
            $thisAct = $thisWeekRow ? (float) $thisWeekRow->actual_progress : 0.0;

            // Kumulatif (Previous + This Week)
            $cumPlan = round($prevPlan + $thisPlan, 2);
            $cumAct = round($prevAct + $thisAct, 2);

            // Variance: Actual - Plan
            $lastWeekVariance = round($prevAct - $prevPlan, 2);
            $thisWeekVariance = round($cumAct - $cumPlan, 2);

            $totalPrevPlan += $prevPlan;
            $totalPrevAct += $prevAct;
            $totalThisPlan += $thisPlan;
            $totalThisAct += $thisAct;
            $totalCumPlan += $cumPlan;
            $totalCumAct += $cumAct;
            $totalLastWeekVariance += $lastWeekVariance;
            $totalThisWeekVariance += $thisWeekVariance;

            // Status evaluasi baris
            $status = 'On Track';
            if ($cumAct >= $weight && $weight > 0) {
                $status = 'Completed';
            } elseif ($thisWeekVariance > 0.05) {
                $status = 'Ahead';
            } elseif ($thisWeekVariance < -0.05) {
                $status = 'Delayed';
            }

            $rows[] = [
                'no' => $index + 1,
                'id' => $item->id,
                'item_description' => $item->task_name,
                'weight' => $weight,
                'previous_week' => [
                    'plan' => round($prevPlan, 2),
                    'actual' => round($prevAct, 2),
                ],
                'this_week' => [
                    'plan' => round($thisPlan, 2),
                    'actual' => round($thisAct, 2),
                ],
                'cumulative_week' => [
                    'plan' => $cumPlan,
                    'actual' => $cumAct,
                ],
                'variance' => [
                    'last_week' => $lastWeekVariance,
                    'this_week' => $thisWeekVariance,
                ],
                'status' => $status,
            ];
        }

        // Baris rangkuman paling bawah: TOTAL / OVERALL PROGRESS
        $overallTotal = [
            'no' => '',
            'item_description' => 'TOTAL / OVERALL PROGRESS',
            'weight' => round($totalWeight, 2),
            'previous_week' => [
                'plan' => round($totalPrevPlan, 2),
                'actual' => round($totalPrevAct, 2),
            ],
            'this_week' => [
                'plan' => round($totalThisPlan, 2),
                'actual' => round($totalThisAct, 2),
            ],
            'cumulative_week' => [
                'plan' => round($totalCumPlan, 2),
                'actual' => round($totalCumAct, 2),
            ],
            'variance' => [
                'last_week' => round($totalLastWeekVariance, 2),
                'this_week' => round($totalThisWeekVariance, 2),
            ],
            'status' => $totalThisWeekVariance >= 0 ? 'Ahead' : 'Delayed',
        ];

        // S-Curve series across weeks
        $scurveSeries = SCurveMetric::where('project_id', $project->id)
            ->orderBy('week_number', 'asc')
            ->get()
            ->map(function ($sc) use ($targetWeek, $project) {
                $plan = (float) $sc->cum_plan;
                $actual = $sc->week_number <= $targetWeek ? ($sc->cum_actual !== null ? (float) $sc->cum_actual : null) : null;
                
                // Forecast: Selalu tersedia dari minggu target ke depan (lanjutkan tren jika null)
                $forecast = null;
                if ($sc->week_number >= $targetWeek) {
                    if ($sc->cum_forecast !== null) {
                        $forecast = (float) $sc->cum_forecast;
                    } else {
                        $baseAct = (float) ($project->actual_cumulative ?? 93.45);
                        $forecast = round(min(100.00, $baseAct + (($sc->week_number - $targetWeek) * 0.73)), 2);
                    }
                }

                return [
                    'week' => $sc->week_label,
                    'week_number' => $sc->week_number,
                    'date' => $sc->cutoff_date ? date('d-M', strtotime($sc->cutoff_date)) : '',
                    'plan' => $plan,
                    'actual' => $actual,
                    'forecast' => $forecast,
                ];
            });

        return response()->json([
            'success' => true,
            'project' => [
                'id' => $project->id,
                'project_code' => $project->project_code,
                'project_name' => $project->project_name,
                'current_week' => 'Week ' . $targetWeek,
                'plan_cumulative' => round($totalCumPlan, 2),
                'actual_cumulative' => round($totalCumAct, 2),
                'deviation' => round($totalThisWeekVariance, 2),
                'status' => $totalThisWeekVariance >= 0 ? 'Ahead' : 'Delayed',
            ],
            'headers' => [
                'previous_week_date' => $previousWeekDate,
                'current_week_date' => $currentWeekDate,
                'week_number' => $targetWeek,
            ],
            'rows' => $rows,
            'total' => $overallTotal,
            'scurve_series' => $scurveSeries,
        ]);
    }

    /**
     * POST /api/schedule-weekly-progress
     * Update nilai This Week Plan dan This Week Act per item pekerjaan
     */
    public function saveWeeklyProgress(Request $request): JsonResponse
    {
        $this->authorizeMutation($request);

        $validated = $request->validate([
            'project_schedule_id' => 'required|exists:project_schedules,id',
            'week' => 'required',
            'plan_progress' => 'required|numeric|min:0',
            'actual_progress' => 'required|numeric|min:0',
            'forecast_progress' => 'nullable|numeric|min:0',
            'forecast' => 'nullable|numeric|min:0',
            'week_date' => 'nullable|date',
        ]);

        preg_match('/\d+/', (string) $validated['week'], $matches);
        $weekNumber = !empty($matches) ? (int)$matches[0] : 12;

        $schedule = ProjectSchedule::findOrFail($validated['project_schedule_id']);
        $projectId = $schedule->project_id;

        DB::transaction(function () use ($schedule, $weekNumber, $validated, $projectId) {
            $forecastProgress = isset($validated['forecast_progress'])
                ? (float) $validated['forecast_progress']
                : (isset($validated['forecast']) ? (float) $validated['forecast'] : null);

            ScheduleWeeklyProgress::updateOrCreate(
                [
                    'project_schedule_id' => $schedule->id,
                    'week' => $weekNumber,
                ],
                [
                    'week_date' => $validated['week_date'] ?? now()->format('Y-m-d'),
                    'plan_progress' => (float) $validated['plan_progress'],
                    'actual_progress' => (float) $validated['actual_progress'],
                    'forecast_progress' => $forecastProgress,
                ]
            );

            // Hitung total kumulatif proyek untuk minggu tersebut dan update ProjectWeeklyMetric & Project
            $allSchedules = ProjectSchedule::where('project_id', $projectId)->with('weeklyProgress')->get();
            $totalCumPlan = 0.0;
            $totalCumAct = 0.0;
            $totalCumForecast = 0.0;
            $hasExplicitForecast = false;

            foreach ($allSchedules as $s) {
                $cumP = (float) $s->weeklyProgress->where('week', '<=', $weekNumber)->sum('plan_progress');
                $cumA = (float) $s->weeklyProgress->where('week', '<=', $weekNumber)->sum('actual_progress');
                $cumF = (float) $s->weeklyProgress->where('week', '<=', $weekNumber)->sum('forecast_progress');
                $totalCumPlan += $cumP;
                $totalCumAct += $cumA;
                if ($cumF > 0) {
                    $hasExplicitForecast = true;
                    $totalCumForecast += $cumF;
                }
            }

            $deviation = round($totalCumAct - $totalCumPlan, 2);
            $status = $deviation >= 0 ? 'Ahead' : 'Delayed';

            // Update snapshot mingguan
            ProjectWeeklyMetric::updateOrCreate(
                [
                    'project_id' => $projectId,
                    'week_label' => 'Week ' . $weekNumber,
                ],
                [
                    'plan_cumulative' => round($totalCumPlan, 2),
                    'actual_cumulative' => round($totalCumAct, 2),
                    'deviation' => $deviation,
                    'status' => $status,
                ]
            );

            // Update master project jika minggu saat ini sama
            $project = Project::find($projectId);
            if ($project) {
                preg_match('/\d+/', (string) $project->current_week, $currMatches);
                $currW = !empty($currMatches) ? (int)$currMatches[0] : 12;
                if ($currW == $weekNumber) {
                    $project->update([
                        'plan_cumulative' => round($totalCumPlan, 2),
                        'actual_cumulative' => round($totalCumAct, 2),
                        'deviation' => $deviation,
                        'status' => $status,
                    ]);
                }
            }

            // Update record di scurve_metrics (pertahankan forecast jika ada atau gunakan tren actual)
            $existingMetric = SCurveMetric::where('project_id', $projectId)
                ->where('week_number', $weekNumber)
                ->first();

            $forecastValue = $hasExplicitForecast
                ? round($totalCumForecast, 2)
                : ($existingMetric && $existingMetric->cum_forecast !== null ? $existingMetric->cum_forecast : round($totalCumAct, 2));

            SCurveMetric::updateOrCreate(
                [
                    'project_id' => $projectId,
                    'week_number' => $weekNumber,
                ],
                [
                    'week_label' => 'Week ' . $weekNumber,
                    'cum_plan' => round($totalCumPlan, 2),
                    'cum_actual' => round($totalCumAct, 2),
                    'cum_forecast' => $forecastValue,
                ]
            );
        });

        return response()->json([
            'success' => true,
            'message' => "Progres mingguan item '{$schedule->task_name}' untuk Week {$weekNumber} berhasil disimpan.",
        ]);
    }
}
