<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use App\Models\NextWeekPlan;
use App\Models\Project;

class NextWeekPlanController extends Controller
{
    /**
     * Helper untuk membatasi akses mutasi (Create, Update, Delete)
     * Hanya role 'admin' dan 'project_control' yang diizinkan; 'viewer' ditolak (403).
     */
    protected function authorizeModification(Request $request): ?JsonResponse
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Sesi autentikasi tidak valid atau telah berakhir.',
            ], 401);
        }

        if ($user->role === 'viewer') {
            return response()->json([
                'success' => false,
                'message' => 'Akses ditolak. Pengguna dengan peran Viewer hanya memiliki izin melihat data (read-only).',
            ], 403);
        }

        if (!in_array($user->role, ['admin', 'project_control'])) {
            return response()->json([
                'success' => false,
                'message' => 'Akses ditolak. Anda tidak memiliki hak akses untuk memodifikasi rencana kerja.',
            ], 403);
        }

        return null;
    }

    /**
     * Helper untuk mengonversi project_id dari format 'proj-1' atau numeric
     */
    protected function resolveProjectId(mixed $projectId): ?int
    {
        if (is_string($projectId) && str_starts_with($projectId, 'proj-')) {
            return (int) substr($projectId, 5);
        }
        if (is_numeric($projectId)) {
            return (int) $projectId;
        }
        return null;
    }

    /**
     * Mengambil daftar item to-do berdasarkan proyek dan minggu
     * GET /api/next-week-plans?project_id={id}&week={week}
     */
    public function index(Request $request): JsonResponse
    {
        $rawProjectId = $request->query('project_id');
        $week = $request->query('week');

        if (!$rawProjectId) {
            return response()->json([
                'success' => false,
                'message' => 'Parameter project_id wajib disertakan.',
                'errors' => [
                    'project_id' => ['Parameter project_id wajib diisi.'],
                ],
            ], 422);
        }

        $projectId = $this->resolveProjectId($rawProjectId);
        if (!$projectId || !Project::where('id', $projectId)->exists()) {
            return response()->json([
                'success' => false,
                'message' => "Proyek dengan ID '{$rawProjectId}' tidak ditemukan.",
                'errors' => [
                    'project_id' => ['Proyek tidak ditemukan di database.'],
                ],
            ], 422);
        }

        $query = NextWeekPlan::where('project_id', $projectId);

        if ($week && trim($week) !== '') {
            $query->where('week', trim($week));
        }

        $plans = $query->orderBy('is_completed', 'asc')
            ->orderBy('id', 'asc')
            ->get();

        return response()->json([
            'success' => true,
            'project_id' => $projectId,
            'week' => $week,
            'plans' => $plans,
            'total' => $plans->count(),
            'completed_count' => $plans->where('is_completed', true)->count(),
            'pending_count' => $plans->where('is_completed', false)->count(),
        ]);
    }

    /**
     * Menambah item to-do baru
     * POST /api/next-week-plans
     */
    public function store(Request $request): JsonResponse
    {
        // 1. Verifikasi hak akses (admin & project_control only)
        if ($authError = $this->authorizeModification($request)) {
            return $authError;
        }

        // 2. Validasi input ketat
        $validator = Validator::make($request->all(), [
            'project_id' => ['required'],
            'week' => ['required', 'string', 'max:50'],
            'task_description' => ['required', 'string', 'max:500'],
            'pic' => ['nullable', 'string', 'max:100'],
            'target_date' => ['nullable', 'date'],
            'is_completed' => ['nullable', 'boolean'],
        ], [
            'project_id.required' => 'Proyek wajib dipilih.',
            'week.required' => 'Minggu (week) wajib diisi.',
            'task_description.required' => 'Deskripsi rencana kerja wajib diisi.',
            'task_description.max' => 'Deskripsi rencana kerja maksimal 500 karakter.',
            'target_date.date' => 'Format target tanggal selesai tidak valid.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal. Silakan periksa kembali data yang dimasukkan.',
                'errors' => $validator->errors(),
            ], 422);
        }

        // 3. Validasi isi task_description tidak boleh hanya spasi
        $taskDescription = trim($request->input('task_description', ''));
        if ($taskDescription === '') {
            return response()->json([
                'success' => false,
                'message' => 'Deskripsi rencana kerja tidak boleh kosong atau hanya berisi spasi.',
                'errors' => [
                    'task_description' => ['Deskripsi rencana kerja wajib diisi teks valid.'],
                ],
            ], 422);
        }

        // 4. Validasi keberadaan Proyek di DB
        $projectId = $this->resolveProjectId($request->input('project_id'));
        $project = $projectId ? Project::find($projectId) : null;

        if (!$project) {
            return response()->json([
                'success' => false,
                'message' => "Proyek dengan ID '{$request->input('project_id')}' tidak ditemukan.",
                'errors' => [
                    'project_id' => ['Proyek tidak ditemukan di database.'],
                ],
            ], 422);
        }

        $week = trim($request->input('week'));
        $pic = $request->input('pic') ? trim($request->input('pic')) : null;
        $targetDate = $request->input('target_date') ?: null;
        $isCompleted = filter_var($request->input('is_completed', false), FILTER_VALIDATE_BOOLEAN);

        // 5. Simpan record to-do baru
        $plan = NextWeekPlan::create([
            'project_id' => $project->id,
            'week' => $week,
            'task_description' => $taskDescription,
            'pic' => $pic,
            'target_date' => $targetDate,
            'is_completed' => $isCompleted,
        ]);

        // 6. Ambil daftar terbaru rencana untuk project & week ini
        $plans = NextWeekPlan::where('project_id', $project->id)
            ->where('week', $week)
            ->orderBy('is_completed', 'asc')
            ->orderBy('id', 'asc')
            ->get();

        return response()->json([
            'success' => true,
            'message' => 'Item rencana kerja baru berhasil ditambahkan ke to-do list.',
            'plan' => $plan,
            'plans' => $plans,
        ], 201);
    }

    /**
     * Mengedit isi item to-do atau mengubah status centang (is_completed)
     * PUT/PATCH /api/next-week-plans/{id}
     */
    public function update(Request $request, $id): JsonResponse
    {
        // 1. Verifikasi hak akses
        if ($authError = $this->authorizeModification($request)) {
            return $authError;
        }

        $plan = NextWeekPlan::find($id);
        if (!$plan) {
            return response()->json([
                'success' => false,
                'message' => "Item rencana to-do list dengan ID {$id} tidak ditemukan.",
            ], 404);
        }

        // 2. Validasi input
        $validator = Validator::make($request->all(), [
            'task_description' => ['sometimes', 'string', 'max:500'],
            'pic' => ['nullable', 'string', 'max:100'],
            'target_date' => ['nullable', 'date'],
            'is_completed' => ['sometimes', 'boolean'],
            'week' => ['nullable', 'string', 'max:50'],
        ], [
            'task_description.max' => 'Deskripsi rencana kerja maksimal 500 karakter.',
            'target_date.date' => 'Format target tanggal selesai tidak valid.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal. Silakan periksa kembali data Anda.',
                'errors' => $validator->errors(),
            ], 422);
        }

        // 3. Update task_description jika ada
        if ($request->has('task_description')) {
            $desc = trim($request->input('task_description', ''));
            if ($desc === '') {
                return response()->json([
                    'success' => false,
                    'message' => 'Deskripsi rencana kerja tidak boleh kosong.',
                    'errors' => [
                        'task_description' => ['Deskripsi rencana kerja wajib diisi.'],
                    ],
                ], 422);
            }
            $plan->task_description = $desc;
        }

        // 4. Update is_completed jika ada
        if ($request->has('is_completed')) {
            $plan->is_completed = filter_var($request->input('is_completed'), FILTER_VALIDATE_BOOLEAN);
        }

        // 5. Update PIC & Target Date & Week jika ada
        if ($request->has('pic')) {
            $plan->pic = $request->input('pic') ? trim($request->input('pic')) : null;
        }

        if ($request->has('target_date')) {
            $plan->target_date = $request->input('target_date') ?: null;
        }

        if ($request->has('week')) {
            $plan->week = trim($request->input('week'));
        }

        $plan->save();

        // Ambil daftar terbaru rencana untuk project & week ini
        $plans = NextWeekPlan::where('project_id', $plan->project_id)
            ->where('week', $plan->week)
            ->orderBy('is_completed', 'asc')
            ->orderBy('id', 'asc')
            ->get();

        return response()->json([
            'success' => true,
            'message' => 'Rencana kerja berhasil diperbarui.',
            'plan' => $plan,
            'plans' => $plans,
        ]);
    }

    /**
     * Menghapus item to-do
     * DELETE /api/next-week-plans/{id}
     */
    public function destroy(Request $request, $id): JsonResponse
    {
        // 1. Verifikasi hak akses
        if ($authError = $this->authorizeModification($request)) {
            return $authError;
        }

        $plan = NextWeekPlan::find($id);
        if (!$plan) {
            return response()->json([
                'success' => false,
                'message' => "Item rencana to-do list dengan ID {$id} tidak ditemukan.",
            ], 404);
        }

        $projectId = $plan->project_id;
        $week = $plan->week;
        $taskDescription = $plan->task_description;

        $plan->delete();

        // Ambil daftar sisa to-do list untuk project & week ini
        $remainingPlans = NextWeekPlan::where('project_id', $projectId)
            ->where('week', $week)
            ->orderBy('is_completed', 'asc')
            ->orderBy('id', 'asc')
            ->get();

        return response()->json([
            'success' => true,
            'message' => "Item rencana kerja berhasil dihapus dari to-do list.",
            'deleted_task' => $taskDescription,
            'plans' => $remainingPlans,
        ]);
    }
}
