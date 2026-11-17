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
        Schema::create('wbs_categories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained()->cascadeOnDelete();
            $table->string('week_label', 20)->default('Week 10'); // contoh: 'Week 10', 'Week 11', 'Week 12'
            $table->string('code', 20); // contoh: 'A', 'B.1', 'B.2', etc.
            $table->string('name'); // contoh: 'PREPARATION', 'ENGINEERING', etc.
            $table->decimal('weight_factor', 6, 2)->default(0);
            $table->decimal('prev_week_plan', 6, 2)->default(0);
            $table->decimal('prev_week_actual', 6, 2)->default(0);
            $table->decimal('this_week_plan', 6, 2)->default(0);
            $table->decimal('this_week_actual', 6, 2)->default(0);
            $table->decimal('cum_plan', 6, 2)->default(0);
            $table->decimal('cum_actual', 6, 2)->default(0);
            $table->decimal('variance', 6, 2)->default(0);
            $table->integer('sort_order')->default(0);
            $table->timestamps();

            $table->index(['project_id', 'week_label']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('wbs_categories');
    }
};
