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
        Schema::create('hse_reports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained()->cascadeOnDelete();
            $table->string('week_label', 20); // contoh: 'W-46'
            $table->integer('total_personnel')->default(0);
            $table->integer('period_manhours')->default(0);
            $table->integer('cumulative_manhours')->default(0);
            $table->integer('near_miss')->default(0);
            $table->integer('first_aid')->default(0);
            $table->integer('mtc')->default(0);
            $table->integer('lta')->default(0);
            $table->integer('fatality')->default(0);
            $table->integer('oil_spill')->default(0);
            $table->integer('gas_leaks')->default(0);
            $table->integer('safety_induction')->default(0);
            $table->integer('toolbox_meeting')->default(0);
            $table->integer('safety_inspection')->default(0);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('hse_reports');
    }
};
