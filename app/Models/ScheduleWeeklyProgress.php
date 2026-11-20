<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ScheduleWeeklyProgress extends Model
{
    use HasFactory;

    protected $table = 'schedule_weekly_progress';

    protected $guarded = ['id'];

    protected $casts = [
        'week' => 'integer',
        'week_date' => 'date:Y-m-d',
        'plan_progress' => 'decimal:2',
        'actual_progress' => 'decimal:2',
        'forecast_progress' => 'decimal:2',
    ];

    /**
     * Relasi ke Item Pekerjaan Schedule
     */
    public function schedule(): BelongsTo
    {
        return $this->belongsTo(ProjectSchedule::class, 'project_schedule_id');
    }
}
