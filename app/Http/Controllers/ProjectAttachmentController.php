<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use App\Models\Project;
use App\Models\ProjectAttachment;

class ProjectAttachmentController extends Controller
{
    /**
     * Helper untuk memvalidasi hak akses mutasi (Upload & Hapus)
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
                'message' => 'Akses ditolak. Pengguna dengan peran Viewer hanya memiliki izin melihat dan mengunduh dokumen (read-only).',
            ], 403);
        }

        if (!in_array($user->role, ['admin', 'project_control'])) {
            return response()->json([
                'success' => false,
                'message' => 'Akses ditolak. Anda tidak memiliki hak akses untuk mengelola lampiran dokumen.',
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
     * Mengambil daftar lampiran PDF milik proyek tertentu (urut terbaru di atas)
     * GET /api/projects/{project}/attachments
     */
    public function index(Request $request, mixed $project): JsonResponse
    {
        $resolvedId = $this->resolveProjectId($project);
        if (!$resolvedId) {
            return response()->json([
                'success' => false,
                'message' => 'ID Proyek tidak valid.',
            ], 400);
        }

        $projectModel = Project::find($resolvedId);
        if (!$projectModel) {
            return response()->json([
                'success' => false,
                'message' => "Proyek dengan ID {$resolvedId} tidak ditemukan.",
            ], 404);
        }

        $category = strip_tags(trim($request->query('category', '')));
        $search = strip_tags(trim($request->query('search', '')));

        $query = ProjectAttachment::with(['uploader:id,name,job_title'])
            ->where('project_id', $resolvedId);

        if (!empty($category) && $category !== 'ALL') {
            $query->where('category', $category);
        }

        if (!empty($search)) {
            $searchTerm = '%' . trim($search) . '%';
            $query->where(function ($q) use ($searchTerm) {
                $q->where('title', 'like', $searchTerm)
                  ->orWhere('file_name', 'like', $searchTerm)
                  ->orWhere('category', 'like', $searchTerm);
            });
        }

        $attachments = $query->orderBy('id', 'desc')->get();

        return response()->json([
            'success' => true,
            'project_id' => $resolvedId,
            'project_name' => $projectModel->project_name,
            'count' => $attachments->count(),
            'attachments' => $attachments,
        ]);
    }

    /**
     * Upload file lampiran dokumen PDF
     * POST /api/projects/{project}/attachments
     */
    public function store(Request $request, mixed $project): JsonResponse
    {
        // 1. Verifikasi hak akses (Hanya admin & project_control)
        if ($deny = $this->authorizeModification($request)) {
            return $deny;
        }

        $resolvedId = $this->resolveProjectId($project);
        if (!$resolvedId) {
            return response()->json([
                'success' => false,
                'message' => 'ID Proyek tidak valid.',
            ], 400);
        }

        $projectModel = Project::find($resolvedId);
        if (!$projectModel) {
            return response()->json([
                'success' => false,
                'message' => "Proyek dengan ID {$resolvedId} tidak ditemukan.",
            ], 404);
        }

        // 2. Validasi input request
        $validator = Validator::make($request->all(), [
            'file' => 'required|file|mimes:pdf|max:20480', // Maks 20 MB (20480 KB)
            'title' => 'nullable|string|max:255',
            'category' => 'nullable|string|max:100',
        ], [
            'file.required' => 'Berkas file PDF wajib dipilih.',
            'file.file' => 'Berkas yang diunggah harus berupa file yang valid.',
            'file.mimes' => 'Format file tidak didukung. Lampiran harus berupa file dokumen PDF (.pdf).',
            'file.max' => 'Ukuran file terlalu besar. Maksimum ukuran file PDF adalah 20 MB.',
            'title.max' => 'Judul dokumen tidak boleh melebihi 255 karakter.',
            'category.max' => 'Kategori dokumen tidak boleh melebihi 100 karakter.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => $validator->errors()->first(),
                'errors' => $validator->errors(),
            ], 422);
        }

        $file = $request->file('file');
        $originalName = $file->getClientOriginalName();
        $fileSize = $file->getSize();

        // 3. Tentukan judul dokumen
        $title = strip_tags(trim($request->input('title', '')));
        if (empty($title)) {
            // Jika kosong, gunakan nama file asli tanpa ekstensi .pdf
            $title = preg_replace('/\.pdf$/i', '', $originalName);
            $title = strip_tags(trim($title));
        }

        // 4. Tentukan kategori dokumen
        $category = strip_tags(trim($request->input('category', '')));
        if (empty($category)) {
            $category = 'Weekly Report';
        }

        // 5. Simpan file PDF ke storage disk 'public' dalam subfolder 'project_attachments'
        $safeName = 'attachment_' . $resolvedId . '_' . time() . '_' . Str::random(8) . '.pdf';
        $storedPath = $file->storeAs('project_attachments', $safeName, 'public');

        if (!$storedPath) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal menyimpan file ke penyimpanan server.',
            ], 500);
        }

        // 6. Simpan metadata ke database MySQL
        $attachment = ProjectAttachment::create([
            'project_id' => $resolvedId,
            'title' => $title,
            'category' => $category,
            'file_name' => $originalName,
            'file_path' => $storedPath,
            'file_size' => $fileSize,
            'uploaded_by' => $request->user()?->id,
        ]);

        // Muat relasi uploader untuk respons
        $attachment->load('uploader:id,name,job_title');

        return response()->json([
            'success' => true,
            'message' => "Dokumen PDF \"{$title}\" berhasil diunggah ke arsip proyek.",
            'attachment' => $attachment,
        ], 201);
    }

    /**
     * Hapus lampiran PDF (Hapus record database sekaligus file fisik)
     * DELETE /api/projects/{project}/attachments/{attachment}
     */
    public function destroy(Request $request, mixed $project, mixed $attachment): JsonResponse
    {
        // 1. Verifikasi hak akses
        if ($deny = $this->authorizeModification($request)) {
            return $deny;
        }

        $resolvedProjectId = $this->resolveProjectId($project);
        if (!$resolvedProjectId) {
            return response()->json([
                'success' => false,
                'message' => 'ID Proyek tidak valid.',
            ], 400);
        }

        $attachmentId = is_numeric($attachment) ? (int)$attachment : (int)substr($attachment, 4);

        $record = ProjectAttachment::where('id', $attachmentId)
            ->where('project_id', $resolvedProjectId)
            ->first();

        if (!$record) {
            return response()->json([
                'success' => false,
                'message' => 'Dokumen lampiran PDF tidak ditemukan pada proyek ini.',
            ], 404);
        }

        $docTitle = $record->title;
        $filePath = $record->file_path;

        // 2. Hapus file fisik dari storage public jika ada
        if (!empty($filePath) && Storage::disk('public')->exists($filePath)) {
            Storage::disk('public')->delete($filePath);
        }

        // 3. Hapus record dari database
        $record->delete();

        return response()->json([
            'success' => true,
            'message' => "Dokumen lampiran PDF \"{$docTitle}\" berhasil dihapus dari arsip.",
            'deleted_id' => $attachmentId,
        ]);
    }
}
