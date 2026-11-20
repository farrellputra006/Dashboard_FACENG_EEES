<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use App\Models\User;
use App\Models\ProjectAttachment;
use App\Helpers\HtmlSanitizer;

class UserController extends Controller
{
    /**
     * Helper untuk memvalidasi bahwa request dilakukan oleh user dengan role 'admin'
     */
    protected function authorizeAdmin(Request $request): ?JsonResponse
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Sesi autentikasi tidak valid atau telah berakhir.',
            ], 401);
        }

        if ($user->role !== 'admin') {
            return response()->json([
                'success' => false,
                'message' => 'Akses ditolak (403 Forbidden). Fitur Manajemen User hanya dapat diakses oleh Administrator.',
            ], 403);
        }

        return null;
    }

    /**
     * Mengambil daftar seluruh user
     * GET /api/users (Khusus Admin)
     */
    public function index(Request $request): JsonResponse
    {
        if ($deny = $this->authorizeAdmin($request)) {
            return $deny;
        }

        $users = User::select('id', 'name', 'email', 'job_title', 'role', 'is_active', 'created_at', 'updated_at')
            ->orderBy('id', 'asc')
            ->get();

        return response()->json([
            'success' => true,
            'count' => $users->count(),
            'users' => $users,
        ], 200);
    }

    /**
     * Menambah user baru
     * POST /api/users (Khusus Admin)
     */
    public function store(Request $request): JsonResponse
    {
        if ($deny = $this->authorizeAdmin($request)) {
            return $deny;
        }

        $validator = Validator::make($request->all(), [
            'name' => ['required', 'string', 'max:100'],
            'email' => ['required', 'string', 'email', 'max:150', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8'],
            'role' => ['required', Rule::in(['admin', 'project_control', 'viewer'])],
            'job_title' => ['nullable', 'string', 'max:100'],
        ], [
            'name.required' => 'Nama pengguna wajib diisi.',
            'email.required' => 'Alamat email wajib diisi.',
            'email.email' => 'Format email tidak valid.',
            'email.unique' => 'Email ini sudah terdaftar di sistem. Gunakan email lain.',
            'password.required' => 'Kata sandi wajib diisi.',
            'password.min' => 'Kata sandi minimal harus 8 karakter.',
            'role.required' => 'Peran (role) pengguna wajib dipilih.',
            'role.in' => 'Peran pengguna harus salah satu dari: admin, project_control, atau viewer.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => $validator->errors()->first(),
                'errors' => $validator->errors(),
            ], 422);
        }

        $cleanName = HtmlSanitizer::cleanPlainText($request->input('name'));
        $cleanJobTitle = $request->input('job_title') 
            ? HtmlSanitizer::cleanPlainText($request->input('job_title')) 
            : match($request->input('role')) {
                'admin' => 'Administrator FACENG',
                'project_control' => 'Project Control Engineer',
                'viewer' => 'Viewer / Management',
                default => 'Staff FACENG'
            };

        $user = User::create([
            'name' => $cleanName,
            'email' => strtolower(trim($request->input('email'))),
            'password' => Hash::make($request->input('password')),
            'role' => $request->input('role'),
            'job_title' => $cleanJobTitle,
            'is_active' => true,
        ]);

        return response()->json([
            'success' => true,
            'message' => "Pengguna '{$user->name}' ({$user->email}) berhasil ditambahkan.",
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'job_title' => $user->job_title,
                'role' => $user->role,
                'is_active' => $user->is_active,
                'created_at' => $user->created_at,
            ],
        ], 201);
    }

    /**
     * Mengedit user dan reset password opsional
     * PUT /api/users/{id} (Khusus Admin)
     */
    public function update(Request $request, int $id): JsonResponse
    {
        if ($deny = $this->authorizeAdmin($request)) {
            return $deny;
        }

        $user = User::find($id);
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => "Pengguna dengan ID {$id} tidak ditemukan.",
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'name' => ['required', 'string', 'max:100'],
            'email' => ['required', 'string', 'email', 'max:150', Rule::unique('users', 'email')->ignore($user->id)],
            'role' => ['required', Rule::in(['admin', 'project_control', 'viewer'])],
            'job_title' => ['nullable', 'string', 'max:100'],
            'password' => ['nullable', 'string', 'min:8'],
        ], [
            'name.required' => 'Nama pengguna wajib diisi.',
            'email.required' => 'Alamat email wajib diisi.',
            'email.email' => 'Format email tidak valid.',
            'email.unique' => 'Email ini sudah digunakan oleh akun lain.',
            'password.min' => 'Kata sandi baru minimal harus 8 karakter.',
            'role.required' => 'Peran pengguna wajib dipilih.',
            'role.in' => 'Peran pengguna harus salah satu dari: admin, project_control, atau viewer.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => $validator->errors()->first(),
                'errors' => $validator->errors(),
            ], 422);
        }

        // Proteksi: Cegah Admin menurunkan role dirinya sendiri jika ia adalah satu-satunya Admin tersisa
        if ($user->role === 'admin' && $request->input('role') !== 'admin') {
            $adminCount = User::where('role', 'admin')->count();
            if ($adminCount <= 1) {
                return response()->json([
                    'success' => false,
                    'message' => 'Tidak dapat mengubah role ini. Sistem harus memiliki minimal satu akun Administrator yang aktif.',
                ], 422);
            }
        }

        $user->name = HtmlSanitizer::cleanPlainText($request->input('name'));
        $user->email = strtolower(trim($request->input('email')));
        $user->role = $request->input('role');

        if ($request->filled('job_title')) {
            $user->job_title = HtmlSanitizer::cleanPlainText($request->input('job_title'));
        }

        // Update password jika diisi (Fitur Reset Password oleh Admin)
        if ($request->filled('password')) {
            $user->password = Hash::make($request->input('password'));
            // Revoke active tokens for this user so they must re-login with new password
            $user->tokens()->delete();
        }

        $user->save();

        return response()->json([
            'success' => true,
            'message' => "Data pengguna '{$user->name}' berhasil diperbarui.",
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'job_title' => $user->job_title,
                'role' => $user->role,
                'is_active' => $user->is_active,
                'updated_at' => $user->updated_at,
            ],
        ], 200);
    }

    /**
     * Menghapus user secara aman
     * DELETE /api/users/{id} (Khusus Admin)
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        if ($deny = $this->authorizeAdmin($request)) {
            return $deny;
        }

        $currentUser = $request->user();

        // 1. Cegah Admin menghapus akunnya sendiri yang sedang aktif login
        if ($currentUser->id === $id) {
            return response()->json([
                'success' => false,
                'message' => 'Aksi ditolak: Anda tidak dapat menghapus akun Anda sendiri saat sedang aktif login.',
            ], 422);
        }

        $targetUser = User::find($id);
        if (!$targetUser) {
            return response()->json([
                'success' => false,
                'message' => "Pengguna dengan ID {$id} tidak ditemukan.",
            ], 404);
        }

        // 2. Cegah penghapusan jika target adalah Admin terakhir
        if ($targetUser->role === 'admin') {
            $adminCount = User::where('role', 'admin')->count();
            if ($adminCount <= 1) {
                return response()->json([
                    'success' => false,
                    'message' => 'Aksi ditolak: Tidak dapat menghapus Administrator terakhir di dalam sistem.',
                ], 422);
            }
        }

        // 3. Tangani foreign key secara aman tanpa menghapus data lampiran proyek
        ProjectAttachment::where('uploaded_by', $targetUser->id)->update(['uploaded_by' => null]);

        // 4. Hapus token personal access tokens
        $targetUser->tokens()->delete();

        // 5. Hapus akun user
        $userName = $targetUser->name;
        $targetUser->delete();

        return response()->json([
            'success' => true,
            'message' => "Pengguna '{$userName}' berhasil dihapus dari sistem.",
        ], 200);
    }

    /**
     * Ganti Password Mandiri untuk pengguna yang sedang terotentikasi
     * PUT /api/profile/password (Bisa diakses oleh semua role: admin, project_control, viewer)
     */
    public function updatePassword(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Sesi autentikasi tidak valid atau telah berakhir.',
            ], 401);
        }

        // Harmonisasikan confirmation field jika frontend mengirim new_password_confirmation atau confirm_password
        if (!$request->has('new_password_confirmation') && $request->has('confirm_password')) {
            $request->merge(['new_password_confirmation' => $request->input('confirm_password')]);
        }

        $validator = Validator::make($request->all(), [
            'current_password' => ['required', 'string'],
            'new_password' => ['required', 'string', 'min:8', 'confirmed'],
        ], [
            'current_password.required' => 'Password saat ini wajib diisi.',
            'new_password.required' => 'Password baru wajib diisi.',
            'new_password.min' => 'Password baru minimal harus 8 karakter.',
            'new_password.confirmed' => 'Konfirmasi password baru tidak cocok.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => $validator->errors()->first(),
                'errors' => $validator->errors(),
            ], 422);
        }

        // Verifikasi kesesuaian password lama
        if (!Hash::check($request->input('current_password'), $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Password lama tidak sesuai.',
                'errors' => [
                    'current_password' => ['Password lama tidak sesuai.'],
                ],
            ], 422);
        }

        // Simpan password baru ter-enkripsi
        $user->password = Hash::make($request->input('new_password'));
        $user->save();

        return response()->json([
            'success' => true,
            'message' => 'Password Anda berhasil diperbarui. Silakan gunakan password baru saat login berikutnya.',
        ], 200);
    }
}
