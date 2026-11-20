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
        Schema::table('schedule_weekly_progress', function (Blueprint $table) {
            if (!Schema::hasColumn('schedule_weekly_progress', 'forecast_progress')) {
                $table->decimal('forecast_progress', 6, 2)->nullable()->after('actual_progress');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('schedule_weekly_progress', function (Blueprint $table) {
            if (Schema::hasColumn('schedule_weekly_progress', 'forecast_progress')) {
                $table->dropColumn('forecast_progress');
            }
        });
    }
};
