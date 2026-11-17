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
        Schema::create('weekly_activities', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained()->cascadeOnDelete();
            $table->string('week_label', 20); // contoh: 'W-46', 'W-47'
            $table->enum('activity_type', ['this_week_actual', 'next_week_plan']);
            $table->enum('discipline', ['Engineering & QC', 'Procurement', 'Construction', 'HSE', 'General']);
            $table->text('description');
            $table->integer('sort_order')->default(0);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('weekly_activities');
    }
};
