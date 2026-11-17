<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WeeklyActivity extends Model
{
    use HasFactory;

    protected $guarded = ['id'];

    protected $casts = [
        'sort_order' => 'integer',
    ];

    /**
     * Relasi kembali ke Project
     */
    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }
}
