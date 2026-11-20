<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use App\Models\ProjectDocument;
use App\Models\Project;

class ProjectDocumentController extends Controller
{
    /**
     * Helper untuk membatasi akses modifikasi dokumen
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
                'message' => 'Akses ditolak. Pengguna dengan peran Viewer hanya memiliki hak baca (read-only) dan tidak dapat mengubah dokumen laporan.',
            ], 403);
        }

        if (!in_array($user->role, ['admin', 'project_control'])) {
            return response()->json([
                'success' => false,
                'message' => 'Akses ditolak. Anda tidak memiliki izin untuk menyimpan atau mengedit dokumen ini.',
            ], 403);
        }

        return null;
    }

    /**
     * Helper untuk resolusi ID Proyek ('proj-1' atau numerik)
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
     * Mengambil dokumen sesuai proyek dan week aktif
     * GET /api/project-documents?project_id={id}&week={week}
     * Catatan: Kembalikan data kosong/default dengan status 200 jika belum pernah diisi (jangan 404).
     */
    public function show(Request $request): JsonResponse
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
        $project = $projectId ? Project::find($projectId) : null;

        if (!$project) {
            return response()->json([
                'success' => false,
                'message' => "Proyek dengan ID '{$rawProjectId}' tidak ditemukan.",
                'errors' => [
                    'project_id' => ['Proyek tidak ditemukan di database.'],
                ],
            ], 422);
        }

        $weekLabel = $week && trim($week) !== '' ? trim($week) : ($project->current_week ?: 'Week 12');

        $document = ProjectDocument::where('project_id', $project->id)
            ->where('week', $weekLabel)
            ->first();

        if (!$document) {
            // Data default jika belum pernah disimpan (tetap 200 OK)
            return response()->json([
                'success' => true,
                'exists' => false,
                'document' => [
                    'id' => null,
                    'project_id' => $project->id,
                    'week' => $weekLabel,
                    'title' => "Project Notes & Risk — {$weekLabel}",
                    'content' => '',
                    'updated_by' => null,
                    'updated_at' => null,
                ],
            ], 200);
        }

        return response()->json([
            'success' => true,
            'exists' => true,
            'document' => $document,
        ], 200);
    }

    /**
     * Menyimpan atau memperbarui dokumen (updateOrCreate)
     * POST /api/project-documents
     */
    public function store(Request $request): JsonResponse
    {
        // 1. Verifikasi hak akses (RBAC)
        if ($authError = $this->authorizeModification($request)) {
            return $authError;
        }

        // 2. Validasi input
        $validator = Validator::make($request->all(), [
            'project_id' => ['required'],
            'week' => ['required', 'string', 'max:50'],
            'title' => ['nullable', 'string', 'max:255'],
            'content' => ['nullable', 'string'],
        ], [
            'project_id.required' => 'Proyek wajib dipilih.',
            'week.required' => 'Minggu (week) wajib diisi.',
            'title.max' => 'Judul dokumen maksimal 255 karakter.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal. Silakan periksa kembali data dokumen.',
                'errors' => $validator->errors(),
            ], 422);
        }

        // 3. Resolusi Proyek
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

        $weekLabel = trim($request->input('week'));
        $title = $request->input('title') ? trim($request->input('title')) : "Project Notes & Risk — {$weekLabel}";
        $content = $request->input('content') ?: '';

        $user = $request->user();
        $updatedBy = $user ? $user->name : 'Project Control Engineer';

        // 4. Update or Create
        $document = ProjectDocument::updateOrCreate(
            [
                'project_id' => $project->id,
                'week' => $weekLabel,
            ],
            [
                'title' => $title,
                'content' => $content,
                'updated_by' => $updatedBy,
            ]
        );

        return response()->json([
            'success' => true,
            'message' => "Dokumen laporan untuk {$project->project_name} ({$weekLabel}) berhasil disimpan.",
            'document' => $document,
        ], 200);
    }
}
