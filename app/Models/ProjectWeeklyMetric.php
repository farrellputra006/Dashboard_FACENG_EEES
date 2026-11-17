<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProjectWeeklyMetric extends Model
{
    use HasFactory;

    protected $guarded = ['id'];

    protected $casts = [
        'plan_cumulative' => 'decimal:2',
        'actual_cumulative' => 'decimal:2',
        'deviation' => 'decimal:2',
        'cutoff_date' => 'date',
        'week_number' => 'integer',
    ];

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }
}
