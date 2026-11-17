import React, { useState } from 'react';
import { Download, ChevronDown, Check, UploadCloud, FileSpreadsheet, Calendar } from 'lucide-react';
import { downloadProgressTemplate } from '../utils/fileImporter';

export default function ProjectHeader({
  project,
  selectedWeek,
  onSelectWeek,
  availableWeeks = [],
  onExportPdf,
  onOpenImportModal,
}) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const weeksList = availableWeeks && availableWeeks.length > 0
    ? availableWeeks
    : (project?.availableWeeks || ['Week 10', 'Week 11', 'Week 12']);

  return (
    <div className="pt-6 pb-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left: Project Title & Subtitle */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
            <span>{project.name} — Dashboard</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1.5 flex items-center gap-2">
            <span>Selected project overview</span>
            <span className="text-slate-300">•</span>
            <span className="font-semibold text-slate-700">{selectedWeek}</span>
            <span className="text-slate-300">•</span>
            <span>Updated {project.cutoffDate || "29 Aug 2025, 14:30 WITA"}</span>
          </p>
        </div>

        {/* Right: Controls & Badges */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Live Badge */}
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            LIVE
          </span>

          {/* Week Selector Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 hover:bg-slate-50 hover:border-slate-300 shadow-xs transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              <span>{selectedWeek}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {dropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setDropdownOpen(false)}
                ></div>
                <div className="absolute right-0 mt-1.5 w-44 bg-white border border-slate-200 rounded-xl shadow-xl py-1.5 z-50 text-xs animate-scaleUp">
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
                      className={`w-full text-left px-3.5 py-2.5 flex items-center justify-between hover:bg-slate-50 font-medium transition-colors ${
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

          {/* Import Excel / CSV Button */}
          <button
            type="button"
            onClick={onOpenImportModal}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-blue-50 hover:bg-blue-100/80 text-blue-700 font-semibold text-xs rounded-xl border border-blue-200 shadow-xs transition-all"
            title="Import File Excel atau CSV untuk update progres mingguan"
          >
            <UploadCloud className="w-3.5 h-3.5 text-blue-600" />
            <span>Import Excel/CSV</span>
          </button>

          {/* Download Template Quick Action */}
          <button
            type="button"
            onClick={() => downloadProgressTemplate('xlsx')}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-600 font-medium text-xs rounded-xl border border-slate-200 shadow-xs transition-all"
            title="Download Template Format Excel (.xlsx)"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden sm:inline">Template</span>
          </button>

          {/* Export PDF Button */}
          <button
            type="button"
            onClick={onExportPdf}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl border border-slate-200 shadow-xs transition-all group"
          >
            <Download className="w-3.5 h-3.5 text-slate-500 group-hover:text-blue-600 transition-colors" />
            <span>Export PDF</span>
          </button>
        </div>
      </div>
    </div>
  );
}
