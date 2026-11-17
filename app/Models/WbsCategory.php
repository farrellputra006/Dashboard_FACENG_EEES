<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class WbsCategory extends Model
{
    use HasFactory;

    protected $guarded = ['id'];

    protected $casts = [
        'weight_factor' => 'decimal:2',
        'prev_week_plan' => 'decimal:2',
        'prev_week_actual' => 'decimal:2',
        'this_week_plan' => 'decimal:2',
        'this_week_actual' => 'decimal:2',
        'cum_plan' => 'decimal:2',
        'cum_actual' => 'decimal:2',
        'variance' => 'decimal:2',
        'sort_order' => 'integer',
    ];

    /**
     * Relasi kembali ke Project
     */
    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    /**
     * Relasi ke paket pekerjaan subcontractor
     */
    public function subcontractorPackages(): HasMany
    {
        return $this->hasMany(SubcontractorPackage::class);
    }
}
