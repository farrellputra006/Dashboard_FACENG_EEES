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
        Schema::create('projects', function (Blueprint $table) {
            $table->id();
            $table->string('project_code')->unique();
            $table->string('project_name');
            $table->string('location')->default('Sengkang - Sulawesi Selatan');
            $table->string('contractor_name')->nullable();
            $table->decimal('contract_value', 18, 2)->nullable();
            $table->string('currency', 10)->default('IDR');
            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();
            $table->string('current_week', 20)->default('W-46');
            $table->date('cutoff_date')->nullable();
            $table->decimal('plan_cumulative', 6, 2)->default(0);
            $table->decimal('actual_cumulative', 6, 2)->default(0);
            $table->decimal('deviation', 6, 2)->default(0);
            $table->enum('status', ['On Track', 'Ahead', 'Delayed', 'Watchlist', 'Completed'])->default('On Track');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('projects');
    }
};
