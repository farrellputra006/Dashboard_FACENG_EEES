<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\DashboardController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Endpoint untuk frontend React Dashboard mengambil data live dari database MySQL.
|
*/

Route::get('/dashboard', [DashboardController::class, 'api'])->name('api.dashboard');
Route::get('/projects', [DashboardController::class, 'index'])->name('api.projects');
Route::post('/projects/{project}/import', [DashboardController::class, 'import'])->name('api.projects.import');
Route::post('/import', [DashboardController::class, 'import'])->name('api.import');
Route::get('/template/download', [DashboardController::class, 'downloadTemplate'])->name('api.template.download');
