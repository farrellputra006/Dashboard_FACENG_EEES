<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Project extends Model
{
    use HasFactory;

    /**
     * The attributes that aren't mass assignable.
     *
     * @var array<string>
     */
    protected $guarded = ['id'];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'contract_value' => 'decimal:2',
        'plan_cumulative' => 'decimal:2',
        'actual_cumulative' => 'decimal:2',
        'deviation' => 'decimal:2',
        'start_date' => 'date',
        'end_date' => 'date',
        'cutoff_date' => 'date',
    ];

    /**
     * Relasi ke Project Weekly Metrics (Snapshot Historis Mingguan)
     */
    public function weeklyMetrics(): HasMany
    {
        return $this->hasMany(ProjectWeeklyMetric::class)->orderBy('week_number', 'asc');
    }

    /**
     * Relasi ke WBS Categories (Overview & Progress Summary)
     */
    public function wbsCategories(): HasMany
    {
        return $this->hasMany(WbsCategory::class)->orderBy('sort_order');
    }

    /**
     * Relasi ke S-Curve Metrics (Data Time-Series Mingguan)
     */
    public function sCurveMetrics(): HasMany
    {
        return $this->hasMany(SCurveMetric::class)->orderBy('week_number');
    }

    /**
     * Relasi ke Subcontractor Packages (Work Packages & PO Subcontractor)
     */
    public function subcontractorPackages(): HasMany
    {
        return $this->hasMany(SubcontractorPackage::class)->orderBy('item_no');
    }

    /**
     * Relasi ke Weekly Activities (Aktivitas Mingguan & Rencana Kerja)
     */
    public function weeklyActivities(): HasMany
    {
        return $this->hasMany(WeeklyActivity::class)->orderBy('sort_order');
    }

    /**
     * Relasi ke Progress Photos (Galeri Dokumentasi Lapangan)
     */
    public function progressPhotos(): HasMany
    {
        return $this->hasMany(ProgressPhoto::class)->latest('taken_at');
    }

    /**
     * Relasi ke HSE Reports (Metrik Keselamatan Kerja)
     */
    public function hseReports(): HasMany
    {
        return $this->hasMany(HseReport::class);
    }
}
