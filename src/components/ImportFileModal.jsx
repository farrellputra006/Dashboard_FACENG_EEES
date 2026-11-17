import React, { useState, useRef, useEffect } from 'react';
import {
  UploadCloud,
  FileSpreadsheet,
  FileText,
  CheckCircle2,
  AlertTriangle,
  X,
  Download,
  FolderOpen,
  RefreshCw,
  Clock,
  Layers,
  ArrowRight,
  Calendar
} from 'lucide-react';
import { parseUploadedProgressFile, downloadProgressTemplate } from '../utils/fileImporter';

export default function ImportFileModal({
  isOpen,
  onClose,
  onApplyData,
  currentFileName,
  currentWeek = 'Week 12',
  recentFiles = [],
  onSelectRecentFile
}) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFileMeta, setSelectedFileMeta] = useState(null);
  const [parsedData, setParsedData] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [activeTab, setActiveTab] = useState('upload'); // 'upload' | 'recent'
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Suggested next week label
  const [targetWeek, setTargetWeek] = useState(() => {
    const match = (currentWeek || '').match(/\d+/);
    return match ? `Week ${parseInt(match[0]) + 1}` : 'Week 13';
  });

  useEffect(() => {
    if (currentWeek) {
      const match = currentWeek.match(/\d+/);
      setTargetWeek(match ? `Week ${parseInt(match[0]) + 1}` : 'Week 13');
    }
  }, [currentWeek]);

  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const processFile = async (file) => {
    if (!file) return;
    setErrorMsg('');
    try {
      const result = await parseUploadedProgressFile(file);
      setSelectedFileMeta({
        name: file.name,
        size: (file.size / 1024).toFixed(1) + ' KB',
        type: file.name.endsWith('.csv') ? 'CSV' : file.name.endsWith('.json') ? 'JSON' : 'Excel'
      });
      setParsedData(result);
    } catch (err) {
      setErrorMsg(err.message || "Gagal memproses file. Pastikan format kolom sesuai template.");
      setParsedData(null);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleApply = async () => {
    if (parsedData && parsedData.rows && parsedData.rows.length > 0) {
      setIsSubmitting(true);
      try {
        await onApplyData({
          ...parsedData,
          weekLabel: targetWeek.trim() || 'Week 13',
        });
        onClose();
      } catch (err) {
        setErrorMsg(err.message || 'Gagal menyimpan data ke database.');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleResetModal = () => {
    setSelectedFileMeta(null);
    setParsedData(null);
    setErrorMsg('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shrink-0">
              <FolderOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Impor Data Progres Mingguan (Excel / CSV)
              </h3>
              <p className="text-xs text-slate-500">
                Simpan data progres baru langsung ke database MySQL per minggu
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-200/60 text-slate-400 hover:text-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Sub-nav Tabs & Template Buttons */}
        <div className="px-6 pt-3 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => setActiveTab('upload')}
              className={`pb-2.5 font-bold transition-all border-b-2 flex items-center gap-1.5 ${
                activeTab === 'upload'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <UploadCloud className="w-4 h-4" />
              <span>Unggah File Lokal</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('recent')}
              className={`pb-2.5 font-bold transition-all border-b-2 flex items-center gap-1.5 ${
                activeTab === 'recent'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>Preset / Baseline ({recentFiles.length})</span>
            </button>
          </div>

          <div className="flex items-center gap-2 pb-2">
            <button
              type="button"
              onClick={() => downloadProgressTemplate('xlsx')}
              className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 hover:underline"
              title="Unduh format template Excel (.xlsx)"
            >
              <Download className="w-3 h-3" />
              <span>Template Excel</span>
            </button>
            <span className="text-slate-300">•</span>
            <button
              type="button"
              onClick={() => downloadProgressTemplate('csv')}
              className="text-[11px] font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1 hover:underline"
              title="Unduh format template CSV (.csv)"
            >
              <Download className="w-3 h-3" />
              <span>Template CSV</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 custom-scrollbar">
          {activeTab === 'upload' ? (
            <>
              {/* Target Week Picker */}
              <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <div>
                    <span className="font-bold text-slate-800 block">Target Periode Minggu:</span>
                    <span className="text-slate-400 text-[11px]">Pilih atau ketik minggu pelaporan</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={targetWeek}
                    onChange={(e) => setTargetWeek(e.target.value)}
                    placeholder="Contoh: Week 13"
                    className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-bold text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 w-36 shadow-xs"
                  />
                  <div className="flex gap-1">
                    {['Week 10', 'Week 11', 'Week 12', 'Week 13'].map((wk) => (
                      <button
                        key={wk}
                        type="button"
                        onClick={() => setTargetWeek(wk)}
                        className={`px-2 py-1 rounded text-[10px] font-semibold border ${
                          targetWeek === wk ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {wk.replace('Week ', 'W-')}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Drag and Drop Box */}
              {!parsedData ? (
                <div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center gap-3 ${
                    dragActive
                      ? 'border-blue-500 bg-blue-50/50 scale-[1.01]'
                      : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-blue-400'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx, .xls, .csv, .json"
                    onChange={handleFileChange}
                    className="hidden"
                  />

                  <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-center text-blue-600 group-hover:scale-105 transition-transform">
                    <UploadCloud className="w-7 h-7" />
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-slate-800">
                      Tarik & lepaskan file Excel atau CSV di sini
                    </h4>
                    <p className="text-xs text-slate-500 mt-1">
                      atau <span className="text-blue-600 font-semibold underline">Jelajahi File Komputer</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-200/70 text-slate-600">
                      .XLSX
                    </span>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-200/70 text-slate-600">
                      .XLS
                    </span>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-200/70 text-slate-600">
                      .CSV
                    </span>
                  </div>
                </div>
              ) : (
                /* Selected File Verification Card */
                <div className="bg-emerald-50/60 border border-emerald-200 rounded-2xl p-5 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                        <FileSpreadsheet className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-slate-900">{selectedFileMeta?.name}</h4>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            Format Valid ({targetWeek})
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Ukuran: {selectedFileMeta?.size} • {parsedData.rows.length} Baris WBS Terdeteksi
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleResetModal}
                      className="text-xs text-slate-400 hover:text-slate-600 p-1"
                      title="Ganti file"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Summary of Parsed Data */}
                  <div className="grid grid-cols-3 gap-3 pt-2 text-xs">
                    <div className="bg-white p-2.5 rounded-xl border border-emerald-100">
                      <span className="text-slate-400 block text-[10px]">Total Item WBS</span>
                      <span className="font-mono font-bold text-slate-800 text-sm">
                        {parsedData.rows.length} Item
                      </span>
                    </div>
                    <div className="bg-white p-2.5 rounded-xl border border-emerald-100">
                      <span className="text-slate-400 block text-[10px]">Cum. Plan Target</span>
                      <span className="font-mono font-bold text-blue-600 text-sm">
                        {parsedData.rows.reduce((acc, r) => acc + (r.cumulative?.plan || 0), 0).toFixed(2)}%
                      </span>
                    </div>
                    <div className="bg-white p-2.5 rounded-xl border border-emerald-100">
                      <span className="text-slate-400 block text-[10px]">Cum. Actual Realisasi</span>
                      <span className="font-mono font-bold text-emerald-600 text-sm">
                        {parsedData.rows.reduce((acc, r) => acc + (r.cumulative?.actual || 0), 0).toFixed(2)}%
                      </span>
                    </div>
                  </div>

                  {/* Mini Preview Table */}
                  <div className="bg-white rounded-xl border border-slate-200 overflow-hidden text-xs">
                    <div className="p-2.5 bg-slate-50 border-b border-slate-200 font-bold text-slate-700 flex justify-between">
                      <span>Pratinjau Data (Contoh 3 Baris):</span>
                      <span className="text-slate-400 font-normal">Mapped to MySQL WBS</span>
                    </div>
                    <div className="divide-y divide-slate-100">
                      {parsedData.rows.slice(0, 3).map((r, i) => (
                        <div key={i} className="p-2.5 flex items-center justify-between font-mono text-[11px]">
                          <div className="flex items-center gap-2 truncate max-w-[240px] font-sans">
                            <span className="text-slate-400 font-mono">{r.code}</span>
                            <span className="font-medium text-slate-800 truncate">{r.item}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-slate-500">Wt: {r.weight}%</span>
                            <span className="text-blue-600">Plan: {r.cumulative?.plan}%</span>
                            <span className="text-emerald-600 font-bold">Act: {r.cumulative?.actual}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Error Alert if any */}
              {errorMsg && (
                <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl text-xs text-rose-800 flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Gagal Mengimpor File:</span>
                    <p className="mt-0.5 text-rose-700">{errorMsg}</p>
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Recent / Preset Files Tab */
            <div className="space-y-3">
              <p className="text-xs text-slate-500">
                Pilih dari dataset baseline resmi untuk simulasi mingguan:
              </p>

              <div className="space-y-2">
                {recentFiles.map((rf, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      onSelectRecentFile(rf);
                      onClose();
                    }}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                      currentFileName === rf.fileName
                        ? 'bg-blue-50/50 border-blue-400 ring-1 ring-blue-400'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-xs">
                        {rf.fileName.endsWith('.csv') ? 'CSV' : 'XLS'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h5 className="text-xs font-bold text-slate-900">{rf.fileName}</h5>
                          {currentFileName === rf.fileName && (
                            <span className="text-[10px] bg-blue-100 text-blue-700 font-semibold px-2 py-0.2 rounded-full">
                              Sedang Aktif
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {rf.fileSize} • Dimuat: {rf.importedAt}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs font-semibold text-blue-600">
                      <span>Pilih File</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <div className="text-[11px] text-slate-500 font-medium">
            <span>Data otomatis disimpan ke MySQL di endpoint <code>/api/projects/import</code>.</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-100 transition-colors"
            >
              Batal
            </button>

            {activeTab === 'upload' && parsedData && (
              <button
                type="button"
                onClick={handleApply}
                disabled={isSubmitting}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/20 flex items-center gap-1.5 transition-colors"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Menyimpan ke MySQL...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Simpan & Terapkan ({targetWeek})</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
