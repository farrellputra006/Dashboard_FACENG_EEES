<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use App\Models\User;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $standardUsers = [
            [
                'name' => 'Admin FACENG',
                'email' => 'admin.faceng@example.com',
                'job_title' => 'System Administrator',
                'role' => 'admin',
                'is_active' => true,
                'password' => Hash::make('admin123'),
            ],
            [
                'name' => 'Project Control FACENG',
                'email' => 'control.faceng@example.com',
                'job_title' => 'Project Control Engineer',
                'role' => 'project_control',
                'is_active' => true,
                'password' => Hash::make('control123'),
            ],
            [
                'name' => 'Viewer FACENG',
                'email' => 'viewer.faceng@example.com',
                'job_title' => 'Project Viewer',
                'role' => 'viewer',
                'is_active' => true,
                'password' => Hash::make('viewer123'),
            ],
        ];

        // 1. Update atau buat 3 user standar
        $standardEmails = [];
        $createdUserIds = [];

        foreach ($standardUsers as $userData) {
            $user = User::updateOrCreate(
                ['email' => $userData['email']],
                $userData
            );
            $standardEmails[] = $userData['email'];
            $createdUserIds[$userData['role']] = $user->id;
        }

        $adminId = $createdUserIds['admin'] ?? User::where('role', 'admin')->first()?->id;

        // 2. Bersihkan akun dummy/lama yang memakai nama orang asli secara aman
        $obsoleteUsers = User::whereNotIn('email', $standardEmails)->get();

        foreach ($obsoleteUsers as $oldUser) {
            // Amankan foreign key di project_attachments sebelum menghapus
            DB::table('project_attachments')
                ->where('uploaded_by', $oldUser->id)
                ->update(['uploaded_by' => $adminId]);

            // Hapus token login lama dari personal_access_tokens
            DB::table('personal_access_tokens')
                ->where('tokenable_type', User::class)
                ->where('tokenable_id', $oldUser->id)
                ->delete();

            $oldUser->delete();
        }
    }
}
