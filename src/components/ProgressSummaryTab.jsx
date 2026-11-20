import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldCheck,
  HardHat,
  AlertTriangle,
  Users,
  Award,
  Clock,
  UploadCloud,
  FileSpreadsheet,
  Download,
  RotateCcw,
  CheckCircle2,
  FileText,
  FolderOpen,
  Sparkles,
  Pencil,
  Trash2,
  AlertCircle,
  X,
  TrendingUp,
  Layers,
  ChevronRight,
  Info
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../utils/api';
import { progressSummaryRows, hseData } from '../data/dashboardData';
import ImportFileModal from './ImportFileModal';
import EditWbsModal from './EditWbsModal';
import { downloadProgressTemplate } from '../utils/fileImporter';

export default function ProgressSummaryTab({
  initialRows,
  hseReportData,
  selectedWeek,
  onOpenImportModal,
  onOpenDeleteModal,
  projectId,
  onWbsUpdated,
  onScheduleUpdated
}) {
  const { user } = useAuth();
  const canMutate = user && ['admin', 'project_control'].includes(user.role);

  const activeProjectId = projectId ? String(projectId).replace('proj-', '') : 1;

  // Table summary state
  const [rows, setRows] = useState([]);
  const [totalData, setTotalData] = useState({
    weight: 100,
    previous_week: { plan: 0, actual: 0 },
    this_week: { plan: 0, actual: 0 },
    cumulative_week: { plan: 0, actual: 0 },
    variance: { last_week: 0, this_week: 0 },
    status: 'Ahead'
  });
  const [headers, setHeaders] = useState({
    previous_week_date: '22 Aug 2025',
    current_week_date: '29 Aug 2025',
    week_number: 12
  });
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // Modal Edit Progres Minggu Ini
  const [editingItem, setEditingItem] = useState(null);
  const [editForm, setEditForm] = useState({
    this_week_plan: '0.00',
    this_week_actual: '0.00',
    forecast_progress: ''
  });
  const [isSavingProgress, setIsSavingProgress] = useState(false);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Fetch Progress Summary from Laravel Endpoint
  const fetchProgressSummary = useCallback(async () => {
    if (!activeProjectId) return;
    setLoading(true);
    try {
      const res = await apiRequest(`/api/progress-summary?project_id=${activeProjectId}&week=${encodeURIComponent(selectedWeek || 'Week 12')}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setRows(data.rows || []);
          if (data.total) setTotalData(data.total);
          if (data.headers) setHeaders(data.headers);
        }
      }
    } catch (err) {
      console.warn('Gagal memuat API progress-summary, menggunakan data cadangan WBS:', err);
      if (initialRows && initialRows.length > 0) {
        setRows(initialRows);
      }
    } finally {
      setLoading(false);
    }
  }, [activeProjectId, selectedWeek, initialRows]);

  useEffect(() => {
    fetchProgressSummary();
  }, [fetchProgressSummary]);

  // Open Edit Progress Modal
  const handleOpenEditModal = (item) => {
    setEditingItem(item);
    setEditForm({
      this_week_plan: item.this_week ? String(item.this_week.plan) : '0.00',
      this_week_actual: item.this_week ? String(item.this_week.actual) : '0.00',
      forecast_progress: item.forecast_progress ? String(item.forecast_progress) : ''
    });
  };

  // Save Weekly Progress
  const handleSaveProgress = async (e) => {
    e.preventDefault();
    if (!editingItem) return;

    setIsSavingProgress(true);
    try {
      const payload = {
        project_schedule_id: editingItem.id,
        week: selectedWeek || 'Week 12',
        plan_progress: parseFloat(editForm.this_week_plan) || 0,
        actual_progress: parseFloat(editForm.this_week_actual) || 0,
        forecast_progress: editForm.forecast_progress !== '' ? parseFloat(editForm.forecast_progress) : null,
        week_date: headers.current_week_date
      };

      const res = await apiRequest('/api/schedule-weekly-progress', {
        method: 'POST',
        body: payload
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Gagal menyimpan progres mingguan.');
      }

      showToast(json.message || 'Progres mingguan berhasil diperbarui!', 'success');
      setEditingItem(null);

      // Re-fetch to update all cumulative values & totals
      await fetchProgressSummary();
      if (onScheduleUpdated) onScheduleUpdated();
    } catch (err) {
      showToast(err.message || 'Terjadi kesalahan sistem.', 'error');
    } finally {
      setIsSavingProgress(false);
    }
  };

  // Helper untuk rendering variance anti-bingung
  const renderVariance = (val) => {
    const num = Number(val || 0);
    if (num < -0.001) {
      return (
        <span className="inline-flex items-center gap-1 font-mono tabular-nums font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded text-xs border border-rose-200/80">
          <span>-</span>{Math.abs(num).toFixed(2)}%
        </span>
      );
    }
    if (num > 0.001) {
      return (
        <span className="inline-flex items-center gap-1 font-mono tabular-nums font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-xs border border-emerald-200/80">
          <span>+</span>{num.toFixed(2)}%
        </span>
      );
    }
    return (
      <span className="inline-flex items-center font-mono tabular-nums font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded text-xs border border-slate-200/80">
        0.00%
      </span>
    );
  };

  const activeHse = hseReportData || hseData;

  // Live calculation for preview inside Modal
  const modalPrevPlan = editingItem ? Number(editingItem.previous_week?.plan || 0) : 0;
  const modalPrevAct = editingItem ? Number(editingItem.previous_week?.actual || 0) : 0;
  const modalThisPlan = parseFloat(editForm.this_week_plan) || 0;
  const modalThisAct = parseFloat(editForm.this_week_actual) || 0;
  const modalCumPlan = Number((modalPrevPlan + modalThisPlan).toFixed(2));
  const modalCumAct = Number((modalPrevAct + modalThisAct).toFixed(2));
  const modalVariance = Number((modalCumAct - modalCumPlan).toFixed(2));

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

      {/* Top Action Bar & Standard FACENG Header Info */}
      <div className="no-print bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-700 font-mono text-xs font-bold border border-blue-200">
              FACENG STANDARD
            </span>
            <h3 className="text-base font-bold text-slate-900">Overall Progress Summary Table</h3>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Format resmi evaluasi mingguan dengan kalkulasi berantai: <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700">Cumulative = Previous + This Week</code> dan <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700">Variance = Actual - Plan</code>.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onOpenImportModal && canMutate && (
            <button
              type="button"
              onClick={onOpenImportModal}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
              title="Import Data Excel (.xlsx) untuk update otomatis angka S-Curve & Progress Summary"
            >
              <UploadCloud className="w-4 h-4 text-blue-600" />
              <div className="text-left">
                <span className="block leading-tight text-slate-800">Import Data Excel (.xlsx)</span>
                <span className="text-[10px] text-slate-400 font-normal leading-none">Update S-Curve & Summary</span>
              </div>
            </button>
          )}

          {onOpenDeleteModal && canMutate && (
            <button
              type="button"
              onClick={onOpenDeleteModal}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold border border-rose-200 transition-colors"
              title="Hapus proyek beserta seluruh data progres"
            >
              <Trash2 className="w-4 h-4 text-rose-600" />
              <span>Hapus Proyek</span>
            </button>
          )}
        </div>
      </div>

      {/* Multi-Level Table Container */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 space-y-2">
            <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
            <p className="text-sm font-medium">Memuat data Progress Summary...</p>
          </div>
        ) : rows.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-2">
            <FileSpreadsheet className="w-10 h-10 text-slate-300 mx-auto" />
            <h4 className="text-sm font-bold text-slate-700">Tidak ada data progres</h4>
            <p className="text-xs text-slate-400">Belum ada item schedule terdaftar untuk minggu {selectedWeek}.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                {/* Baris 1: Header Level 1 (Executive Clean Light Palette) */}
                <tr className="bg-slate-100/90 text-slate-700 text-xs font-bold uppercase tracking-wider text-center border-b border-slate-200">
                  <th rowSpan={2} className="px-3 py-3 border border-slate-200 w-12 text-center text-slate-600">
                    No
                  </th>
                  <th rowSpan={2} className="px-4 py-3 border border-slate-200 text-left min-w-[260px] text-slate-800">
                    Item Description
                  </th>
                  <th rowSpan={2} className="px-3 py-3 border border-slate-200 w-24 text-right text-slate-700">
                    Weight (%)
                  </th>
                  <th colSpan={2} className="px-3 py-2 border border-slate-200 bg-slate-100">
                    <div className="text-slate-800">Previous Week</div>
                    <div className="text-[10px] font-medium text-slate-500 lowercase">({headers.previous_week_date})</div>
                  </th>
                  <th colSpan={2} className="px-3 py-2 border border-blue-200 bg-blue-50/80 text-blue-900">
                    <div className="font-bold">This Week</div>
                    <div className="text-[10px] font-medium text-blue-700 lowercase">({headers.current_week_date})</div>
                  </th>
                  <th colSpan={2} className="px-3 py-2 border border-slate-200 bg-slate-100">
                    <div className="text-slate-800">Cumulative Week</div>
                    <div className="text-[10px] font-medium text-slate-500 lowercase">({headers.current_week_date})</div>
                  </th>
                  <th colSpan={2} className="px-3 py-2 border border-slate-200 bg-slate-100">
                    <div className="text-slate-800">Variance</div>
                    <div className="text-[10px] font-medium text-slate-500 lowercase">(Actual - Plan)</div>
                  </th>
                  <th rowSpan={2} className="px-3 py-3 border border-slate-200 w-28 text-center text-slate-600 no-print">
                    Aksi
                  </th>
                </tr>

                {/* Baris 2: Sub-Kolom Plan & Act */}
                <tr className="bg-slate-50 text-slate-600 text-[11px] font-semibold uppercase tracking-wider text-right border-b border-slate-200">
                  <th className="px-2 py-2 border border-slate-200 text-right">Plan (%)</th>
                  <th className="px-2 py-2 border border-slate-200 text-right text-emerald-700">Act (%)</th>
                  <th className="px-2 py-2 border border-blue-200 text-right bg-blue-50/60 text-blue-900">Plan (%)</th>
                  <th className="px-2 py-2 border border-blue-200 text-right bg-blue-50/60 text-emerald-700">Act (%)</th>
                  <th className="px-2 py-2 border border-slate-200 text-right">Plan (%)</th>
                  <th className="px-2 py-2 border border-slate-200 text-right text-emerald-700">Act (%)</th>
                  <th className="px-2 py-2 border border-slate-200 text-right">Last Week</th>
                  <th className="px-2 py-2 border border-slate-200 text-right">This Week</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200 font-sans">
                {rows.map((row, idx) => (
                  <tr key={row.id || idx} className="hover:bg-blue-50/20 transition-colors">
                    <td className="px-3 py-3 text-center font-mono tabular-nums text-slate-500 bg-slate-50/40 border border-slate-200/80">
                      {row.no || idx + 1}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-900 border border-slate-200/80">
                      <div>{row.item_description || row.item || row.name}</div>
                      <span className="text-[10px] font-normal text-slate-400">Status: {row.status || 'Active'}</span>
                    </td>
                    <td className="px-3 py-3 text-right font-mono tabular-nums font-bold text-blue-600 bg-blue-50/30 border border-slate-200/80">
                      {Number(row.weight).toFixed(2)}%
                    </td>

                    {/* Previous Week */}
                    <td className="px-2 py-3 text-right font-mono tabular-nums text-slate-700 border border-slate-200/80">
                      {Number(row.previous_week?.plan ?? row.prevWeek?.plan ?? 0).toFixed(2)}%
                    </td>
                    <td className="px-2 py-3 text-right font-mono tabular-nums font-semibold text-emerald-700 border border-slate-200/80">
                      {Number(row.previous_week?.actual ?? row.prevWeek?.actual ?? 0).toFixed(2)}%
                    </td>

                    {/* This Week */}
                    <td className="px-2 py-3 text-right font-mono tabular-nums text-slate-800 bg-blue-50/20 border border-slate-200/80">
                      {Number(row.this_week?.plan ?? row.thisWeek?.plan ?? 0).toFixed(2)}%
                    </td>
                    <td className="px-2 py-3 text-right font-mono tabular-nums font-semibold text-emerald-700 bg-blue-50/20 border border-slate-200/80">
                      {Number(row.this_week?.actual ?? row.thisWeek?.actual ?? 0).toFixed(2)}%
                    </td>

                    {/* Cumulative Week */}
                    <td className="px-2 py-3 text-right font-mono tabular-nums text-slate-800 border border-slate-200/80">
                      {Number(row.cumulative_week?.plan ?? row.cumulative?.plan ?? 0).toFixed(2)}%
                    </td>
                    <td className="px-2 py-3 text-right font-mono tabular-nums font-bold text-emerald-700 border border-slate-200/80">
                      {Number(row.cumulative_week?.actual ?? row.cumulative?.actual ?? 0).toFixed(2)}%
                    </td>

                    {/* Variance (Anti-Bingung) */}
                    <td className="px-2 py-3 text-right border border-slate-200/80">
                      {renderVariance(row.variance?.last_week ?? 0)}
                    </td>
                    <td className="px-2 py-3 text-right border border-slate-200/80">
                      {renderVariance(row.variance?.this_week ?? row.variance ?? 0)}
                    </td>

                    {/* Action Button */}
                    <td className="px-3 py-3 text-center border border-slate-200/80 no-print">
                      {canMutate ? (
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(row)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-[11px] font-bold border border-blue-200 transition"
                          title="Edit Progres Minggu Ini"
                        >
                          <Pencil className="w-3 h-3 text-blue-600" />
                          <span>Edit</span>
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-400 italic">Read-only</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>

              {/* Baris Rangkuman Paling Bawah: TOTAL / OVERALL PROGRESS */}
              <tfoot>
                <tr className="bg-slate-900 text-white font-bold text-xs uppercase tracking-wider border-t-2 border-slate-700 shadow-inner">
                  <td className="px-3 py-3.5 text-center font-mono tabular-nums border border-slate-700">TOTAL</td>
                  <td className="px-4 py-3.5 text-left text-slate-100 border border-slate-700">
                    <div className="flex items-center gap-2">
                      <span>TOTAL / OVERALL PROGRESS</span>
                      <span className="text-[10px] normal-case font-normal px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                        100% Target
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-3.5 text-right font-mono tabular-nums text-cyan-300 border border-slate-700">
                    {Number(totalData.weight || 100).toFixed(2)}%
                  </td>
                  <td className="px-2 py-3.5 text-right font-mono tabular-nums text-slate-200 border border-slate-700">
                    {Number(totalData.previous_week?.plan || 0).toFixed(2)}%
                  </td>
                  <td className="px-2 py-3.5 text-right font-mono tabular-nums text-emerald-300 border border-slate-700">
                    {Number(totalData.previous_week?.actual || 0).toFixed(2)}%
                  </td>
                  <td className="px-2 py-3.5 text-right font-mono tabular-nums text-blue-200 bg-blue-950/40 border border-slate-700">
                    {Number(totalData.this_week?.plan || 0).toFixed(2)}%
                  </td>
                  <td className="px-2 py-3.5 text-right font-mono tabular-nums text-emerald-300 bg-blue-950/40 border border-slate-700">
                    {Number(totalData.this_week?.actual || 0).toFixed(2)}%
                  </td>
                  <td className="px-2 py-3.5 text-right font-mono tabular-nums text-slate-200 border border-slate-700">
                    {Number(totalData.cumulative_week?.plan || 0).toFixed(2)}%
                  </td>
                  <td className="px-2 py-3.5 text-right font-mono tabular-nums text-emerald-300 text-sm border border-slate-700">
                    {Number(totalData.cumulative_week?.actual || 0).toFixed(2)}%
                  </td>
                  <td className="px-2 py-3.5 text-right border border-slate-700">
                    {renderVariance(totalData.variance?.last_week)}
                  </td>
                  <td className="px-2 py-3.5 text-right border border-slate-700">
                    {renderVariance(totalData.variance?.this_week)}
                  </td>
                  <td className="px-3 py-3.5 text-center border border-slate-700 no-print">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        Number(totalData.variance?.this_week) >= 0
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                      }`}
                    >
                      {Number(totalData.variance?.this_week) >= 0 ? 'Ahead' : 'Delayed'}
                    </span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* HSE / Safety Performance Summary Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900">Safety & HSE Performance Record</h4>
            <p className="text-xs text-slate-500">
              Total Safe Manhours: <strong className="text-slate-800 font-mono">{activeHse?.totalManhours || '186,056 hrs'}</strong> | LTA / Fatality: <strong className="text-emerald-600 font-mono">0 (Zero Accident)</strong>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="px-3 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200">
            Safe Days: <strong>{activeHse?.safeDays || 284} Days</strong>
          </span>
          <span className="px-3 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
            PTW Verified: <strong>{activeHse?.permitToWork || 48}</strong>
          </span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL: EDIT PROGRES MINGGU INI */}
      {/* ========================================================================= */}
      {editingItem && (
        <div className="no-print fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-600/30 flex items-center justify-center text-blue-400">
                  <Pencil className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-100">Edit Progres Minggu Ini</h3>
                  <p className="text-[11px] text-slate-400">
                    {selectedWeek} ({headers.current_week_date})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProgress} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Item Description</label>
                <input
                  type="text"
                  disabled
                  value={editingItem.item_description || editingItem.item || ''}
                  className="w-full px-3 py-2 text-sm bg-slate-100 text-slate-700 font-semibold border border-slate-200 rounded-xl cursor-not-allowed"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Bobot Item (Weight %)</label>
                  <input
                    type="text"
                    disabled
                    value={`${Number(editingItem.weight).toFixed(2)}%`}
                    className="w-full px-3 py-2 text-sm bg-slate-100 font-mono text-blue-700 font-bold border border-slate-200 rounded-xl cursor-not-allowed text-right"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Previous Actual (%)</label>
                  <input
                    type="text"
                    disabled
                    value={`${modalPrevAct.toFixed(2)}%`}
                    className="w-full px-3 py-2 text-sm bg-slate-100 font-mono text-emerald-700 font-bold border border-slate-200 rounded-xl cursor-not-allowed text-right"
                  />
                </div>
              </div>

              <div className="p-4 bg-blue-50/60 rounded-xl border border-blue-200 space-y-3">
                <span className="text-xs font-bold text-blue-900 block">Input Progres Khusus Minggu Ini:</span>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      This Week Plan (%) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={editForm.this_week_plan}
                      onChange={(e) => setEditForm({ ...editForm, this_week_plan: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl font-mono text-right font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      This Week Act (%) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={editForm.this_week_actual}
                      onChange={(e) => setEditForm({ ...editForm, this_week_actual: e.target.value })}
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
                    value={editForm.forecast_progress}
                    onChange={(e) => setEditForm({ ...editForm, forecast_progress: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl font-mono text-right text-amber-600 font-bold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Jika dikosongkan, garis diagram Forecast akan otomatis diproyeksikan melanjutkan tren titik aktual.
                  </span>
                </div>
              </div>

              {/* Dynamic Live Preview Box */}
              <div className="bg-slate-900 text-white p-3.5 rounded-xl border border-slate-800 space-y-2 text-xs">
                <div className="text-[11px] font-bold text-cyan-300 uppercase tracking-wider flex items-center justify-between">
                  <span>Hasil Kalkulasi Berantai:</span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      modalVariance >= 0 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                    }`}
                  >
                    {modalVariance >= 0 ? 'Ahead' : 'Delayed'}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 font-mono text-center pt-1 border-t border-slate-800">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-sans">Cumulative Plan</span>
                    <span className="font-bold text-slate-200">{modalCumPlan}%</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-sans">Cumulative Act</span>
                    <span className="font-bold text-emerald-400">{modalCumAct}%</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-sans">Variance</span>
                    <span className={`font-bold ${modalVariance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {modalVariance >= 0 ? `+${modalVariance}%` : `${modalVariance}%`}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSavingProgress}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow disabled:opacity-50"
                >
                  {isSavingProgress ? 'Menyimpan...' : 'Simpan Progres'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
