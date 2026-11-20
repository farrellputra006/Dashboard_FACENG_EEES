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
        Schema::create('project_schedules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained()->cascadeOnDelete();
            $table->string('task_name');
            $table->decimal('price', 18, 2)->default(0);
            $table->decimal('weight', 6, 2)->default(0);
            $table->integer('duration')->nullable(); // dalam hari
            $table->date('start_date')->nullable();
            $table->date('finish_date')->nullable();
            $table->date('baseline_start')->nullable();
            $table->date('baseline_finish')->nullable();
            $table->timestamps();

            $table->index('project_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('project_schedules');
    }
};
