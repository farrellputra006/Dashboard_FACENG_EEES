<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HseReport extends Model
{
    use HasFactory;

    protected $guarded = ['id'];

    protected $casts = [
        'total_personnel' => 'integer',
        'period_manhours' => 'integer',
        'cumulative_manhours' => 'integer',
        'near_miss' => 'integer',
        'first_aid' => 'integer',
        'mtc' => 'integer',
        'lta' => 'integer',
        'fatality' => 'integer',
        'oil_spill' => 'integer',
        'gas_leaks' => 'integer',
        'safety_induction' => 'integer',
        'toolbox_meeting' => 'integer',
        'safety_inspection' => 'integer',
    ];

    /**
     * Relasi kembali ke Project
     */
    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }
}
