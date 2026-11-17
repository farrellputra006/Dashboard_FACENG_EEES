<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SubcontractorPackage extends Model
{
    use HasFactory;

    protected $guarded = ['id'];

    protected $casts = [
        'item_no' => 'integer',
        'plan_progress' => 'decimal:2',
        'actual_progress' => 'decimal:2',
    ];

    /**
     * Relasi kembali ke Project
     */
    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    /**
     * Relasi ke WBS Category (opsional)
     */
    public function wbsCategory(): BelongsTo
    {
        return $this->belongsTo(WbsCategory::class);
    }
}
