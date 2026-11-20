import React, { useState } from 'react';
import { Download, ChevronDown, Check, UploadCloud, Calendar, RefreshCw } from 'lucide-react';
import { downloadProgressTemplate } from '../utils/fileImporter';
import { useAuth } from '../context/AuthContext';

export default function ProjectHeader({
  project,
  selectedWeek,
  onSelectWeek,
  availableWeeks = [],
  onExportPdf,
  onOpenImportModal,
  onOpenDeleteModal,
  isFetchingWeek = false,
}) {
  const { user } = useAuth();
  const canMutate = user && ['admin', 'project_control'].includes(user.role);

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const weeksList = availableWeeks && availableWeeks.length > 0
    ? availableWeeks
    : (project?.availableWeeks || ['Week 10', 'Week 11', 'Week 12']);

  return (
    <div className="pt-2 pb-4">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left: Project Title & Subtitle */}
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            <span className="truncate">{project.name}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 flex items-center gap-2 flex-wrap">
            <span>Project Control Overview</span>
            <span className="text-slate-300">•</span>
            <span className="font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100/80">{selectedWeek}</span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-500">Cutoff: {project.cutoffDate || "29 Aug 2025, 14:30 WITA"}</span>
            <span className="text-slate-300">•</span>
            <span className="font-mono text-slate-500">{project.code || 'EE-BGC-55'}</span>
          </p>
        </div>

        {/* Right: Actions Bar (1 Baris Rapi & Sejajar di Desktop) */}
        <div className="flex items-center gap-2 flex-shrink-0 flex-wrap lg:flex-nowrap">
          {/* 1. Week Selector Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="h-9 sm:h-10 px-3.5 inline-flex items-center gap-2 bg-white border border-slate-200/90 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 hover:bg-slate-50 hover:border-slate-300 shadow-xs transition-all whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              title={`Pilih Periode Minggu (${selectedWeek})`}
            >
              {isFetchingWeek ? (
                <RefreshCw className="w-3.5 h-3.5 text-blue-600 animate-spin" />
              ) : (
                <Calendar className="w-3.5 h-3.5 text-blue-600" />
              )}
              <span>{selectedWeek}</span>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {dropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setDropdownOpen(false)}
                ></div>
                <div className="absolute right-0 mt-1.5 w-44 bg-white border border-slate-200 rounded-2xl shadow-xl py-2 z-50 text-xs animate-scaleUp">
                  <div className="px-3.5 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                    Pilih Periode Minggu
                  </div>
                  {weeksList.map((wk) => (
                    <button
                      key={wk}
                      type="button"
                      onClick={() => {
                        onSelectWeek(wk);
                        setDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3.5 py-2 flex items-center justify-between hover:bg-slate-50 font-medium transition-colors ${
                        selectedWeek === wk ? 'text-blue-600 bg-blue-50/70 font-bold' : 'text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                        <span>{wk}</span>
                      </div>
                      {selectedWeek === wk && <Check className="w-3.5 h-3.5 text-blue-600" />}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* 2. Download Template Button (Khusus Admin & Project Control) */}
          {canMutate && (
            <button
              type="button"
              onClick={() => downloadProgressTemplate('xlsx')}
              className="h-9 sm:h-10 px-3.5 inline-flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 font-semibold text-xs sm:text-sm rounded-xl border border-slate-200/90 shadow-xs transition-all hover:border-slate-300 whitespace-nowrap"
              title="Download template standar Excel (.xlsx)"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Template</span>
            </button>
          )}

          {/* 3. Import Data Excel (.xlsx) Button (Khusus Admin & Project Control) */}
          {canMutate && onOpenImportModal && (
            <button
              type="button"
              onClick={onOpenImportModal}
              className="h-9 sm:h-10 px-3.5 inline-flex items-center gap-2 bg-white hover:bg-blue-50/60 text-slate-800 hover:text-blue-700 font-semibold text-xs sm:text-sm rounded-xl border border-slate-200/90 hover:border-blue-300 shadow-xs transition-all whitespace-nowrap group"
              title="Import Data Excel (.xlsx) — Update angka S-Curve & Progress Summary"
            >
              <UploadCloud className="w-4 h-4 text-blue-600 group-hover:scale-110 transition-transform" />
              <span>Import Excel</span>
            </button>
          )}

          {/* 4. Export Report PDF Button (Semua Role) */}
          {onExportPdf && (
            <button
              type="button"
              onClick={onExportPdf}
              className="h-9 sm:h-10 px-4 inline-flex items-center gap-2 bg-[#3B6CF6] hover:bg-blue-600 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-xs transition-all hover:shadow whitespace-nowrap"
              title="Export Laporan Eksekutif PDF"
            >
              <Download className="w-3.5 h-3.5 text-white" />
              <span>Export PDF</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
