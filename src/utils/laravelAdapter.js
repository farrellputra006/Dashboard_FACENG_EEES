/**
 * Utility adapter untuk mentransformasikan data Eloquent MySQL Laravel ke format komponen frontend React.
 */

export function transformProject(dbProject) {
  if (!dbProject) return null;

  // Format nilai kontrak ke format mata uang Rupiah
  let formattedContract = "Rp 25,33 Miliar";
  if (dbProject.contract_value) {
    const val = Number(dbProject.contract_value);
    if (val >= 1000000000) {
      formattedContract = `Rp ${(val / 1000000000).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Miliar`;
    } else if (val >= 1000000) {
      formattedContract = `Rp ${(val / 1000000).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Juta`;
    } else {
      formattedContract = `Rp ${val.toLocaleString('id-ID')}`;
    }
  }

  // Format badge status
  let statusKey = 'ontrack';
  let statusLabel = dbProject.status || 'On Track';
  const devNum = Number(dbProject.deviation || 0);

  if (dbProject.status === 'Ahead' || devNum > 0) {
    statusKey = 'ahead';
    statusLabel = devNum > 0 ? `+${devNum.toFixed(2)}% Ahead` : 'Ahead';
  } else if (dbProject.status === 'Delayed' || devNum < 0) {
    statusKey = 'delayed';
    statusLabel = devNum < 0 ? `${devNum.toFixed(2)}% Delayed` : 'Delayed';
  } else if (dbProject.status === 'Watchlist') {
    statusKey = 'watchlist';
    statusLabel = devNum !== 0 ? `${devNum > 0 ? '+' : ''}${devNum.toFixed(2)}% Watchlist` : 'Watchlist';
  } else if (dbProject.status === 'Completed') {
    statusKey = 'completed';
    statusLabel = '100% Completed';
  }

  const currentWk = dbProject.selected_week || dbProject.current_week || 'Week 12';

  return {
    id: dbProject.id ? `proj-${dbProject.id}` : dbProject.project_code,
    rawId: dbProject.id,
    name: dbProject.project_name,
    code: dbProject.project_code,
    client: 'Energy Equity Epic (Sengkang) Pty. Ltd.',
    contractorName: dbProject.contractor_name || 'PT Triguna Internusa Pratama',
    status: statusKey,
    statusLabel: statusLabel,
    delayedAlternativeLabel: 'Delayed (-3.73%)',
    lastUpdate: dbProject.cutoff_date ? formatDateIndo(dbProject.cutoff_date) : '29 Aug 2025',
    location: dbProject.location || 'Sengkang - Sulawesi Selatan',
    contractValue: formattedContract,
    planProgress: Number(dbProject.plan_cumulative || 0),
    actualProgress: Number(dbProject.actual_cumulative || 0),
    deviation: devNum > 0 ? `+${devNum.toFixed(2)}%` : `${devNum.toFixed(2)}%`,
    rawDeviation: devNum,
    currentWeek: currentWk,
    availableWeeks: dbProject.available_weeks || ['Week 10', 'Week 11', 'Week 12'],
    cutoffDate: dbProject.cutoff_date ? `${formatDateIndo(dbProject.cutoff_date)}, 14:30 WITA` : '29 Aug 2025, 14:30 WITA',
  };
}

export function transformWbsCategories(dbCategories) {
  if (!dbCategories || !Array.isArray(dbCategories)) return null;

  return dbCategories.map((c, idx) => ({
    id: c.id,
    rawId: c.id,
    projectId: c.project_id,
    weekLabel: c.week_label,
    no: String(idx + 1),
    code: c.code,
    item: c.name,
    weight: Number(c.weight_factor || 0),
    prevWeek: {
      plan: Number(c.prev_week_plan || 0),
      actual: Number(c.prev_week_actual || 0)
    },
    thisWeek: {
      plan: Number(c.this_week_plan || 0),
      actual: Number(c.this_week_actual || 0)
    },
    cumulative: {
      plan: Number(c.cum_plan || 0),
      actual: Number(c.cum_actual || 0)
    },
    variance: Number(c.variance || 0),
    status: c.status || (Number(c.cum_actual) >= 100 ? 'Completed' : Number(c.variance) >= 0 ? 'Ahead' : 'Delayed')
  }));
}

export function transformSCurve(dbMetrics) {
  if (!dbMetrics || !Array.isArray(dbMetrics)) return null;

  // Temukan titik actual terakhir untuk auto-proyeksi tren jika forecast belum terisi
  let lastActualWeek = 0;
  let lastActualVal = 0;
  dbMetrics.forEach(m => {
    if (m.cum_actual !== null && m.cum_actual !== undefined) {
      const w = Number(m.week_number) || 0;
      if (w >= lastActualWeek) {
        lastActualWeek = w;
        lastActualVal = Number(m.cum_actual);
      }
    }
  });

  return dbMetrics.map(m => {
    const wNum = Number(m.week_number) || 0;
    const planVal = m.cum_plan !== null && m.cum_plan !== undefined ? Number(m.cum_plan) : null;
    const actVal = m.cum_actual !== null && m.cum_actual !== undefined ? Number(m.cum_actual) : null;

    // Nilai forecast: jika sudah ada (misal dari Import Excel / DB), gunakan nilai aslinya.
    // Jika null dan berada di atau setelah minggu cutoff aktual, buat proyeksi otomatis
    let forecastVal = m.cum_forecast !== null && m.cum_forecast !== undefined ? Number(m.cum_forecast) : null;
    if (forecastVal === null && lastActualWeek > 0 && wNum >= lastActualWeek) {
      const step = wNum - lastActualWeek;
      forecastVal = Number(Math.min(100.0, lastActualVal + (step * 0.73)).toFixed(2));
    }

    return {
      week: m.week_label,
      weekNumber: wNum,
      date: m.cutoff_date ? formatDateShort(m.cutoff_date) : m.week_label,
      plan: planVal,
      actual: actVal,
      forecast: forecastVal,
    };
  });
}

export function transformSubcontractors(dbPackages) {
  if (!dbPackages || !Array.isArray(dbPackages)) return null;

  return dbPackages.map(p => ({
    no: p.item_no,
    description: p.work_description,
    category: p.wbs_category?.name || 'General Construction',
    subcontractor: p.subcontractor_name || 'In-House Construction',
    planPercent: Number(p.plan_progress || 0),
    actualPercent: Number(p.actual_progress || 0),
    color: p.status_badge === 'Completed' ? 'bg-slate-800' : p.status_badge === 'Delayed' ? 'bg-amber-500' : p.status_badge === 'Ahead' ? 'bg-emerald-600' : 'bg-blue-600',
    status: p.status_badge || 'On Track',
    notes: p.notes || p.current_status_text || 'In Progress',
    isObstacle: Boolean(p.obstacles)
  }));
}

export function transformHseReport(dbHse) {
  if (!dbHse) return null;

  return {
    totalManhours: `${Number(dbHse.cumulative_manhours || 186056).toLocaleString('id-ID')} hrs`,
    thisWeekManhours: `${Number(dbHse.period_manhours || 13064).toLocaleString('id-ID')} hrs`,
    ltaFatality: `${dbHse.lta || 0} (Zero Accident)`,
    safeDays: 284,
    permitToWork: dbHse.safety_induction || 48,
    toolboxMeetingAttendance: '100%',
    environmentalSpill: String(dbHse.oil_spill || 0)
  };
}

function formatDateIndo(dateStr) {
  try {
    const d = new Date(dateStr);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  } catch (e) {
    return dateStr;
  }
}

function formatDateShort(dateStr) {
  try {
    const d = new Date(dateStr);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${String(d.getDate()).padStart(2, '0')}-${months[d.getMonth()]}`;
  } catch (e) {
    return dateStr;
  }
}
