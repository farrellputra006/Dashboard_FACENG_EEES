import React from 'react';
import { FileText, Download, CheckCircle, X, Printer } from 'lucide-react';

export default function ExportModal({ isOpen, onClose, projectName, activeWeek }) {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl p-6 space-y-5 animate-scaleUp">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-base font-bold text-slate-900">Export Progress Report</h4>
              <p className="text-xs text-slate-500">Official Project Control Document</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3 text-xs text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-100 font-mono">
          <div className="flex justify-between">
            <span className="text-slate-400">Project:</span>
            <span className="font-semibold text-slate-800 text-right truncate max-w-[200px]">{projectName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Reporting Cycle:</span>
            <span className="font-semibold text-slate-800">{activeWeek} (Cutoff 29-Aug-2025)</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Format:</span>
            <span className="font-semibold text-slate-800">Adobe PDF / Executive Print</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Security:</span>
            <span className="text-emerald-600 font-semibold">Approved for Distribution</span>
          </div>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-700 font-semibold text-xs rounded-xl hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>Print / Save PDF</span>
          </button>
        </div>
      </div>
    </div>
  );
}

