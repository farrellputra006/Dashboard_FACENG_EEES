<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProgressPhoto extends Model
{
    use HasFactory;

    protected $guarded = ['id'];

    protected $casts = [
        'taken_at' => 'date',
    ];

    protected $appends = ['week'];

    public function getWeekAttribute(): ?string
    {
        return $this->week_label;
    }

    public function setWeekAttribute($value): void
    {
        $this->attributes['week_label'] = $value;
    }

    /**
     * Relasi kembali ke Project
     */
    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }
}
