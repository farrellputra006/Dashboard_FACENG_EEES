import React, { useState, useEffect, useCallback } from 'react';
import {
  CheckCircle2,
  Circle,
  Plus,
  Trash2,
  Pencil,
  Calendar,
  User,
  Clock,
  AlertCircle,
  Check,
  X,
  Loader2,
  ListTodo,
  Sparkles,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../utils/api';

export default function NextWeekTab({
  selectedWeek = 'Week 12',
  projectId = 1,
  currentProject,
  projectsList = [],
  availableWeeks = []
}) {
  const { user } = useAuth();
  const isViewer = user?.role === 'viewer';

  // Resolved numeric project ID
  const rawId = currentProject?.rawId || (typeof projectId === 'string' ? projectId.replace('proj-', '') : projectId) || 1;

  // State
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('ALL'); // 'ALL', 'PENDING', 'COMPLETED'
  const [notification, setNotification] = useState(null);

  // New plan form state
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newPic, setNewPic] = useState('');
  const [newTargetDate, setNewTargetDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Editing state
  const [editingPlan, setEditingPlan] = useState(null);
  const [editDesc, setEditDesc] = useState('');
  const [editPic, setEditPic] = useState('');
  const [editTargetDate, setEditTargetDate] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [editError, setEditError] = useState('');

  // Individual item action loading (e.g. toggling or deleting)
  const [busyItemIds, setBusyItemIds] = useState(new Set());

  // Show temporary toast notification
  const showToast = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 5000);
  };

  // Fetch to-do plans from backend API
  const fetchPlans = useCallback(async () => {
    if (!rawId) return;
    setLoading(true);
    try {
      const res = await apiRequest(`/api/next-week-plans?project_id=${rawId}&week=${encodeURIComponent(selectedWeek)}`, {
        method: 'GET',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setPlans(data.plans || []);
      } else {
        showToast(data.message || 'Gagal memuat daftar rencana to-do list.', 'error');
      }
    } catch (err) {
      showToast('Koneksi ke server gagal saat memuat rencana kerja.', 'error');
    } finally {
      setLoading(false);
    }
  }, [rawId, selectedWeek]);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  // Handle Add New Plan
  const handleAddPlan = async (e) => {
    if (e) e.preventDefault();
    if (isViewer) {
      showToast('Akses ditolak: Akun Viewer tidak diizinkan menambah rencana kerja.', 'error');
      return;
    }

    const trimmedDesc = newTaskDesc.trim();
    if (!trimmedDesc) {
      setFormError('Deskripsi rencana kerja wajib diisi.');
      return;
    }

    if (trimmedDesc.length > 500) {
      setFormError('Deskripsi rencana kerja maksimal 500 karakter.');
      return;
    }

    setFormError('');
    setIsSubmitting(true);

    try {
      const res = await apiRequest('/api/next-week-plans', {
        method: 'POST',
        body: {
          project_id: rawId,
          week: selectedWeek,
          task_description: trimmedDesc,
          pic: newPic.trim() || null,
          target_date: newTargetDate || null,
          is_completed: false,
        },
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        const errorMsg = data.errors?.task_description?.[0] || data.message || 'Gagal menambahkan rencana kerja.';
        setFormError(errorMsg);
        showToast(errorMsg, 'error');
        return;
      }

      // Update state with newly returned plans
      if (data.plans) {
        setPlans(data.plans);
      } else if (data.plan) {
        setPlans((prev) => [...prev, data.plan]);
      }

      // Reset form
      setNewTaskDesc('');
      setNewPic('');
      setNewTargetDate('');
      showToast('Rencana kerja berhasil ditambahkan ke to-do list!');
    } catch (err) {
      setFormError('Terjadi kesalahan jaringan saat menyimpan rencana.');
      showToast('Terjadi kesalahan jaringan.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Toggle Checkbox (Completed Status)
  const handleToggleCompleted = async (plan) => {
    if (isViewer) {
      showToast('Akses ditolak: Akun Viewer hanya memiliki izin melihat data (read-only).', 'error');
      return;
    }

    if (busyItemIds.has(plan.id)) return;

    const nextCompleted = !plan.is_completed;

    // Optimistic UI update
    setPlans((prev) =>
      prev.map((p) => (p.id === plan.id ? { ...p, is_completed: nextCompleted } : p))
    );

    setBusyItemIds((prev) => new Set(prev).add(plan.id));

    try {
      const res = await apiRequest(`/api/next-week-plans/${plan.id}`, {
        method: 'PATCH',
        body: {
          is_completed: nextCompleted,
        },
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        // Rollback on error
        setPlans((prev) =>
          prev.map((p) => (p.id === plan.id ? { ...p, is_completed: plan.is_completed } : p))
        );
        showToast(data.message || 'Gagal memperbarui status to-do list.', 'error');
      } else {
        if (data.plans) setPlans(data.plans);
        showToast(nextCompleted ? 'Item ditandai selesai!' : 'Item ditandai belum selesai.');
      }
    } catch (err) {
      // Rollback
      setPlans((prev) =>
        prev.map((p) => (p.id === plan.id ? { ...p, is_completed: plan.is_completed } : p))
      );
      showToast('Kesalahan jaringan saat mengubah status.', 'error');
    } finally {
      setBusyItemIds((prev) => {
        const next = new Set(prev);
        next.delete(plan.id);
        return next;
      });
    }
  };

  // Start Editing Plan
  const startEditing = (plan) => {
    if (isViewer) {
      showToast('Akses ditolak: Akun Viewer tidak diizinkan mengubah rencana kerja.', 'error');
      return;
    }
    setEditingPlan(plan);
    setEditDesc(plan.task_description || '');
    setEditPic(plan.pic || '');
    setEditTargetDate(plan.target_date ? String(plan.target_date).slice(0, 10) : '');
    setEditError('');
  };

  // Submit Edit Plan
  const handleSaveEdit = async (e) => {
    if (e) e.preventDefault();
    if (!editingPlan) return;

    const trimmedDesc = editDesc.trim();
    if (!trimmedDesc) {
      setEditError('Deskripsi rencana kerja tidak boleh kosong.');
      return;
    }

    setEditError('');
    setIsUpdating(true);

    try {
      const res = await apiRequest(`/api/next-week-plans/${editingPlan.id}`, {
        method: 'PATCH',
        body: {
          task_description: trimmedDesc,
          pic: editPic.trim() || null,
          target_date: editTargetDate || null,
        },
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        const errMsg = data.errors?.task_description?.[0] || data.message || 'Gagal menyimpan perubahan.';
        setEditError(errMsg);
        showToast(errMsg, 'error');
        return;
      }

      if (data.plans) {
        setPlans(data.plans);
      } else if (data.plan) {
        setPlans((prev) => prev.map((p) => (p.id === data.plan.id ? data.plan : p)));
      }

      setEditingPlan(null);
      showToast('Perubahan rencana kerja berhasil disimpan!');
    } catch (err) {
      setEditError('Terjadi kesalahan jaringan.');
      showToast('Gagal menghubungi server.', 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle Delete Plan
  const handleDeletePlan = async (plan) => {
    if (isViewer) {
      showToast('Akses ditolak: Akun Viewer tidak diizinkan menghapus rencana kerja.', 'error');
      return;
    }

    const confirmDelete = window.confirm(
      `Apakah Anda yakin ingin menghapus item rencana kerja:\n"${plan.task_description}"?`
    );
    if (!confirmDelete) return;

    setBusyItemIds((prev) => new Set(prev).add(plan.id));

    try {
      const res = await apiRequest(`/api/next-week-plans/${plan.id}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        showToast(data.message || 'Gagal menghapus rencana kerja.', 'error');
        return;
      }

      if (data.plans) {
        setPlans(data.plans);
      } else {
        setPlans((prev) => prev.filter((p) => p.id !== plan.id));
      }

      showToast('Rencana kerja berhasil dihapus dari to-do list.');
    } catch (err) {
      showToast('Kesalahan jaringan saat menghapus item.', 'error');
    } finally {
      setBusyItemIds((prev) => {
        const next = new Set(prev);
        next.delete(plan.id);
        return next;
      });
    }
  };

  // Filtering calculations
  const totalCount = plans.length;
  const completedCount = plans.filter((p) => p.is_completed).length;
  const pendingCount = totalCount - completedCount;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const filteredPlans = plans.filter((plan) => {
    if (filterStatus === 'PENDING') return !plan.is_completed;
    if (filterStatus === 'COMPLETED') return plan.is_completed;
    return true;
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Toast Notification Banner */}
      {notification && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center justify-between shadow-xs animate-fadeIn ${
            notification.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : 'bg-emerald-50 border-emerald-200 text-emerald-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotification(null)}
            className="text-slate-400 hover:text-slate-600 text-xs font-bold px-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Header Banner & Lookahead Summary */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
              <ListTodo className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <span>Next Week Plan (To-Do List Action Items)</span>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  {selectedWeek}
                </span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Checklist rencana kerja mingguan dinamis untuk{' '}
                <span className="font-semibold text-slate-700">
                  {currentProject?.name || 'Proyek Aktif'}
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Progress & Metrics Summary */}
        <div className="flex flex-wrap items-center gap-4">
          {/* Progress Bar & KPI */}
          <div className="min-w-[180px] bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
            <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
              <span className="text-slate-600">Progres Checklist</span>
              <span className="font-mono tabular-nums font-bold text-blue-600">{progressPercent}%</span>
            </div>
            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-blue-600 to-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
            <div className="flex justify-between items-center text-[10px] text-slate-400 mt-1.5 font-mono tabular-nums">
              <span>{completedCount} Selesai</span>
              <span>{pendingCount} Pending</span>
            </div>
          </div>

          {/* Filter Pills in Segmented Style */}
          <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200/80 text-xs">
            <button
              type="button"
              onClick={() => setFilterStatus('ALL')}
              className={`px-3 py-1.5 rounded-lg font-bold tabular-nums transition-all ${
                filterStatus === 'ALL'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semua ({totalCount})
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus('PENDING')}
              className={`px-3 py-1.5 rounded-lg font-bold tabular-nums transition-all ${
                filterStatus === 'PENDING'
                  ? 'bg-white text-amber-700 shadow-xs'
                  : 'text-slate-600 hover:text-amber-700'
              }`}
            >
              Pending ({pendingCount})
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus('COMPLETED')}
              className={`px-3 py-1.5 rounded-lg font-bold tabular-nums transition-all ${
                filterStatus === 'COMPLETED'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-slate-600 hover:text-emerald-700'
              }`}
            >
              Selesai ({completedCount})
            </button>
          </div>
        </div>
      </div>

      {/* Viewer Read-Only Notice */}
      {isViewer && (
        <div className="p-3.5 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            <strong>Mode Read-Only:</strong> Akun Anda berstatus <strong>Viewer</strong>. Anda hanya dapat melihat rencana to-do list tanpa izin menambah, mengedit, atau menghapus item.
          </span>
        </div>
      )}

      {/* Quick Add To-Do Item Form (Hidden for Viewer) */}
      {!isViewer && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Plus className="w-4 h-4 text-blue-600" />
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Tambah Rencana Kerja Baru — {selectedWeek}
              </h4>
            </div>
            <span className="text-[11px] text-slate-400">Tekan Enter atau klik tombol untuk menyimpan</span>
          </div>

          <form onSubmit={handleAddPlan} className="space-y-3">
            {formError && (
              <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
              {/* Task Description Input */}
              <div className="md:col-span-6">
                <input
                  type="text"
                  value={newTaskDesc}
                  onChange={(e) => setNewTaskDesc(e.target.value)}
                  placeholder="Deskripsi rencana kerja (wajib) — misal: Pengujian hydrotest spool piping 6-inch..."
                  disabled={isSubmitting}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>

              {/* PIC Input */}
              <div className="md:col-span-3">
                <div className="relative">
                  <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={newPic}
                    onChange={(e) => setNewPic(e.target.value)}
                    placeholder="PIC / Penanggung Jawab"
                    disabled={isSubmitting}
                    className="w-full pl-8 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>

              {/* Target Date Input */}
              <div className="md:col-span-3">
                <div className="relative">
                  <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                  <input
                    type="date"
                    value={newTargetDate}
                    onChange={(e) => setNewTargetDate(e.target.value)}
                    disabled={isSubmitting}
                    className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={isSubmitting || !newTaskDesc.trim()}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Menyimpan Rencana...</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah Rencana</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* To-Do Items List Container */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50/70 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-800">Daftar Rencana Kerja</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-200 text-slate-700">
              {filteredPlans.length} Item
            </span>
          </div>
          <span className="text-[11px] text-slate-400">
            Terhubung MySQL • Real-time Sync
          </span>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            <span className="text-xs font-medium">Memuat to-do list rencana kerja...</span>
          </div>
        ) : filteredPlans.length === 0 ? (
          /* Empty State */
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
              <ListTodo className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-800">
              {plans.length === 0
                ? `Belum ada rencana to-do list untuk ${selectedWeek}`
                : `Tidak ada item dengan status ${filterStatus.toLowerCase()}`}
            </h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              {plans.length === 0
                ? 'Gunakan form input di atas untuk menambahkan to-do list rencana kerja prioritas minggu depan.'
                : 'Ubah filter status di atas untuk melihat seluruh rencana kerja.'}
            </p>
          </div>
        ) : (
          /* To-Do Items */
          <div className="divide-y divide-slate-100">
            {filteredPlans.map((plan) => {
              const isBusy = busyItemIds.has(plan.id);

              return (
                <div
                  key={plan.id}
                  className={`p-4 transition-colors flex items-start justify-between gap-3 group ${
                    plan.is_completed ? 'bg-slate-50/50 hover:bg-slate-50' : 'hover:bg-blue-50/20'
                  }`}
                >
                  {/* Left: Checkbox & Task Description */}
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <button
                      type="button"
                      onClick={() => handleToggleCompleted(plan)}
                      disabled={isViewer || isBusy}
                      title={
                        isViewer
                          ? 'Peran Viewer tidak dapat mengubah status'
                          : plan.is_completed
                          ? 'Tandai belum selesai'
                          : 'Tandai selesai'
                      }
                      className={`mt-0.5 w-5 h-5 rounded-lg border flex items-center justify-center transition-all shrink-0 ${
                        plan.is_completed
                          ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                          : 'border-slate-300 bg-white hover:border-blue-500'
                      } ${isViewer ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      {isBusy ? (
                        <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
                      ) : plan.is_completed ? (
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      ) : null}
                    </button>

                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-xs leading-relaxed transition-all ${
                          plan.is_completed
                            ? 'line-through text-slate-400 font-normal'
                            : 'font-semibold text-slate-800'
                        }`}
                      >
                        {plan.task_description}
                      </p>

                      {/* Meta Tags (PIC, Target Date, Status Badge) */}
                      <div className="flex flex-wrap items-center gap-2 mt-2 text-[11px]">
                        {plan.pic && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-medium border border-slate-200/80">
                            <User className="w-3 h-3 text-slate-400" />
                            <span>{plan.pic}</span>
                          </span>
                        )}

                        {plan.target_date && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-mono border border-slate-200/80">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            <span>
                              {new Date(plan.target_date).toLocaleDateString('id-ID', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </span>
                          </span>
                        )}

                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            plan.is_completed
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              plan.is_completed ? 'bg-emerald-500' : 'bg-amber-500'
                            }`}
                          ></span>
                          <span>{plan.is_completed ? 'Selesai' : 'Pending'}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Actions (Edit & Delete) */}
                  {!isViewer && (
                    <div className="flex items-center gap-1 opacity-90 group-hover:opacity-100 transition-opacity shrink-0">
                      <button
                        type="button"
                        onClick={() => startEditing(plan)}
                        disabled={isBusy}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                        title="Edit rencana kerja ini"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeletePlan(plan)}
                        disabled={isBusy}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Hapus rencana kerja ini"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Edit Plan Modal */}
      {editingPlan && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fadeIn"
          onClick={() => setEditingPlan(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden my-8 animate-scaleUp"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-600/30 text-blue-400 flex items-center justify-center border border-blue-500/30">
                  <Pencil className="w-4 h-4 text-blue-300" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white tracking-tight">
                    Edit Rencana Kerja To-Do List
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Koreksi teks, PIC, atau target tanggal penyelesaian
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingPlan(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveEdit} className="p-6 space-y-4">
              {editError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{editError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Deskripsi Rencana Kerja <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  placeholder="Tuliskan rencana kegiatan kerja..."
                  disabled={isUpdating}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    PIC / Penanggung Jawab
                  </label>
                  <input
                    type="text"
                    value={editPic}
                    onChange={(e) => setEditPic(e.target.value)}
                    placeholder="misal: Andi Rahman / QC"
                    disabled={isUpdating}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Target Tanggal Selesai
                  </label>
                  <input
                    type="date"
                    value={editTargetDate}
                    onChange={(e) => setEditTargetDate(e.target.value)}
                    disabled={isUpdating}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setEditingPlan(null)}
                  disabled={isUpdating}
                  className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-semibold text-xs transition-colors"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  disabled={isUpdating || !editDesc.trim()}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/20 flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUpdating ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Simpan Perubahan</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
