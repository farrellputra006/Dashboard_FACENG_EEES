<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ProjectSchedule extends Model
{
    use HasFactory;

    protected $table = 'project_schedules';

    protected $guarded = ['id'];

    protected $casts = [
        'price' => 'decimal:2',
        'weight' => 'decimal:2',
        'duration' => 'integer',
        'start_date' => 'date:Y-m-d',
        'finish_date' => 'date:Y-m-d',
        'baseline_start' => 'date:Y-m-d',
        'baseline_finish' => 'date:Y-m-d',
    ];

    /**
     * Relasi ke Master Project
     */
    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    /**
     * Relasi ke Progres Mingguan
     */
    public function weeklyProgress(): HasMany
    {
        return $this->hasMany(ScheduleWeeklyProgress::class, 'project_schedule_id')->orderBy('week', 'asc');
    }
}
