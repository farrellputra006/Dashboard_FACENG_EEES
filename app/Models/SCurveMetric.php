<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SCurveMetric extends Model
{
    use HasFactory;

    protected $guarded = ['id'];

    protected $casts = [
        'week_number' => 'integer',
        'cutoff_date' => 'date',
        'cum_plan' => 'decimal:2',
        'cum_actual' => 'decimal:2',
        'cum_forecast' => 'decimal:2',
    ];

    /**
     * Relasi kembali ke Project
     */
    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }
}
