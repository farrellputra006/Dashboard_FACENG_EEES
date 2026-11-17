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
        Schema::create('project_weekly_metrics', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained()->cascadeOnDelete();
            $table->string('week_label', 20); // contoh: 'Week 10', 'Week 11', 'Week 12'
            $table->integer('week_number')->default(10);
            $table->date('cutoff_date')->nullable();
            $table->decimal('plan_cumulative', 6, 2)->default(0);
            $table->decimal('actual_cumulative', 6, 2)->default(0);
            $table->decimal('deviation', 6, 2)->default(0);
            $table->enum('status', ['On Track', 'Ahead', 'Delayed', 'Watchlist', 'Completed'])->default('On Track');
            $table->text('highlights')->nullable();
            $table->timestamps();

            $table->unique(['project_id', 'week_label']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('project_weekly_metrics');
    }
};
