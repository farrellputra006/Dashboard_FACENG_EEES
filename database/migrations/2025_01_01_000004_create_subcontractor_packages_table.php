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
        Schema::create('subcontractor_packages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained()->cascadeOnDelete();
            $table->foreignId('wbs_category_id')->nullable()->constrained('wbs_categories')->nullOnDelete();
            $table->string('week_label', 20)->default('Week 10'); // contoh: 'Week 10', 'Week 11', 'Week 12'
            $table->integer('item_no');
            $table->string('work_description');
            $table->string('subcontractor_name')->nullable();
            $table->string('po_number')->nullable();
            $table->string('completion_plan')->nullable();
            $table->text('current_status_text')->nullable();
            $table->decimal('plan_progress', 6, 2)->default(0);
            $table->decimal('actual_progress', 6, 2)->default(0);
            $table->string('status_badge', 50)->default('On Track');
            $table->text('obstacles')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['project_id', 'week_label']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('subcontractor_packages');
    }
};
