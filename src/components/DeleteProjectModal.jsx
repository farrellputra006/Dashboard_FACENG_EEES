import React, { useState } from 'react';
import { Trash2, AlertTriangle, X, Loader2, ShieldAlert } from 'lucide-react';
import { apiRequest } from '../utils/api';

export default function DeleteProjectModal({
  isOpen,
  onClose,
  project,
  onDeleteSuccess
}) {
  if (!isOpen || !project) return null;

  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleDelete = async () => {
    setErrorMsg('');
    setIsDeleting(true);

    try {
      const rawId = project.rawId || (typeof project.id === 'string' ? project.id.replace('proj-', '') : project.id);
      const res = await apiRequest(`/api/projects/${rawId}`, {
        method: 'DELETE',
      });

      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.message || 'Gagal menghapus proyek dari database.');
      }

      if (onDeleteSuccess) {
        onDeleteSuccess(rawId, result.projects);
      }
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Terjadi kesalahan saat menghapus proyek.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
      <div
        className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden my-8 animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 bg-rose-950/20 border-b border-rose-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0 border border-rose-200">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                Konfirmasi Hapus Proyek
              </h3>
              <p className="text-xs text-rose-600 font-medium">
                Tindakan Berisiko Tinggi (Permanent Delete)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-2.5 text-xs">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Project Info Card */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Nama Proyek:</span>
              <span className="font-bold text-slate-900 text-right truncate max-w-[220px]" title={project.name}>
                {project.name}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Kode Proyek:</span>
              <span className="font-mono font-bold text-blue-600">{project.code}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Nilai Kontrak:</span>
              <span className="font-mono text-slate-700">{project.contractValue || '-'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Lokasi:</span>
              <span className="text-slate-700">{project.location || 'Sengkang'}</span>
            </div>
          </div>

          {/* Warning Message Box */}
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 space-y-2 text-xs">
            <div className="flex items-center gap-2 font-bold text-rose-700">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>Peringatan Divisi FACENG</span>
            </div>
            <p className="leading-relaxed text-slate-700 font-medium">
              Apakah Anda yakin ingin menghapus proyek ini beserta seluruh data progres dan rekam jejak mingguannya? Tindakan ini tidak dapat dibatalkan.
            </p>
            <p className="text-[11px] text-slate-500 pt-1">
              • Seluruh data WBS, metrik kurva S, log kontraktor, dan laporan HSE terkait akan dihapus secara bersih (Cascade) dari database MySQL.
            </p>
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="p-5 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-semibold text-xs transition-colors"
          >
            Batal
          </button>

          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-600/25 flex items-center gap-2 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Menghapus Proyek...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                <span>Ya, Hapus Proyek Ini</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
