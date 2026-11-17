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
        Schema::create('s_curve_metrics', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained()->cascadeOnDelete();
            $table->string('week_label', 20); // contoh: 'W-28', 'W-46'
            $table->integer('week_number'); // contoh: 28, 46
            $table->date('cutoff_date')->nullable();
            $table->decimal('cum_plan', 6, 2)->nullable();
            $table->decimal('cum_actual', 6, 2)->nullable();
            $table->decimal('cum_forecast', 6, 2)->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('s_curve_metrics');
    }
};
