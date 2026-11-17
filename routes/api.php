<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\DashboardController;

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
    Route::post('/projects/{project}/import', [DashboardController::class, 'import'])->name('api.projects.import');
    Route::post('/import', [DashboardController::class, 'import'])->name('api.import');
});
