<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\NextWeekPlanController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\ProjectAttachmentController;
use App\Http\Controllers\ProjectDocumentController;
use App\Http\Controllers\ProjectScheduleController;
use App\Http\Controllers\UserController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// Public Authentication Route with Rate Limiter (Max 5 attempts per minute)
Route::post('/login', [AuthController::class, 'login'])
    ->middleware('throttle:5,1')
    ->name('api.login');

// Public Template Download
Route::get('/template/download', [DashboardController::class, 'downloadTemplate'])
    ->name('api.template.download');

// Protected Routes (Laravel Sanctum Token Authenticated)
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/me', [AuthController::class, 'me'])->name('api.me');
    Route::post('/logout', [AuthController::class, 'logout'])->name('api.logout');

    // Project Control Dashboard Endpoints
    Route::get('/dashboard', [DashboardController::class, 'api'])->name('api.dashboard');
    Route::get('/projects', [DashboardController::class, 'index'])->name('api.projects');
    Route::post('/projects', [DashboardController::class, 'store'])->name('api.projects.store');
    Route::delete('/projects/{project}', [DashboardController::class, 'destroy'])->name('api.projects.destroy');
    Route::post('/projects/{project}/import', [DashboardController::class, 'import'])->name('api.projects.import');
    Route::post('/import', [DashboardController::class, 'import'])->name('api.import');

    // Hybrid Data Management (Manual Edit / Override WBS Categories)
    Route::match(['put', 'patch'], '/projects/{project}/wbs/{id?}', [DashboardController::class, 'updateWbs'])->name('api.projects.wbs.update');
    Route::match(['put', 'patch'], '/wbs/{id}', [DashboardController::class, 'updateWbs'])->name('api.wbs.update');

    // Visual Progress Documentation Photos
    Route::get('/project-photos', [DashboardController::class, 'getPhotos'])->name('api.project-photos.index');
    Route::post('/project-photos', [DashboardController::class, 'uploadPhoto'])->name('api.project-photos.store');
    Route::delete('/project-photos/{id}', [DashboardController::class, 'deletePhoto'])->name('api.project-photos.destroy');

    // Next Week Plan (To-Do List Concept)
    Route::get('/next-week-plans', [NextWeekPlanController::class, 'index'])->name('api.next-week-plans.index');
    Route::post('/next-week-plans', [NextWeekPlanController::class, 'store'])->name('api.next-week-plans.store');
    Route::match(['put', 'patch'], '/next-week-plans/{id}', [NextWeekPlanController::class, 'update'])->name('api.next-week-plans.update');
    Route::delete('/next-week-plans/{id}', [NextWeekPlanController::class, 'destroy'])->name('api.next-week-plans.destroy');

    // Rich Text Editor Documents (Laporan & Catatan)
    Route::get('/project-documents', [ProjectDocumentController::class, 'show'])->name('api.project-documents.show');
    Route::post('/project-documents', [ProjectDocumentController::class, 'store'])->name('api.project-documents.store');

    // Project Schedules & MS Project ala Work Breakdown
    Route::get('/project-schedules', [ProjectScheduleController::class, 'index'])->name('api.project-schedules.index');
    Route::post('/project-schedules', [ProjectScheduleController::class, 'store'])->name('api.project-schedules.store');
    Route::match(['put', 'patch'], '/project-schedules/{id}', [ProjectScheduleController::class, 'update'])->name('api.project-schedules.update');
    Route::delete('/project-schedules/{id}', [ProjectScheduleController::class, 'destroy'])->name('api.project-schedules.destroy');

    // Progress Summary & S-Curve Synchronization
    Route::get('/progress-summary', [ProjectScheduleController::class, 'progressSummary'])->name('api.progress-summary.index');
    Route::post('/schedule-weekly-progress', [ProjectScheduleController::class, 'saveWeeklyProgress'])->name('api.schedule-weekly-progress.store');

    // Pusat Informasi & Notifikasi Kelengkapan Section
    Route::get('/notifications/general', [NotificationController::class, 'general'])->name('api.notifications.general');

    // Project Attachments (Lampiran Dokumen PDF: Weekly Report, Kontrak, LOA, SPK, Schedule PDF, dll)
    Route::get('/projects/{project}/attachments', [ProjectAttachmentController::class, 'index'])->name('api.projects.attachments.index');
    Route::post('/projects/{project}/attachments', [ProjectAttachmentController::class, 'store'])->name('api.projects.attachments.store');
    Route::delete('/projects/{project}/attachments/{attachment}', [ProjectAttachmentController::class, 'destroy'])->name('api.projects.attachments.destroy');

    // Ganti Password Mandiri (Dapat diakses seluruh role yang login)
    Route::put('/profile/password', [UserController::class, 'updatePassword'])->name('api.profile.password');

    // Manajemen User (Khusus Administrator)
    Route::get('/users', [UserController::class, 'index'])->name('api.users.index');
    Route::post('/users', [UserController::class, 'store'])->name('api.users.store');
    Route::put('/users/{id}', [UserController::class, 'update'])->name('api.users.update');
    Route::delete('/users/{id}', [UserController::class, 'destroy'])->name('api.users.destroy');
});
