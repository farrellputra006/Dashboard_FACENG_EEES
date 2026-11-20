<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web Routes (Single Page Application Routing)
|--------------------------------------------------------------------------
*/

// Serve uploaded storage files with proper mime headers
Route::get('/storage/{path}', function ($path) {
    $storagePath = storage_path('app/public/' . $path);
    if (file_exists($storagePath)) {
        return response()->file($storagePath);
    }
    $publicUploadPath = public_path('uploads/' . $path);
    if (file_exists($publicUploadPath)) {
        return response()->file($publicUploadPath);
    }
    abort(404);
})->where('path', '.*');

Route::get('/{any?}', function () {
    return view('app');
})->where('any', '^(?!api|storage).*$')->name('login');
