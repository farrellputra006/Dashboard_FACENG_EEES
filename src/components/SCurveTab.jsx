import React, { useState, useEffect, useCallback } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  ComposedChart,
  Area,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceDot,
  ReferenceLine
} from 'recharts';
import {
  TrendingUp,
  AlertCircle,
  Calendar,
  CheckCircle2,
  Info,
  Clock,
  Sparkles,
  Target,
  Flag,
  BarChart3,
  Layers,
  ChevronRight,
  Plus,
  Pencil,
  Trash2,
  Printer,
  FileDown,
  Lock,
  Calculator,
  ShieldAlert,
  X,
  FileSpreadsheet
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../utils/api';
import logoEnergyEquity from '../assets/images/logo-energy-equity.png';
import logoSkkMigas from '../assets/images/logo-skkmigas.png';
import {
  scurveData,
  forecastMetrics,
  forecastDetailedSeries
} from '../data/dashboardData';

// Custom Tooltip for Primary S-Curve (Diagram 1)
const CustomSCurveTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const dataPoint = payload[0]?.payload || scurveData.find((d) => d.week === label);
    const planVal = payload.find((p) => p.dataKey === 'plan')?.value;
    const actVal = payload.find((p) => p.dataKey === 'actual')?.value;
    const forecastVal = payload.find((p) => p.dataKey === 'forecast')?.value;
    const diff = actVal !== undefined && planVal !== undefined ? (actVal - planVal).toFixed(2) : null;

    return (
      <div className="bg-slate-900 text-white p-3.5 rounded-xl shadow-xl border border-slate-700 text-xs min-w-[210px]">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2 font-mono">
          <span className="font-bold text-slate-200">{label}</span>
          <span className="text-slate-400">{dataPoint?.date}</span>
        </div>
        <div className="space-y-1.5 font-medium">
          <div className="flex items-center justify-between text-blue-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
              Plan:
            </span>
            <span className="font-mono">{planVal !== undefined && planVal !== null ? `${Number(planVal).toFixed(2)}%` : '-'}</span>
          </div>
          {actVal !== undefined && actVal !== null && (
            <div className="flex items-center justify-between text-emerald-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                Actual:
              </span>
              <span className="font-mono font-bold">{Number(actVal).toFixed(2)}%</span>
            </div>
          )}
          {forecastVal !== undefined && forecastVal !== null && (
            <div className="flex items-center justify-between text-amber-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-1 bg-amber-500"></span>
                Forecast:
              </span>
              <span className="font-mono font-bold">{Number(forecastVal).toFixed(2)}%</span>
            </div>
          )}
          {diff !== null && (
            <div className="pt-2 mt-2 border-t border-slate-800 flex items-center justify-between">
              <span className="text-slate-400">Variance:</span>
              <span className={`font-mono font-bold ${Number(diff) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {Number(diff) > 0 ? `+${diff}%` : `${diff}%`}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }
  return null;
};

// Custom Tooltip for Forecast Diagram (Diagram 2)
const CustomForecastTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const item = forecastDetailedSeries.find((d) => d.week === label);
    return (
      <div className="bg-slate-900 text-white p-4 rounded-xl shadow-2xl border border-slate-700 text-xs min-w-[240px]">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2 font-mono">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-cyan-300">{label}</span>
            <span className="text-slate-400">({item?.date})</span>
          </div>
          {item?.isCutoff && (
            <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] border border-emerald-500/30">
              Cutoff
            </span>
          )}
        </div>

        {item?.milestone && (
          <div className="mb-2 p-1.5 rounded bg-slate-800/80 border border-slate-700 text-[11px] text-amber-300 flex items-center gap-1">
            <Flag className="w-3 h-3 text-amber-400 shrink-0" />
            <span className="font-medium truncate">{item.milestone}</span>
          </div>
        )}

        <div className="space-y-1.5 font-mono">
          {payload.map((p, idx) => (
            <div key={idx} className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-sans text-slate-300">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }}></span>
                {p.name}:
              </span>
              <span className="font-bold" style={{ color: p.color }}>
                {p.value !== null && p.value !== undefined ? `${Number(p.value).toFixed(2)}%` : '-'}
              </span>
            </div>
          ))}
          {item?.weeklyDelta !== undefined && (
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-slate-400 text-[11px]">
              <span className="font-sans">Weekly Velocity:</span>
              <span className="text-cyan-400 font-bold">+{item.weeklyDelta.toFixed(2)}% / wk</span>
            </div>
          )}
        </div>
      </div>
    );
  }
  return null;
};

export default function SCurveTab({ dbMetrics, project, selectedWeek, projectId, onScheduleUpdated }) {
  const { user } = useAuth();
  const canMutate = user && ['admin', 'project_control'].includes(user.role);

  // Sub-tab: 'graph' (default) or 'schedule'
  const [activeSubTab, setActiveSubTab] = useState('graph');
  const [forecastViewMode, setForecastViewMode] = useState('cumulative'); // 'cumulative' | 'velocity'

  // Schedules state
  const [schedules, setSchedules] = useState([]);
  const [summary, setSummary] = useState({
    total_price: 0,
    total_price_formatted: 'Rp 0',
    total_weight: 100,
    total_actual_weight: 0,
    items_count: 0
  });
  const [loadingSchedules, setLoadingSchedules] = useState(false);
  const [toast, setToast] = useState(null);

  // Form Modal state for adding/editing task schedule
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' | 'edit'
  const [currentId, setCurrentId] = useState(null);
  const [formData, setFormData] = useState({
    task_name: '',
    price: '',
    duration: '',
    start_date: '',
    finish_date: '',
    baseline_start: '',
    baseline_finish: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete Confirmation state
  const [deletingItem, setDeletingItem] = useState(null);

  // Modal Input Progres & Forecast Mingguan
  const [progressModalItem, setProgressModalItem] = useState(null);
  const [progressFormData, setProgressFormData] = useState({
    plan_progress: '',
    actual_progress: '',
    forecast_progress: ''
  });
  const [isSavingWeeklyProgress, setIsSavingWeeklyProgress] = useState(false);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const activeProjectId = projectId || project?.rawId || (project?.id ? String(project.id).replace('proj-', '') : 1);

  // Fetch Schedules from backend
  const fetchSchedules = useCallback(async () => {
    if (!activeProjectId) return;
    setLoadingSchedules(true);
    try {
      const res = await apiRequest(`/api/project-schedules?project_id=${activeProjectId}&week=${encodeURIComponent(selectedWeek || 'Week 12')}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setSchedules(data.schedules || []);
          if (data.summary) {
            setSummary(data.summary);
          }
        }
      }
    } catch (err) {
      console.error('Gagal mengambil data project schedules:', err);
    } finally {
      setLoadingSchedules(false);
    }
  }, [activeProjectId, selectedWeek]);

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  // Open modal for adding
  const handleOpenAddModal = () => {
    setModalMode('add');
    setCurrentId(null);
    setFormData({
      task_name: '',
      price: '',
      duration: '30',
      start_date: new Date().toISOString().split('T')[0],
      finish_date: '',
      baseline_start: new Date().toISOString().split('T')[0],
      baseline_finish: ''
    });
    setIsModalOpen(true);
  };

  // Open modal for editing schedule
  const handleOpenEditModal = (item) => {
    setModalMode('edit');
    setCurrentId(item.id);
    setFormData({
      task_name: item.task_name || '',
      price: item.price ? String(item.price) : '',
      duration: item.duration ? String(item.duration) : '',
      start_date: item.start_date || '',
      finish_date: item.finish_date || '',
      baseline_start: item.baseline_start || '',
      baseline_finish: item.baseline_finish || ''
    });
    setIsModalOpen(true);
  };

  // Open modal for weekly progress & forecast
  const handleOpenProgressModal = (item) => {
    setProgressModalItem(item);
    setProgressFormData({
      plan_progress: item.this_week ? String(item.this_week.plan || '') : '0.00',
      actual_progress: item.this_week ? String(item.this_week.actual || '') : '0.00',
      forecast_progress: item.forecast_progress ? String(item.forecast_progress) : ''
    });
  };

  // Submit Schedule (Add or Edit)
  const handleSubmitSchedule = async (e) => {
    e.preventDefault();
    if (!formData.task_name.trim() || !formData.price) {
      showToast('Mohon lengkapi Nama Pekerjaan dan Nilai Harga (Rp).', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        project_id: activeProjectId,
        task_name: formData.task_name.trim(),
        price: parseFloat(formData.price),
        duration: formData.duration ? parseInt(formData.duration, 10) : null,
        start_date: formData.start_date || null,
        finish_date: formData.finish_date || null,
        baseline_start: formData.baseline_start || null,
        baseline_finish: formData.baseline_finish || null
      };

      const url = modalMode === 'add' ? '/api/project-schedules' : `/api/project-schedules/${currentId}`;
      const method = modalMode === 'add' ? 'POST' : 'PUT';

      const res = await apiRequest(url, {
        method,
        body: payload
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Gagal menyimpan data item schedule.');
      }

      showToast(json.message || 'Data berhasil disimpan!', 'success');
      setIsModalOpen(false);
      await fetchSchedules();
      if (onScheduleUpdated) onScheduleUpdated();
    } catch (err) {
      showToast(err.message || 'Terjadi kesalahan sistem.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Weekly Progress & Forecast
  const handleSubmitWeeklyProgress = async (e) => {
    e.preventDefault();
    if (!progressModalItem) return;

    setIsSavingWeeklyProgress(true);
    try {
      const payload = {
        project_schedule_id: progressModalItem.id,
        week: selectedWeek || 'Week 12',
        plan_progress: parseFloat(progressFormData.plan_progress) || 0,
        actual_progress: parseFloat(progressFormData.actual_progress) || 0,
        forecast_progress: progressFormData.forecast_progress !== '' ? parseFloat(progressFormData.forecast_progress) : null
      };

      const res = await apiRequest('/api/schedule-weekly-progress', {
        method: 'POST',
        body: payload
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Gagal menyimpan progres mingguan.');
      }

      showToast(json.message || 'Progres mingguan & forecast berhasil disimpan!', 'success');
      setProgressModalItem(null);
      await fetchSchedules();
      if (onScheduleUpdated) onScheduleUpdated();
    } catch (err) {
      showToast(err.message || 'Terjadi kesalahan sistem.', 'error');
    } finally {
      setIsSavingWeeklyProgress(false);
    }
  };

  // Confirm delete schedule
  const handleConfirmDelete = async () => {
    if (!deletingItem) return;
    setIsSubmitting(true);
    try {
      const res = await apiRequest(`/api/project-schedules/${deletingItem.id}`, {
        method: 'DELETE'
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Gagal menghapus item schedule.');
      }

      showToast(json.message || 'Item schedule berhasil dihapus.', 'success');
      setDeletingItem(null);
      await fetchSchedules();
      if (onScheduleUpdated) onScheduleUpdated();
    } catch (err) {
      showToast(err.message || 'Gagal menghapus item.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Export to PDF via native browser landscape print
  const handleExportPDF = () => {
    window.print();
  };

  // Ensure active S-Curve has Plan, Actual, and Forecast populated
  const activeSCurve = dbMetrics && dbMetrics.length > 0 ? dbMetrics : scurveData;
  const currentWkLabel = selectedWeek || project?.currentWeek || 'Week 12';
  const planVal = Number(project?.planProgress || 89.82).toFixed(2);
  const actVal = Number(project?.actualProgress || 93.45).toFixed(2);
  const devText = project?.deviation || '+3.63%';
  const statusBadge = project?.statusLabel || 'Ahead';
  const isAhead = (project?.rawDeviation !== undefined ? project.rawDeviation : 3.63) >= 0;

  // Filter weeks up to current week for horizontal data table
  const weeklyTableData = activeSCurve.filter((d) => d.actual !== null && d.actual !== undefined);

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`no-print fixed top-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl text-sm font-medium border transition-all animate-bounce ${
            toast.type === 'error'
              ? 'bg-rose-900/90 text-rose-100 border-rose-700'
              : 'bg-emerald-900/90 text-emerald-100 border-emerald-700'
          }`}
        >
          {toast.type === 'error' ? <AlertCircle className="w-5 h-5 text-rose-300" /> : <CheckCircle2 className="w-5 h-5 text-emerald-300" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Sub-Tabs Navigation (Segmented Pill Control ala Modern Clean Executive Dashboard) */}
      <div className="no-print bg-white p-2.5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="bg-slate-200/50 p-1.5 rounded-2xl border border-slate-200/80 shadow-xs inline-flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setActiveSubTab('graph')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeSubTab === 'graph'
                ? 'bg-white text-blue-600 shadow-xs border border-slate-200/60'
                : 'text-slate-600 hover:text-slate-900 font-semibold border border-transparent'
            }`}
          >
            <TrendingUp className="w-4 h-4 text-blue-600" />
            <span>Grafik S-Curve (Default)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('schedule')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeSubTab === 'schedule'
                ? 'bg-white text-blue-600 shadow-xs border border-slate-200/60'
                : 'text-slate-600 hover:text-slate-900 font-semibold border border-transparent'
            }`}
          >
            <Layers className="w-4 h-4 text-slate-500" />
            <span>Schedule & Input Bobot (ala MS Project)</span>
            <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] bg-blue-50 text-blue-700 border border-blue-200">
              {schedules.length} Items
            </span>
          </button>
        </div>

        {activeSubTab === 'schedule' && (
          <div className="flex items-center gap-2">
            {canMutate && (
              <button
                type="button"
                onClick={handleOpenAddModal}
                className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-colors hover:shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Pekerjaan Baru</span>
              </button>
            )}
            <button
              type="button"
              onClick={handleExportPDF}
              className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/80 text-xs font-bold shadow-xs transition-colors"
              title="Cetak atau Simpan ke format PDF Lanskap"
            >
              <FileDown className="w-4 h-4 text-blue-600" />
              <span>Export Schedule ke PDF</span>
            </button>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* SUB-TAB 1: GRAFIK S-CURVE (DEFAULT) */}
      {/* ========================================================================= */}
      {activeSubTab === 'graph' && (
        <div className="space-y-8 animate-fadeIn">
          {/* Top Horizontal Summary Card */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 divide-y md:divide-y-0 md:divide-x divide-slate-100">
              {/* Plan Cumulative Progress */}
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-lg border border-blue-100 shrink-0">
                  <span className="font-mono">P</span>
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                    Plan Cumulative Progress
                  </span>
                  <div className="text-2xl font-extrabold text-slate-900 tracking-tight font-mono mt-0.5">
                    {planVal}%
                  </div>
                  <span className="text-[11px] text-slate-400">Baseline Target {currentWkLabel}</span>
                </div>
              </div>

              {/* Actual Cumulative Progress */}
              <div className="flex items-center gap-4 pt-4 md:pt-0 md:pl-6">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg border shrink-0 ${
                    isAhead ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'
                  }`}
                >
                  <span className="font-mono">A</span>
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                    Actual Cumulative Progress
                  </span>
                  <div
                    className={`text-2xl font-extrabold tracking-tight font-mono mt-0.5 ${
                      isAhead ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  >
                    {actVal}%
                  </div>
                  <span className={`text-[11px] font-medium ${isAhead ? 'text-emerald-600' : 'text-rose-600'}`}>
                    Cutoff: {project?.lastUpdate || '29-Aug-2025'}
                  </span>
                </div>
              </div>

              {/* Deviation Progress */}
              <div className="flex items-center gap-4 pt-4 md:pt-0 md:pl-6">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg border shrink-0 ${
                    isAhead ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-rose-50 text-rose-600 border-rose-100'
                  }`}
                >
                  <TrendingUp className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                    Deviation Progress
                  </span>
                  <div
                    className={`text-2xl font-extrabold tracking-tight font-mono mt-0.5 flex items-center gap-2 ${
                      isAhead ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  >
                    <span>{devText}</span>
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
                        isAhead
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                          : 'bg-rose-100 text-rose-800 border-rose-200'
                      }`}
                    >
                      {statusBadge}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500">
                    {isAhead ? 'Exceeding baseline plan' : 'Behind baseline schedule'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* DIAGRAM 1: S-Curve Progress (Base Cost) */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm space-y-4">
            {/* Header & Explicit Legend */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-bold rounded uppercase tracking-wider border border-blue-200">
                    Diagram 1
                  </span>
                  <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                    S-Curve — Progress (Base Cost) • {currentWkLabel}
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Cumulative Planned vs Actual S-Curve with Forecast Series (Lookahead Projection to COD 100%)
                </p>
              </div>

              {/* Interactive Legend with Explicit Color & Style Specs */}
              <div className="flex flex-wrap items-center gap-4 text-xs font-semibold">
                <div className="flex items-center gap-2 text-blue-600">
                  <span className="w-5 h-1 bg-blue-600 rounded-full"></span>
                  <span>Plan (Garis Solid Biru)</span>
                </div>
                <div className="flex items-center gap-2 text-emerald-700">
                  <span className="w-5 h-1 bg-emerald-600 rounded-full"></span>
                  <span>Actual (Garis Solid Hijau)</span>
                </div>
                <div className="flex items-center gap-2 text-amber-600">
                  <span className="w-5 h-0.5 border-t-2 border-dashed border-amber-500"></span>
                  <span>Forecast (Putus-Putus Oranye/Amber)</span>
                </div>
              </div>
            </div>

            {/* Chart 1 Container */}
            <div className="h-[380px] w-full pt-4 relative">
              {/* Visual Annotation Badge for Cutoff */}
              <div className="absolute right-8 top-2 z-10 bg-slate-900/90 backdrop-blur-sm text-white px-3.5 py-2 rounded-xl text-xs shadow-lg border border-slate-700 pointer-events-none hidden md:block">
                <div className="flex items-center gap-1.5 text-emerald-400 font-bold mb-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                  <span>{currentWkLabel} Cutoff</span>
                </div>
                <div className="grid grid-cols-2 gap-x-3 text-[11px] font-mono">
                  <span className="text-slate-300">Plan: {planVal}%</span>
                  <span className="text-emerald-300 font-bold">Act: {actVal}%</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-1">Variance: {devText} ({statusBadge})</div>
              </div>

              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={activeSCurve} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />

                  <XAxis
                    dataKey="week"
                    stroke="#64748b"
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: '#cbd5e1' }}
                    tickMargin={8}
                  />

                  <YAxis
                    domain={[0, 100]}
                    ticks={[0, 20, 40, 60, 80, 100]}
                    stroke="#64748b"
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: '#cbd5e1' }}
                    tickFormatter={(val) => `${val}%`}
                  />

                  <Tooltip content={<CustomSCurveTooltip />} />

                  {/* Reference line at 100% COD */}
                  <ReferenceLine
                    y={100}
                    stroke="#94a3b8"
                    strokeDasharray="3 3"
                    label={{
                      value: 'Target COD 100%',
                      fill: '#64748b',
                      fontSize: 10,
                      position: 'insideTopRight'
                    }}
                  />

                  {/* 1. Baseline Plan Line (Solid Blue) */}
                  <Line
                    type="monotone"
                    dataKey="plan"
                    name="CUM PLAN PROGRESS"
                    stroke="#2563eb"
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: '#2563eb' }}
                    activeDot={{ r: 6, fill: '#2563eb', stroke: '#ffffff', strokeWidth: 2 }}
                  />

                  {/* 2. Actual Progress Line (Solid Green) */}
                  <Line
                    type="monotone"
                    dataKey="actual"
                    name="CUM ACTUAL PROGRESS"
                    stroke="#059669"
                    strokeWidth={3.5}
                    dot={{ r: 4, fill: '#059669' }}
                    activeDot={{ r: 7, fill: '#059669', stroke: '#ffffff', strokeWidth: 2 }}
                    connectNulls={false}
                  />

                  {/* 3. Forecast Line (Dashed Amber/Orange) */}
                  <Line
                    type="monotone"
                    dataKey="forecast"
                    name="CUM FORECAST PROGRESS"
                    stroke="#f59e0b"
                    strokeWidth={2.5}
                    strokeDasharray="5 5"
                    dot={{ r: 3, fill: '#f59e0b' }}
                    connectNulls={true}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* DIAGRAM 2: Diagram Forecast (Completion & Lookahead Forecast Analysis) */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm space-y-6">
            {/* Header & View Switcher */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 bg-amber-50 text-amber-700 text-[10px] font-bold rounded uppercase tracking-wider border border-amber-200">
                    Diagram 2
                  </span>
                  <h3 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                    <span>Diagram Forecast — Completion & Lookahead Trajectory</span>
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Earned Value Schedule Projection to Commercial Operation Date (COD) with Multi-Scenario Sensitivity
                </p>
              </div>

              {/* Toggle between Cumulative Trajectory and Weekly Required Velocity */}
              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl self-start md:self-auto">
                <button
                  type="button"
                  onClick={() => setForecastViewMode('cumulative')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    forecastViewMode === 'cumulative'
                      ? 'bg-white text-slate-900 shadow-sm font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <TrendingUp className="w-3.5 h-3.5 text-amber-500" />
                  <span>Completion Trajectory</span>
                </button>
                <button
                  type="button"
                  onClick={() => setForecastViewMode('velocity')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    forecastViewMode === 'velocity'
                      ? 'bg-white text-slate-900 shadow-sm font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <BarChart3 className="w-3.5 h-3.5 text-blue-500" />
                  <span>Weekly Velocity (%/Wk)</span>
                </button>
              </div>
            </div>

            {/* 4 Forecast KPI Micro-cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* ECD */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                <div className="flex items-center justify-between text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                  <span>Estimated Completion (ECD)</span>
                  <Target className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="text-lg font-black text-slate-900 font-mono mt-1">
                  {forecastMetrics.estimatedCompletionDate}
                </div>
                <p className="text-[11px] text-emerald-600 font-semibold mt-1">
                  {forecastMetrics.earlyVarianceDays}
                </p>
              </div>

              {/* SPI */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                <div className="flex items-center justify-between text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                  <span>Forecast SPI Index</span>
                  <TrendingUp className="w-4 h-4 text-blue-600" />
                </div>
                <div className="text-lg font-black text-blue-700 font-mono mt-1">
                  {forecastMetrics.spi}
                </div>
                <p className="text-[11px] text-blue-600 font-medium mt-1">
                  {forecastMetrics.spiStatus}
                </p>
              </div>

              {/* Required Velocity */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                <div className="flex items-center justify-between text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                  <span>Required Run-Rate</span>
                  <Clock className="w-4 h-4 text-indigo-600" />
                </div>
                <div className="text-lg font-black text-slate-900 font-mono mt-1">
                  {forecastMetrics.requiredRunRate}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Actual pace: <span className="font-semibold text-emerald-600">{forecastMetrics.currentRunRate}</span>
                </p>
              </div>

              {/* Confidence Level */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                <div className="flex items-center justify-between text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                  <span>P80 Confidence</span>
                  <Sparkles className="w-4 h-4 text-amber-500" />
                </div>
                <div className="text-lg font-black text-emerald-600 font-mono mt-1">
                  {forecastMetrics.confidenceLevel}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Planned Target: <span className="font-semibold text-slate-700">26 Sep 2025</span>
                </p>
              </div>
            </div>

            {/* Forecast Chart Render */}
            <div className="h-[360px] w-full relative pt-2">
              {forecastViewMode === 'cumulative' ? (
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={forecastDetailedSeries} margin={{ top: 25, right: 35, left: 10, bottom: 20 }}>
                    <defs>
                      <linearGradient id="forecastBand" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>

                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />

                    <XAxis
                      dataKey="week"
                      stroke="#64748b"
                      fontSize={11}
                      tickLine={false}
                      axisLine={{ stroke: '#cbd5e1' }}
                      tickMargin={8}
                    />

                    <YAxis
                      domain={[85, 102]}
                      ticks={[85, 90, 95, 100]}
                      stroke="#64748b"
                      fontSize={11}
                      tickLine={false}
                      axisLine={{ stroke: '#cbd5e1' }}
                      tickFormatter={(val) => `${val}%`}
                    />

                    <Tooltip content={<CustomForecastTooltip />} />

                    <ReferenceLine
                      x="W-46"
                      stroke="#0f172a"
                      strokeDasharray="4 4"
                      strokeWidth={1.5}
                      label={{
                        value: 'Cutoff W-46 (93.45%)',
                        position: 'insideTopLeft',
                        fill: '#0f172a',
                        fontSize: 10,
                        fontWeight: 700
                      }}
                    />

                    <ReferenceLine
                      x="W-50"
                      stroke="#2563eb"
                      strokeDasharray="3 3"
                      strokeWidth={1.5}
                      label={{
                        value: 'Contract COD (26-Sep)',
                        position: 'insideTopRight',
                        fill: '#2563eb',
                        fontSize: 10,
                        fontWeight: 700
                      }}
                    />

                    {/* Confidence Band Area between Optimistic & Pessimistic */}
                    <Area
                      type="monotone"
                      dataKey="forecastOptimistic"
                      name="Best Case Scenario"
                      stroke="none"
                      fill="url(#forecastBand)"
                    />

                    {/* Baseline Planned Line */}
                    <Line
                      type="monotone"
                      dataKey="plan"
                      name="Baseline Plan"
                      stroke="#2563eb"
                      strokeWidth={2}
                      dot={{ r: 3, fill: '#2563eb' }}
                    />

                    {/* Historical Actual line */}
                    <Line
                      type="monotone"
                      dataKey="actual"
                      name="Verified Actual"
                      stroke="#059669"
                      strokeWidth={3}
                      dot={{ r: 5, fill: '#059669' }}
                      connectNulls={false}
                    />

                    {/* Most Likely Forecast Trend Line (Amber Dashed) */}
                    <Line
                      type="monotone"
                      dataKey="forecastTrend"
                      name="Forecast Trend (Most Likely)"
                      stroke="#f59e0b"
                      strokeWidth={2.5}
                      strokeDasharray="6 4"
                      dot={{ r: 4, fill: '#f59e0b' }}
                    />

                    {/* Optimistic Line (Early Finish W-49) */}
                    <Line
                      type="monotone"
                      dataKey="forecastOptimistic"
                      name="Early Finish Forecast (W-49)"
                      stroke="#10b981"
                      strokeWidth={1.5}
                      strokeDasharray="3 3"
                      dot={{ r: 3, fill: '#10b981' }}
                    />

                    {/* Delay Risk Scenario */}
                    <Line
                      type="monotone"
                      dataKey="forecastPessimistic"
                      name="Conservative / Delay Risk"
                      stroke="#f43f5e"
                      strokeWidth={1.5}
                      strokeDasharray="2 2"
                      dot={{ r: 3, fill: '#f43f5e' }}
                    />

                    <ReferenceDot x="W-49" y={100.0} r={6} fill="#10b981" stroke="#ffffff" strokeWidth={2} />
                    <ReferenceDot x="W-50" y={100.0} r={6} fill="#2563eb" stroke="#ffffff" strokeWidth={2} />
                  </ComposedChart>
                </ResponsiveContainer>
              ) : (
                /* Weekly Velocity View (Bar Chart) */
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={forecastDetailedSeries} margin={{ top: 25, right: 35, left: 10, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis
                      dataKey="week"
                      stroke="#64748b"
                      fontSize={11}
                      tickLine={false}
                      axisLine={{ stroke: '#cbd5e1' }}
                      tickMargin={8}
                    />
                    <YAxis
                      stroke="#64748b"
                      fontSize={11}
                      tickLine={false}
                      axisLine={{ stroke: '#cbd5e1' }}
                      tickFormatter={(val) => `+${val}%`}
                    />
                    <Tooltip content={<CustomForecastTooltip />} />
                    <ReferenceLine
                      y={1.64}
                      stroke="#f59e0b"
                      strokeDasharray="4 4"
                      strokeWidth={1.5}
                      label={{
                        value: 'Req. Velocity (1.64%/wk)',
                        fill: '#f59e0b',
                        fontSize: 10,
                        fontWeight: 600,
                        position: 'insideTopLeft'
                      }}
                    />
                    <Bar dataKey="weeklyDelta" name="Weekly Progress Increment" fill="#38bdf8" radius={[6, 6, 0, 0]} />
                  </ComposedChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Forecast Milestones & Scenario Legend Bar */}
            <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4 text-xs">
              <div className="flex flex-wrap items-center gap-4 font-medium">
                <div className="flex items-center gap-1.5 text-blue-700">
                  <span className="w-3.5 h-1 bg-blue-600 rounded"></span>
                  <span>Baseline Plan (100% W-50)</span>
                </div>
                <div className="flex items-center gap-1.5 text-emerald-700">
                  <span className="w-3.5 h-1 bg-emerald-600 rounded"></span>
                  <span>Verified Actual</span>
                </div>
                <div className="flex items-center gap-1.5 text-amber-600">
                  <span className="w-3.5 h-0.5 border-t-2 border-dashed border-amber-500"></span>
                  <span>Forecast Trend (Most Likely)</span>
                </div>
                <div className="flex items-center gap-1.5 text-emerald-600">
                  <span className="w-3.5 h-0.5 border-t-2 border-dotted border-emerald-500"></span>
                  <span>Early Finish Target (W-49)</span>
                </div>
                <div className="flex items-center gap-1.5 text-rose-600">
                  <span className="w-3.5 h-0.5 border-t-2 border-dashed border-rose-500"></span>
                  <span>Delay Risk (W-51)</span>
                </div>
              </div>

              <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1.5">
                <Flag className="w-3.5 h-3.5 text-emerald-600" />
                <span>Target COD: 19 Sep 2025 (W-49 Early RFSU)</span>
              </div>
            </div>

            {/* Forecast Lookahead Milestone Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2">
              <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-200/80 text-xs">
                <div className="flex items-center justify-between text-slate-400 font-mono text-[10px] mb-1">
                  <span>W-47 (05-Sep)</span>
                  <span className="text-blue-600 font-semibold font-mono">95.80%</span>
                </div>
                <div className="font-bold text-slate-800">Mechanical Completion</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Vessels & GEC #6 mounted</div>
              </div>

              <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-200/80 text-xs">
                <div className="flex items-center justify-between text-slate-400 font-mono text-[10px] mb-1">
                  <span>W-48 (12-Sep)</span>
                  <span className="text-blue-600 font-semibold font-mono">97.60%</span>
                </div>
                <div className="font-bold text-slate-800">Pre-Commissioning</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Loop check & leak test</div>
              </div>

              <div className="bg-emerald-50/60 p-3 rounded-xl border border-emerald-200 text-xs">
                <div className="flex items-center justify-between text-emerald-600 font-mono text-[10px] mb-1">
                  <span>W-49 (19-Sep)</span>
                  <span className="text-emerald-700 font-bold font-mono">100.00%</span>
                </div>
                <div className="font-bold text-emerald-900">RFSU & First Gas</div>
                <div className="text-[11px] text-emerald-700 mt-0.5">Early Completion Target</div>
              </div>

              <div className="bg-blue-50/60 p-3 rounded-xl border border-blue-200 text-xs">
                <div className="flex items-center justify-between text-blue-600 font-mono text-[10px] mb-1">
                  <span>W-50 (26-Sep)</span>
                  <span className="text-blue-700 font-bold font-mono">100.00%</span>
                </div>
                <div className="font-bold text-blue-900">Contractual COD</div>
                <div className="text-[11px] text-blue-700 mt-0.5">Official Baseline Target</div>
              </div>
            </div>
          </div>

          {/* S-Curve Data Table (Horizontal from W-28 to W-46 / Current Week) */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs uppercase tracking-wider text-slate-700">
                  Weekly S-Curve Progress Data Table
                </span>
                <span className="text-[10px] bg-blue-100 text-blue-700 font-bold px-2 py-0.5 rounded">
                  {currentWkLabel}
                </span>
              </div>
              <span className="text-xs text-slate-500 font-medium">Unit: Percentage (%)</span>
            </div>

            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-semibold">
                    <th className="p-3 sticky left-0 bg-slate-100 z-10 min-w-[190px] border-r border-slate-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                      Progress Metric
                    </th>
                    {weeklyTableData.map((d) => (
                      <th key={d.week} className="p-3 text-center min-w-[68px] font-mono whitespace-nowrap">
                        <div>{d.week}</div>
                        <div className="text-[10px] text-slate-400 font-normal">{d.date}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {/* Cum Plan Progress */}
                  <tr className="hover:bg-blue-50/30 transition-colors">
                    <td className="p-3 sticky left-0 bg-white font-sans font-semibold text-blue-700 border-r border-slate-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-600 shrink-0"></span>
                        <span>CUM PLAN PROGRESS</span>
                      </div>
                    </td>
                    {weeklyTableData.map((d) => (
                      <td
                        key={d.week}
                        className={`p-3 text-center font-medium ${
                          d.week === currentWkLabel ? 'bg-blue-50 text-blue-800 font-bold' : 'text-slate-600'
                        }`}
                      >
                        {d.plan !== null && d.plan !== undefined ? `${Number(d.plan).toFixed(2)}%` : '-'}
                      </td>
                    ))}
                  </tr>

                  {/* Cum Actual Progress */}
                  <tr className="hover:bg-emerald-50/30 transition-colors">
                    <td className="p-3 sticky left-0 bg-white font-sans font-semibold text-emerald-800 border-r border-slate-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 shrink-0"></span>
                        <span>CUM ACTUAL PROGRESS</span>
                      </div>
                    </td>
                    {weeklyTableData.map((d) => (
                      <td
                        key={d.week}
                        className={`p-3 text-center font-medium ${
                          d.week === currentWkLabel
                            ? 'bg-emerald-50 text-emerald-800 font-bold ring-1 ring-inset ring-emerald-300'
                            : d.actual !== null
                            ? 'text-slate-900 font-semibold'
                            : 'text-slate-400'
                        }`}
                      >
                        {d.actual !== null && d.actual !== undefined ? `${Number(d.actual).toFixed(2)}%` : '-'}
                      </td>
                    ))}
                  </tr>

                  {/* Variance row */}
                  <tr className="hover:bg-slate-50 transition-colors bg-slate-50/30">
                    <td className="p-3 sticky left-0 bg-slate-50 font-sans font-semibold text-slate-700 border-r border-slate-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                      VARIANCE (ACT - PLAN)
                    </td>
                    {weeklyTableData.map((d) => {
                      const diff =
                        d.actual !== null && d.actual !== undefined && d.plan !== null && d.plan !== undefined
                          ? (Number(d.actual) - Number(d.plan)).toFixed(2)
                          : null;
                      const isPos = Number(diff) >= 0;
                      return (
                        <td
                          key={d.week}
                          className={`p-3 text-center font-semibold ${
                            diff === null
                              ? 'text-slate-400'
                              : isPos
                              ? 'text-emerald-600'
                              : 'text-rose-600'
                          }`}
                        >
                          {diff !== null ? (isPos ? `+${diff}%` : `${diff}%`) : '-'}
                        </td>
                      );
                    })}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 2: SCHEDULE & INPUT BOBOT (ALA MS PROJECT) */}
      {/* ========================================================================= */}
      {activeSubTab === 'schedule' && (
        <div className="space-y-6">
          {/* MS Project Header Summary Banner */}
          <div className="no-print bg-slate-900 text-white p-6 rounded-2xl shadow-lg border border-slate-800">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-md bg-blue-500/20 text-blue-400 font-mono text-xs font-bold border border-blue-500/30">
                    MS PROJECT WBS
                  </span>
                  <h3 className="text-lg font-bold text-slate-100">Daftar Pekerjaan & Kalkulasi Bobot Otomatis</h3>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Formula bobot otomatis: <code className="bg-slate-800 px-1.5 py-0.5 rounded text-cyan-300 font-mono">Weight (%) = (Harga / Total Kontrak) × 100%</code>.
                  Total bobot dijamin seimbang tepat 100.00%.
                </p>
              </div>

              {/* Badges / Metrics */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="bg-slate-800/80 px-3.5 py-2 rounded-xl border border-slate-700">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Nilai Kontrak</span>
                  <span className="text-sm font-black font-mono text-cyan-400">{summary.total_price_formatted}</span>
                </div>
                <div className="bg-slate-800/80 px-3.5 py-2 rounded-xl border border-slate-700">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Bobot</span>
                  <span className="text-sm font-black font-mono text-emerald-400">{Number(summary.total_weight).toFixed(2)}%</span>
                </div>
                <div className="bg-slate-800/80 px-3.5 py-2 rounded-xl border border-slate-700">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Earned Actual Weight</span>
                  <span className="text-sm font-black font-mono text-blue-400">{Number(summary.total_actual_weight).toFixed(2)}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Table Container (Ala MS Project) */}
          <div className="printable-schedule-area bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            {/* Header Cetak PDF (Hanya terlihat saat dicetak atau di-export ke PDF) */}
            <div className="hidden print:block p-6 border-b border-slate-300">
              <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                <div className="flex items-center gap-4">
                  <img src={logoEnergyEquity} alt="Energy Equity" className="h-14 object-contain" />
                  <div className="border-l border-slate-300 pl-4">
                    <h2 className="text-base font-black text-slate-900 tracking-wide">ENERGY EQUITY EPIC (SENGKANG) PTY. LTD.</h2>
                    <p className="text-xs text-slate-600 font-semibold">FACILITY ENGINEERING & PROJECT CONTROL DIVISION</p>
                  </div>
                </div>
                <img src={logoSkkMigas} alt="SKKMigas" className="h-12 object-contain" />
              </div>

              <div className="mt-4 flex items-center justify-between">
                <div>
                  <h1 className="text-lg font-black text-slate-900 uppercase">PROJECT SCHEDULE & WORK BREAKDOWN REPORT</h1>
                  <p className="text-xs text-slate-700 font-mono mt-0.5">
                    Proyek: <strong className="font-bold">{project?.name || 'Booster Gas Compressor 55 MMSCFD'}</strong> ({project?.code || 'GBKB-55'})
                  </p>
                </div>
                <div className="text-right text-xs text-slate-700 font-mono">
                  <div>Cutoff: <strong>{currentWkLabel} ({new Date().toLocaleDateString('id-ID')})</strong></div>
                  <div>Nilai Kontrak: <strong>{summary.total_price_formatted}</strong></div>
                </div>
              </div>
            </div>

            {loadingSchedules ? (
              <div className="p-12 text-center text-slate-500 space-y-2">
                <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
                <p className="text-sm font-medium">Memuat data schedule MS Project...</p>
              </div>
            ) : schedules.length === 0 ? (
              <div className="p-12 text-center text-slate-500 space-y-3">
                <FileSpreadsheet className="w-12 h-12 text-slate-300 mx-auto" />
                <h4 className="text-base font-bold text-slate-700">Belum Ada Item Pekerjaan</h4>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Belum ada item schedule untuk proyek ini. Klik tombol di bawah untuk menambahkan item pekerjaan baru ala MS Project.
                </p>
                {canMutate && (
                  <button
                    type="button"
                    onClick={handleOpenAddModal}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold shadow hover:bg-blue-700 transition"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Tambah Pekerjaan Pertama</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-900 text-white uppercase tracking-wider text-[11px] font-bold border-b border-slate-800">
                      <th className="px-3 py-3 w-10 text-center border-r border-slate-800">#</th>
                      <th className="px-4 py-3 min-w-[240px] border-r border-slate-800">Task Name / Item Description</th>
                      <th className="px-3 py-3 text-right border-r border-slate-800">Harga (Rp)</th>
                      <th className="px-3 py-3 text-right border-r border-slate-800">
                        <div className="flex items-center justify-end gap-1">
                          <span>Bobot (%)</span>
                          <Lock className="w-3 h-3 text-cyan-400" title="Otomatis terhitung" />
                        </div>
                      </th>
                      <th className="px-2 py-3 text-center border-r border-slate-800 w-16">Durasi</th>
                      <th className="px-3 py-3 border-r border-slate-800 text-center w-24">Start</th>
                      <th className="px-3 py-3 border-r border-slate-800 text-center w-24">Finish</th>
                      <th className="px-3 py-3 border-r border-slate-800 text-center w-24">Baseline Start</th>
                      <th className="px-3 py-3 border-r border-slate-800 text-center w-24">Baseline Finish</th>
                      <th className="px-4 py-3 text-right border-r border-slate-800 min-w-[140px]">Bobot Actual (%)</th>
                      <th className="px-3 py-3 text-center w-28 no-print">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-sans">
                    {schedules.map((item, index) => {
                      const earnedPct = Number(item.physical_progress || 0);
                      return (
                        <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-3 py-3 text-center font-mono text-slate-500 bg-slate-50/50 border-r border-slate-200">
                            {index + 1}
                          </td>
                          <td className="px-4 py-3 font-semibold text-slate-900 border-r border-slate-200">
                            <div>{item.task_name}</div>
                            <span className="text-[10px] font-normal text-slate-400">Status: {item.status}</span>
                          </td>
                          <td className="px-3 py-3 text-right font-mono font-medium text-slate-800 border-r border-slate-200">
                            {item.price_formatted}
                          </td>
                          <td className="px-3 py-3 text-right font-mono font-bold text-blue-600 bg-blue-50/30 border-r border-slate-200">
                            {Number(item.weight).toFixed(2)}%
                          </td>
                          <td className="px-2 py-3 text-center font-mono text-slate-600 border-r border-slate-200">
                            {item.duration ? `${item.duration}h` : '-'}
                          </td>
                          <td className="px-3 py-3 text-center font-mono text-slate-600 border-r border-slate-200">
                            {item.start_date || '-'}
                          </td>
                          <td className="px-3 py-3 text-center font-mono text-slate-600 border-r border-slate-200">
                            {item.finish_date || '-'}
                          </td>
                          <td className="px-3 py-3 text-center font-mono text-slate-400 border-r border-slate-200">
                            {item.baseline_start || '-'}
                          </td>
                          <td className="px-3 py-3 text-center font-mono text-slate-400 border-r border-slate-200">
                            {item.baseline_finish || '-'}
                          </td>
                          <td className="px-4 py-3 text-right border-r border-slate-200">
                            <div className="flex items-center justify-end gap-2">
                              <span className="font-mono font-bold text-emerald-600">
                                {Number(item.actual_weight || 0).toFixed(2)}%
                              </span>
                            </div>
                            <div className="w-full bg-slate-200 rounded-full h-1.5 mt-1 overflow-hidden">
                              <div
                                className="bg-emerald-500 h-1.5 rounded-full transition-all"
                                style={{ width: `${Math.min(100, earnedPct)}%` }}
                              ></div>
                            </div>
                            <span className="text-[9px] text-slate-400">({earnedPct}% fisik)</span>
                          </td>
                          <td className="px-3 py-3 text-center no-print">
                            {canMutate ? (
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleOpenProgressModal(item)}
                                  className="p-1.5 rounded-lg text-emerald-700 hover:text-emerald-900 hover:bg-emerald-50 transition"
                                  title="Input Progres & Forecast Mingguan"
                                >
                                  <Clock className="w-3.5 h-3.5 text-emerald-600" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditModal(item)}
                                  className="p-1.5 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition"
                                  title="Edit Informasi Item"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setDeletingItem(item)}
                                  className="p-1.5 rounded-lg text-slate-600 hover:text-rose-600 hover:bg-rose-50 transition"
                                  title="Hapus Pekerjaan"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <span className="text-[10px] text-slate-400 italic">Read-only</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  {/* Total Summary Footer */}
                  <tfoot>
                    <tr className="bg-slate-900 text-white font-bold text-xs uppercase tracking-wider border-t-2 border-slate-800">
                      <td colSpan={2} className="px-4 py-3.5 text-left">
                        <div className="flex items-center gap-2">
                          <span>TOTAL KONTRAK & BOBOT</span>
                          <span className="text-[10px] normal-case px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            Auto-Sum 100%
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-3.5 text-right font-mono text-cyan-300">
                        {summary.total_price_formatted}
                      </td>
                      <td className="px-3 py-3.5 text-right font-mono text-emerald-400 text-sm">
                        {Number(summary.total_weight).toFixed(2)}%
                      </td>
                      <td colSpan={5} className="px-3 py-3.5 text-slate-400 font-normal text-[10px] text-center">
                        Total {summary.items_count} pekerjaan terdaftar
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono text-blue-300 text-sm">
                        {Number(summary.total_actual_weight).toFixed(2)}%
                      </td>
                      <td className="no-print"></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}

            {/* Print Signatures Block (Hanya terlihat saat dicetak ke PDF) */}
            <div className="hidden print:grid grid-cols-2 gap-12 mt-12 pt-8 border-t border-slate-300 text-xs">
              <div className="text-center">
                <p className="font-semibold text-slate-700">Dipersiapkan Oleh:</p>
                <div className="h-20"></div>
                <p className="font-bold text-slate-900 underline">Project Control FACENG</p>
                <p className="text-slate-600 text-[11px]">Project Control Engineer - FACENG</p>
              </div>
              <div className="text-center">
                <p className="font-semibold text-slate-700">Disetujui Oleh:</p>
                <div className="h-20"></div>
                <p className="font-bold text-slate-900 underline">Engineering Manager FACENG</p>
                <p className="text-slate-600 text-[11px]">Lead Project Control / Engineering Manager</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: TAMBAH / EDIT INFORMASI PEKERJAAN (ALA MS PROJECT) */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <div className="no-print fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xl w-full overflow-hidden">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-600/30 flex items-center justify-center text-blue-400">
                  <Calculator className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-100">
                    {modalMode === 'add' ? 'Tambah Pekerjaan Baru (MS Project)' : 'Edit Item Pekerjaan'}
                  </h3>
                  <p className="text-[11px] text-slate-400">Bobot (%) akan otomatis dihitung berdasarkan harga</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitSchedule} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Task Name / Item Description <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Piping & Valve Installation"
                  value={formData.task_name}
                  onChange={(e) => setFormData({ ...formData, task_name: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Harga Item (Rp) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    placeholder="Contoh: 1500000000"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Bobot dihitung proporsional thd total kontrak.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Durasi (Hari)</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="Contoh: 45"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl text-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Finish Date</label>
                  <input
                    type="date"
                    value={formData.finish_date}
                    onChange={(e) => setFormData({ ...formData, finish_date: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl text-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Baseline Start</label>
                  <input
                    type="date"
                    value={formData.baseline_start}
                    onChange={(e) => setFormData({ ...formData, baseline_start: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl text-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Baseline Finish</label>
                  <input
                    type="date"
                    value={formData.baseline_finish}
                    onChange={(e) => setFormData({ ...formData, baseline_finish: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl text-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white shadow disabled:opacity-50"
                >
                  {isSubmitting ? 'Menyimpan...' : modalMode === 'add' ? 'Simpan Pekerjaan' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: INPUT PROGRES & FORECAST MINGGUAN (ALA MS PROJECT) */}
      {/* ========================================================================= */}
      {progressModalItem && (
        <div className="no-print fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-600/30 flex items-center justify-center text-emerald-400">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-100">Input Progres & Forecast Mingguan</h3>
                  <p className="text-[11px] text-slate-400">{currentWkLabel} Snapshot</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setProgressModalItem(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitWeeklyProgress} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Task Name</label>
                <input
                  type="text"
                  disabled
                  value={progressModalItem.task_name}
                  className="w-full px-3 py-2 text-sm bg-slate-100 text-slate-700 font-semibold border border-slate-200 rounded-xl cursor-not-allowed"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Bobot Pekerjaan</label>
                  <input
                    type="text"
                    disabled
                    value={`${Number(progressModalItem.weight).toFixed(2)}%`}
                    className="w-full px-3 py-2 text-sm bg-slate-100 text-blue-700 font-mono font-bold border border-slate-200 rounded-xl cursor-not-allowed text-right"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Bobot Actual Saat Ini</label>
                  <input
                    type="text"
                    disabled
                    value={`${Number(progressModalItem.actual_weight || 0).toFixed(2)}%`}
                    className="w-full px-3 py-2 text-sm bg-slate-100 text-emerald-700 font-mono font-bold border border-slate-200 rounded-xl cursor-not-allowed text-right"
                  />
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <span className="text-xs font-bold text-slate-800 block">Progres Khusus {currentWkLabel}:</span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      This Week Plan (%) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      placeholder="0.00"
                      value={progressFormData.plan_progress}
                      onChange={(e) => setProgressFormData({ ...progressFormData, plan_progress: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl font-mono text-right font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      This Week Act (%) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      placeholder="0.00"
                      value={progressFormData.actual_progress}
                      onChange={(e) => setProgressFormData({ ...progressFormData, actual_progress: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl font-mono text-right font-bold text-emerald-600 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center justify-between">
                    <span>Forecast Progres (%) <span className="text-slate-400 font-normal">(Opsional)</span></span>
                    <span className="text-[10px] text-amber-600 font-medium">Garis Putus-Putus Amber</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Kosongkan untuk auto-proyeksi tren"
                    value={progressFormData.forecast_progress}
                    onChange={(e) => setProgressFormData({ ...progressFormData, forecast_progress: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl font-mono text-right text-amber-600 font-bold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Jika dikosongkan, garis diagram Forecast akan otomatis diproyeksikan melanjutkan tren titik aktual.
                  </span>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setProgressModalItem(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSavingWeeklyProgress}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow disabled:opacity-50"
                >
                  {isSavingWeeklyProgress ? 'Menyimpan...' : 'Simpan Progres'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: KONFIRMASI HAPUS PEKERJAAN */}
      {/* ========================================================================= */}
      {deletingItem && (
        <div className="no-print fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center font-bold">
                <ShieldAlert className="w-5 h-5 text-rose-600" />
              </div>
              <h4 className="text-base font-bold text-slate-900">Hapus Item Pekerjaan?</h4>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Apakah Anda yakin ingin menghapus pekerjaan <strong className="text-slate-900 font-bold">"{deletingItem.task_name}"</strong>?
              Seluruh riwayat bobot mingguan pekerjaan ini akan dihapus dan bobot pekerjaan lainnya akan dihitung ulang secara otomatis.
            </p>

            <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeletingItem(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow disabled:opacity-50"
              >
                {isSubmitting ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
