import React, { useState, useEffect } from 'react';
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
  Sparkles
} from 'lucide-react';
import { progressSummaryRows, hseData } from '../data/dashboardData';
import ImportFileModal from './ImportFileModal';
import { downloadProgressTemplate } from '../utils/fileImporter';

export default function ProgressSummaryTab({ initialRows, hseReportData }) {
  const [rows, setRows] = useState(initialRows && initialRows.length > 0 ? initialRows : progressSummaryRows);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [activeFileMeta, setActiveFileMeta] = useState(null); // null means default baseline

  useEffect(() => {
    if (initialRows && initialRows.length > 0) {
      setRows(initialRows);
    }
  }, [initialRows]);

  const activeHse = hseReportData || hseData;

  // Preset / recent local files list
  const [recentFiles, setRecentFiles] = useState([
    {
      fileName: "Energy_Equity_Rev02_Official_Baseline.xlsx",
      fileSize: "14.2 KB",
      importedAt: "29 Aug 2025, 08:30",
      rows: progressSummaryRows
    },
    {
      fileName: "Weekly_Report_Cutoff_W45.csv",
      fileSize: "8.6 KB",
      importedAt: "22 Aug 2025, 17:00",
      rows: progressSummaryRows.map(r => ({
        ...r,
        cumulative: {
          plan: parseFloat((r.cumulative.plan * 0.98).toFixed(2)),
          actual: parseFloat((r.cumulative.actual * 0.98).toFixed(2))
        }
      }))
    }
  ]);

  // Dynamic calculations based on active rows
  const totalWeight = rows.reduce((acc, r) => acc + (Number(r.weight) || 0), 0).toFixed(2);
  const totalPrevPlan = rows.reduce((acc, r) => acc + (r.prevWeek?.plan || 0), 0).toFixed(2);
  const totalPrevAct = rows.reduce((acc, r) => acc + (r.prevWeek?.actual || 0), 0).toFixed(2);
  const totalThisPlan = rows.reduce((acc, r) => acc + (r.thisWeek?.plan || 0), 0).toFixed(2);
  const totalThisAct = rows.reduce((acc, r) => acc + (r.thisWeek?.actual || 0), 0).toFixed(2);
  const totalCumPlan = rows.reduce((acc, r) => acc + (r.cumulative?.plan || 0), 0).toFixed(2);
  const totalCumAct = rows.reduce((acc, r) => acc + (r.cumulative?.actual || 0), 0).toFixed(2);
  const totalVarianceNum = (Number(totalCumAct) - Number(totalCumPlan)).toFixed(2);
  const totalVariance = Number(totalVarianceNum) > 0 ? `+${totalVarianceNum}` : `${totalVarianceNum}`;

  const handleApplyImportedData = (data) => {
    if (data && data.rows) {
      setRows(data.rows);
      setActiveFileMeta({
        fileName: data.fileName,
        fileSize: data.fileSize,
        importedAt: data.importedAt,
        rowsCount: data.rows.length
      });

      // Add to recent files if not already present
      setRecentFiles((prev) => {
        const filtered = prev.filter(f => f.fileName !== data.fileName);
        return [
          {
            fileName: data.fileName,
            fileSize: data.fileSize,
            importedAt: `Hari ini, ${data.importedAt}`,
            rows: data.rows
          },
          ...filtered
        ].slice(0, 5);
      });
    }
  };

  const handleSelectRecentFile = (rf) => {
    setRows(rf.rows);
    setActiveFileMeta({
      fileName: rf.fileName,
      fileSize: rf.fileSize,
      importedAt: rf.importedAt,
      rowsCount: rf.rows.length
    });
  };

  const handleResetToDefault = () => {
    setRows(progressSummaryRows);
    setActiveFileMeta(null);
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* File Management Action Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: Active Data Source Information */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
            <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900">
                {activeFileMeta ? activeFileMeta.fileName : "Rev-02 Approved Baseline Dataset"}
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  activeFileMeta
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-blue-50 text-blue-700 border-blue-200'
                }`}
              >
                {activeFileMeta ? "File Lokal Diimpor" : "Default Project Baseline"}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {activeFileMeta
                ? `Ukuran: ${activeFileMeta.fileSize} • ${activeFileMeta.rowsCount} Baris WBS • Dimuat: ${activeFileMeta.importedAt}`
                : "Basis data standar W-46 cut-off (29 Aug 2025) untuk Booster Gas Compressor 55 MMSCFD"}
            </p>
          </div>
        </div>

        {/* Right: Action Buttons (Import Local File, Download Template, Reset) */}
        <div className="flex flex-wrap items-center gap-2.5">
          {activeFileMeta && (
            <button
              type="button"
              onClick={handleResetToDefault}
              className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              title="Kembalikan data ke baseline awal"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
              <span>Reset Baseline</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => downloadProgressTemplate('xlsx')}
            className="px-3.5 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/90 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
            title="Unduh template Excel untuk input data lokal Anda"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Download Template</span>
          </button>

          <button
            type="button"
            onClick={() => setIsImportModalOpen(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-md shadow-blue-500/20"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Impor File Lokal</span>
          </button>
        </div>
      </div>

      {/* Executive Summary Progress Table */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="p-5 bg-slate-50/80 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                Executive Progress Summary — Week 46
              </h3>
              {activeFileMeta && (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                  Custom File Active
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Cutoff Date: 29 August 2025 • Weight Factor Breakdown based on {activeFileMeta ? activeFileMeta.fileName : "Rev-02 Approved Baseline"}
            </p>
          </div>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 self-start sm:self-auto">
            <span>Overall: {totalVariance}% ({Number(totalVarianceNum) >= 0 ? 'Ahead' : 'Delayed'})</span>
          </span>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                <th className="p-3 text-center w-12">No</th>
                <th className="p-3 min-w-[240px]">Item Description</th>
                <th className="p-3 text-right">Weight Factor (%)</th>
                <th className="p-3 text-center border-l border-slate-200" colSpan={2}>
                  Previous Week (%)
                  <div className="grid grid-cols-2 text-[10px] text-slate-500 font-normal mt-0.5">
                    <span>Plan</span>
                    <span>Actual</span>
                  </div>
                </th>
                <th className="p-3 text-center border-l border-slate-200" colSpan={2}>
                  This Week (%)
                  <div className="grid grid-cols-2 text-[10px] text-slate-500 font-normal mt-0.5">
                    <span>Plan</span>
                    <span>Actual</span>
                  </div>
                </th>
                <th className="p-3 text-center border-l border-slate-200" colSpan={2}>
                  Cumulative (%)
                  <div className="grid grid-cols-2 text-[10px] text-slate-500 font-normal mt-0.5">
                    <span>Plan</span>
                    <span>Actual</span>
                  </div>
                </th>
                <th className="p-3 text-right border-l border-slate-200 min-w-[90px]">Variance</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 font-mono">
              {rows.map((row, idx) => {
                const isAhead = (row.variance || 0) > 0;
                const isNeutral = (row.variance || 0) === 0;

                return (
                  <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-3 text-center font-sans font-medium text-slate-500">
                      {row.no}
                    </td>
                    <td className="p-3 font-sans font-bold text-slate-800">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400 font-mono text-[11px]">{row.code}</span>
                        <span>{row.item}</span>
                      </div>
                    </td>
                    <td className="p-3 text-right font-semibold text-slate-700">
                      {Number(row.weight).toFixed(2)}%
                    </td>

                    {/* Previous Week */}
                    <td className="p-3 text-center text-slate-500 border-l border-slate-100">
                      {Number(row.prevWeek?.plan || 0).toFixed(2)}%
                    </td>
                    <td className="p-3 text-center font-medium text-slate-700">
                      {Number(row.prevWeek?.actual || 0).toFixed(2)}%
                    </td>

                    {/* This Week */}
                    <td className="p-3 text-center text-slate-500 border-l border-slate-100">
                      {Number(row.thisWeek?.plan || 0).toFixed(2)}%
                    </td>
                    <td className="p-3 text-center font-medium text-slate-700">
                      {Number(row.thisWeek?.actual || 0).toFixed(2)}%
                    </td>

                    {/* Cumulative */}
                    <td className="p-3 text-center font-medium text-blue-700 border-l border-slate-100 bg-blue-50/20">
                      {Number(row.cumulative?.plan || 0).toFixed(2)}%
                    </td>
                    <td className="p-3 text-center font-bold text-slate-900 bg-emerald-50/20">
                      {Number(row.cumulative?.actual || 0).toFixed(2)}%
                    </td>

                    {/* Variance */}
                    <td className="p-3 text-right font-bold border-l border-slate-100">
                      <span
                        className={`inline-block px-2 py-0.5 rounded ${
                          isAhead
                            ? 'bg-emerald-50 text-emerald-700'
                            : isNeutral
                            ? 'text-slate-500'
                            : 'bg-rose-50 text-rose-700'
                        }`}
                      >
                        {isAhead ? `+${Number(row.variance).toFixed(2)}%` : `${Number(row.variance).toFixed(2)}%`}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>

            {/* Total Footer Row */}
            <tfoot>
              <tr className="bg-slate-900 text-white font-bold border-t-2 border-slate-800 font-mono">
                <td className="p-3.5 text-center font-sans">#</td>
                <td className="p-3.5 font-sans tracking-wide">TOTAL PROJECT PROGRESS</td>
                <td className="p-3.5 text-right">{totalWeight}%</td>
                <td className="p-3.5 text-center text-slate-300 border-l border-slate-800">{totalPrevPlan}%</td>
                <td className="p-3.5 text-center text-slate-200">{totalPrevAct}%</td>
                <td className="p-3.5 text-center text-slate-300 border-l border-slate-800">{totalThisPlan}%</td>
                <td className="p-3.5 text-center text-slate-200">{totalThisAct}%</td>
                <td className="p-3.5 text-center text-blue-300 border-l border-slate-800 bg-slate-800/80">
                  {totalCumPlan}%
                </td>
                <td className="p-3.5 text-center text-emerald-300 bg-slate-800/80">
                  {totalCumAct}%
                </td>
                <td className={`p-3.5 text-right border-l border-slate-800 ${Number(totalVarianceNum) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {totalVariance}%
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* HSE Performance Summary Widget */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <h4 className="text-sm font-bold uppercase tracking-wider text-slate-700">
              HSE Performance Summary
            </h4>
          </div>
          <span className="text-xs text-slate-400 font-medium">Compliance: 100% OSHA & Ditjen Migas</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {/* Card 1: Total Manhours */}
          <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                Total Manhours
              </span>
              <div className="text-2xl font-black text-slate-900 tracking-tight font-mono mt-0.5">
                {activeHse.totalManhours}
              </div>
              <span className="text-[11px] text-slate-400">Cumulative Safe Hours</span>
            </div>
          </div>

          {/* Card 2: This Week Manhours */}
          <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                This Week (W-46)
              </span>
              <div className="text-2xl font-black text-slate-900 tracking-tight font-mono mt-0.5">
                {activeHse.thisWeekManhours}
              </div>
              <span className="text-[11px] text-slate-400">Field workforce & subcontractors</span>
            </div>
          </div>

          {/* Card 3: LTA / Fatality */}
          <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                LTA / Fatality
              </span>
              <div className="text-2xl font-black text-emerald-600 tracking-tight font-mono mt-0.5">
                {activeHse.ltaFatality}
              </div>
              <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                <span>✓</span> {activeHse.safeDays || 284} Days Without Lost Time Injury
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Local File Import Modal */}
      <ImportFileModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onApplyData={handleApplyImportedData}
        currentFileName={activeFileMeta?.fileName}
        recentFiles={recentFiles}
        onSelectRecentFile={handleSelectRecentFile}
      />
    </div>
  );
}
