<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\User;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $defaultPassword = env('SEED_USER_PASSWORD');
        if (empty($defaultPassword)) {
            $defaultPassword = 'Password123!';
        }

        $users = [
            [
                'name' => 'Administrator',
                'email' => 'admin@example.com',
                'job_title' => 'System Administrator',
                'role' => 'admin',
                'is_active' => true,
                'password' => Hash::make($defaultPassword),
            ],
            [
                'name' => 'Andi Rahman',
                'email' => 'andi.rahman@example.com',
                'job_title' => 'Project Control Engineer',
                'role' => 'project_control',
                'is_active' => true,
                'password' => Hash::make($defaultPassword),
            ],
            [
                'name' => 'Budi Santoso',
                'email' => 'viewer@example.com',
                'job_title' => 'Field Observer',
                'role' => 'viewer',
                'is_active' => true,
                'password' => Hash::make($defaultPassword),
            ],
        ];

        foreach ($users as $userData) {
            User::updateOrCreate(
                ['email' => $userData['email']],
                $userData
            );
        }
    }
}
