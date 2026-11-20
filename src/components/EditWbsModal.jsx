import React, { useState, useEffect } from 'react';
import {
  Pencil,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Percent,
  Calendar,
  Layers,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { apiRequest } from '../utils/api';

export default function EditWbsModal({
  isOpen,
  onClose,
  wbsItem,
  projectId,
  activeWeek,
  onSaveSuccess
}) {
  if (!isOpen || !wbsItem) return null;

  const [description, setDescription] = useState(wbsItem.item || '');
  const [code, setCode] = useState(wbsItem.code || '');
  const [weight, setWeight] = useState(wbsItem.weight || 0);

  const [prevPlan, setPrevPlan] = useState(wbsItem.prevWeek?.plan || 0);
  const [prevAct, setPrevAct] = useState(wbsItem.prevWeek?.actual || 0);

  const [thisPlan, setThisPlan] = useState(wbsItem.thisWeek?.plan || 0);
  const [thisAct, setThisAct] = useState(wbsItem.thisWeek?.actual || 0);

  const [cumPlan, setCumPlan] = useState(wbsItem.cumulative?.plan || 0);
  const [cumAct, setCumAct] = useState(wbsItem.cumulative?.actual || 0);

  const [status, setStatus] = useState(wbsItem.status || 'On Track');
  const [nextWeekPlan, setNextWeekPlan] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Sync state when wbsItem prop changes
  useEffect(() => {
    if (wbsItem) {
      setDescription(wbsItem.item || '');
      setCode(wbsItem.code || '');
      setWeight(wbsItem.weight || 0);

      const pPlan = Number(wbsItem.prevWeek?.plan || 0);
      const pAct = Number(wbsItem.prevWeek?.actual || 0);
      const tPlan = Number(wbsItem.thisWeek?.plan || 0);
      const tAct = Number(wbsItem.thisWeek?.actual || 0);

      setPrevPlan(pPlan);
      setPrevAct(pAct);
      setThisPlan(tPlan);
      setThisAct(tAct);

      const cPlan = wbsItem.cumulative?.plan !== undefined ? Number(wbsItem.cumulative.plan) : parseFloat((pPlan + tPlan).toFixed(2));
      const cAct = wbsItem.cumulative?.actual !== undefined ? Number(wbsItem.cumulative.actual) : parseFloat((pAct + tAct).toFixed(2));

      setCumPlan(cPlan);
      setCumAct(cAct);
      setStatus(wbsItem.status || (cAct >= 100 ? 'Completed' : (cAct >= cPlan ? 'Ahead' : 'Delayed')));
      setErrorMsg('');
    }
  }, [wbsItem]);

  // Handle auto-calculating cumulative when this-week values change
  const handleThisPlanChange = (val) => {
    const num = parseFloat(val) || 0;
    setThisPlan(val);
    const newCumPlan = parseFloat((Number(prevPlan) + num).toFixed(2));
    setCumPlan(newCumPlan);
    updateAutoStatus(newCumPlan, cumAct);
  };

  const handleThisActChange = (val) => {
    const num = parseFloat(val) || 0;
    setThisAct(val);
    const newCumAct = parseFloat((Number(prevAct) + num).toFixed(2));
    setCumAct(newCumAct);
    updateAutoStatus(cumPlan, newCumAct);
  };

  const updateAutoStatus = (cPlan, cAct) => {
    const cp = Number(cPlan) || 0;
    const ca = Number(cAct) || 0;
    if (ca >= 100) setStatus('Completed');
    else if (ca > cp) setStatus('Ahead');
    else if (ca < cp) setStatus('Delayed');
    else setStatus('On Track');
  };

  const varianceNum = (Number(cumAct) - Number(cumPlan)).toFixed(2);
  const isAhead = Number(varianceNum) > 0;
  const isNeutral = Number(varianceNum) === 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!description.trim()) {
      setErrorMsg('Deskripsi item pekerjaan wajib diisi.');
      return;
    }

    setIsSubmitting(true);
    try {
      const rawProjectId = typeof projectId === 'string' ? projectId.replace('proj-', '') : (projectId || 1);
      const wbsId = wbsItem.rawId || wbsItem.id;
      const endpoint = wbsId ? `/api/projects/${rawProjectId}/wbs/${wbsId}` : `/api/projects/${rawProjectId}/wbs`;

      const payload = {
        id: wbsId,
        wbs_id: wbsId,
        project_id: rawProjectId,
        week_label: activeWeek || wbsItem.weekLabel || 'Week 12',
        code: code.trim(),
        item: description.trim(),
        description: description.trim(),
        weight: parseFloat(weight) || 0,
        weight_factor: parseFloat(weight) || 0,
        prev_week_plan: parseFloat(prevPlan) || 0,
        prev_week_actual: parseFloat(prevAct) || 0,
        this_week_plan: parseFloat(thisPlan) || 0,
        this_week_actual: parseFloat(thisAct) || 0,
        plan_progress: parseFloat(thisPlan) || 0,
        actual_progress: parseFloat(thisAct) || 0,
        cum_plan: parseFloat(cumPlan) || 0,
        cum_actual: parseFloat(cumAct) || 0,
        variance: parseFloat(varianceNum) || 0,
        status: status,
        kpi_status: status,
        next_week_plan: nextWeekPlan.trim() || null,
      };

      const res = await apiRequest(endpoint, {
        method: 'PUT',
        body: payload,
      });

      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.message || 'Gagal menyimpan perubahan WBS ke server.');
      }

      // Notify parent component of successful update
      if (onSaveSuccess) {
        onSaveSuccess(result.wbs, result.overall_metrics);
      }
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Terjadi kesalahan saat menyimpan perubahan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
      <div
        className="bg-white rounded-2xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden my-8 animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-6 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/30 text-cyan-300 border border-blue-400/30 flex items-center justify-center shrink-0">
              <Pencil className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <span>Edit Data Mingguan WBS</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-blue-500/20 text-cyan-300 border border-blue-400/30">
                  {code || 'WBS'}
                </span>
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                Koreksi progres mingguan & rencana tindak lanjut ({activeWeek || 'Active Week'})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[72vh] overflow-y-auto custom-scrollbar">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-2.5 text-xs">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Row 1: Code, Description & Weight */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                Kode WBS
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                required
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                Deskripsi Item Pekerjaan
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                Bobot Pekerjaan / Weight Factor (%)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                Status Capaian KPI
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              >
                <option value="Ahead">Ahead of Schedule</option>
                <option value="On Track">On Track</option>
                <option value="Delayed">Delayed</option>
                <option value="Completed">Completed</option>
                <option value="Pending">Pending / Scheduled</option>
              </select>
            </div>
          </div>

          {/* Section: This Week (Minggu Berjalan) */}
          <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-200/80 space-y-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-900 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              Progres Minggu Berjalan ({activeWeek || 'This Week'})
            </span>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-semibold text-slate-600 mb-1">
                  Rencana Minggu Ini (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={thisPlan}
                  onChange={(e) => handleThisPlanChange(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-600 mb-1">
                  Realisasi / Aktual Minggu Ini (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={thisAct}
                  onChange={(e) => handleThisActChange(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-emerald-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>
            </div>
          </div>

          {/* Section: Previous Week (Minggu Lalu) */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-slate-500" />
              Progres Minggu Lalu (Previous Week)
            </span>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 mb-1">
                  Rencana Minggu Lalu (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={prevPlan}
                  onChange={(e) => {
                    const v = e.target.value;
                    setPrevPlan(v);
                    setCumPlan(parseFloat((Number(v) + Number(thisPlan)).toFixed(2)));
                  }}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono text-slate-800"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-500 mb-1">
                  Aktual Minggu Lalu (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={prevAct}
                  onChange={(e) => {
                    const v = e.target.value;
                    setPrevAct(v);
                    setCumAct(parseFloat((Number(v) + Number(thisAct)).toFixed(2)));
                  }}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono text-slate-800"
                />
              </div>
            </div>
          </div>

          {/* Section: Cumulative Result & Variance Preview */}
          <div className="p-4 rounded-xl bg-slate-900 text-white space-y-2">
            <div className="flex items-center justify-between text-xs border-b border-slate-800 pb-2">
              <span className="font-semibold text-slate-300">Hasil Kalkulasi Kumulatif</span>
              <span
                className={`font-mono font-bold text-xs px-2 py-0.5 rounded ${
                  isAhead
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : isNeutral
                    ? 'bg-slate-800 text-slate-300'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                }`}
              >
                Deviasi: {isAhead ? `+${varianceNum}%` : `${varianceNum}%`} ({status})
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-1 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">Kumulatif Rencana</span>
                <span className="text-base font-mono font-bold text-blue-300">{cumPlan}%</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Kumulatif Aktual</span>
                <span className="text-base font-mono font-bold text-emerald-300">{cumAct}%</span>
              </div>
            </div>
          </div>

          {/* Section: Next Week Plan & Field Notes */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1 flex items-center justify-between">
              <span>Rencana Tindak Lanjut / Catatan Minggu Depan</span>
              <span className="text-slate-400 font-normal text-[10px]">(Opsional)</span>
            </label>
            <textarea
              rows={2}
              value={nextWeekPlan}
              onChange={(e) => setNextWeekPlan(e.target.value)}
              placeholder="Contoh: Percepatan fabrikasi piping spool dan penambahan teknisi inspeksi..."
              className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
            />
          </div>

          {/* Footer Buttons */}
          <div className="pt-2 flex items-center justify-between gap-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors"
            >
              Batal
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 flex items-center gap-2 transition-all disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Simpan Perubahan</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
