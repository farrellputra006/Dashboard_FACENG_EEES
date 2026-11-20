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
        Schema::create('schedule_weekly_progress', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_schedule_id')->constrained('project_schedules')->cascadeOnDelete();
            $table->integer('week');
            $table->date('week_date')->nullable();
            $table->decimal('plan_progress', 6, 2)->default(0);
            $table->decimal('actual_progress', 6, 2)->default(0);
            $table->timestamps();

            $table->unique(['project_schedule_id', 'week']);
            $table->index(['project_schedule_id', 'week']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('schedule_weekly_progress');
    }
};
