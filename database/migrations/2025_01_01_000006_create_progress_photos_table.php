<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('progress_photos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained()->cascadeOnDelete();
            $table->string('week_label', 20); // contoh: 'W-46'
            $table->string('title');
            $table->text('caption')->nullable();
            $table->string('image_path');
            $table->date('taken_at')->nullable();
            $table->string('location')->nullable()->default('Poleonro, Kec. Gilireng, Kab. Wajo');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('progress_photos');
    }
};
