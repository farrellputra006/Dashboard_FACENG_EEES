import React, { useState, useRef } from 'react';
import {
  FolderPlus,
  UploadCloud,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertCircle,
  X,
  Loader2,
  Building,
  Calendar,
  Layers,
  Sparkles,
  Coins,
  MapPin,
  FileCheck2
} from 'lucide-react';
import { parseUploadedProgressFile, downloadProgressTemplate } from '../utils/fileImporter';
import { apiRequest } from '../utils/api';

export default function CreateProjectModal({ isOpen, onClose, onProjectCreated }) {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState('upload'); // 'upload' | 'form'
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Form State
  const [projectCode, setProjectCode] = useState('');
  const [projectName, setProjectName] = useState('');
  const [contractorName, setContractorName] = useState('PT Energy Equity Engineering');
  const [location, setLocation] = useState('Sengkang - Sulawesi Selatan');
  const [contractValue, setContractValue] = useState('18500000000');
  const [currentWeek, setCurrentWeek] = useState('Week 1');
  const [planCum, setPlanCum] = useState('15.00');
  const [actCum, setActCum] = useState('16.50');
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [cutoffDate, setCutoffDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Uploaded File state
  const [dragActive, setDragActive] = useState(false);
  const [selectedFileMeta, setSelectedFileMeta] = useState(null);
  const [parsedRows, setParsedRows] = useState([]);
  const fileInputRef = useRef(null);

  // File parsing handler
  const handleProcessFile = async (file) => {
    setErrorMsg('');
    if (!file) return;

    if (file.name.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf') {
      setErrorMsg('File ini bukan format Excel. Untuk menyimpan laporan PDF sebagai arsip, silakan upload di bagian Lampiran Dokumen PDF.');
      return;
    }

    try {
      const parsed = await parseUploadedProgressFile(file);
      setSelectedFileMeta({
        name: parsed.fileName,
        size: parsed.fileSize,
        rowCount: parsed.rows.length,
      });
      setParsedRows(parsed.rows);

      // Auto-suggest project name from filename if not yet set
      if (!projectName) {
        const cleanName = file.name
          .replace(/\.(xlsx|xls|csv)$/i, '')
          .replace(/[_-]/g, ' ')
          .replace(/\b\w/g, (c) => c.toUpperCase());
        setProjectName(cleanName);
      }

      // Auto-suggest project code if not yet set
      if (!projectCode) {
        const cleanName = file.name.replace(/\.(xlsx|xls|csv)$/i, '');
        const initials = cleanName
          .split(/[\s_-]+/)
          .filter(Boolean)
          .map((w) => w[0].toUpperCase())
          .slice(0, 3)
          .join('');
        setProjectCode((initials || 'PRJ') + '-' + Math.floor(10 + Math.random() * 90));
      }

      // Auto-calculate cumulative plan & actual from parsed WBS rows
      const totalPlan = parsed.rows.reduce((acc, r) => acc + (r.cumulative?.plan || 0), 0);
      const totalAct = parsed.rows.reduce((acc, r) => acc + (r.cumulative?.actual || 0), 0);
      if (totalPlan > 0 || totalAct > 0) {
        setPlanCum(Math.min(100, totalPlan).toFixed(2));
        setActCum(Math.min(100, totalAct).toFixed(2));
      }
    } catch (err) {
      setErrorMsg(err.message || 'Gagal memproses file. Pastikan format kolom sesuai template.');
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleProcessFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleProcessFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setErrorMsg('');

    if (!projectCode.trim()) {
      setErrorMsg('Kode proyek wajib diisi (contoh: GSU-06, PIS-04).');
      return;
    }
    if (!projectName.trim()) {
      setErrorMsg('Nama proyek wajib diisi.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        project_code: projectCode.trim().toUpperCase(),
        project_name: projectName.trim(),
        contractor_name: contractorName.trim(),
        location: location.trim(),
        contract_value: parseFloat(contractValue) || 15000000000,
        currency: 'IDR',
        current_week: currentWeek.trim() || 'Week 1',
        start_date: startDate,
        cutoff_date: cutoffDate,
        plan_cumulative: parseFloat(planCum) || 0,
        actual_cumulative: parseFloat(actCum) || 0,
        rows: parsedRows.length > 0 ? parsedRows : null,
      };

      const res = await apiRequest('/api/projects', {
        method: 'POST',
        body: payload,
      });

      const result = await res.json();

      if (!res.ok || !result.success) {
        throw new Error(result.message || 'Gagal menyimpan proyek baru ke database.');
      }

      // Notify parent component to update projects list & select the new project
      if (onProjectCreated) {
        onProjectCreated(result.project, result.projects);
      }
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Terjadi kesalahan saat membuat proyek baru.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
      <div
        className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden my-8 animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-6 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/30 text-cyan-300 border border-blue-400/30 flex items-center justify-center shrink-0">
              <FolderPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Upload & Tambah Proyek Baru
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                Inisialisasi master proyek baru ke dalam database Energy Equity
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

        {/* Tab Buttons */}
        <div className="px-6 pt-4 border-b border-slate-100 flex items-center justify-between gap-4 bg-slate-50/60">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('upload')}
              className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
                activeTab === 'upload'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <UploadCloud className="w-4 h-4" />
              <span>1. Upload File Excel / CSV</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('form')}
              className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
                activeTab === 'form'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>2. Detail Metadata Proyek</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => downloadProgressTemplate('xlsx')}
            className="text-[11px] font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 hover:underline"
            title="Unduh format template standar Excel"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Format Template</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[68vh] overflow-y-auto custom-scrollbar">
          {/* Error Banner */}
          {errorMsg && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-3 text-xs animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">Gagal Membuat Proyek</span>
                <span>{errorMsg}</span>
              </div>
            </div>
          )}

          {/* TAB 1: UPLOAD FILE EXCEL / CSV */}
          {activeTab === 'upload' && (
            <div className="space-y-5">
              {/* Dropzone */}
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center ${
                  dragActive
                    ? 'border-blue-500 bg-blue-50/50 scale-[1.01]'
                    : selectedFileMeta
                    ? 'border-emerald-400 bg-emerald-50/30'
                    : 'border-slate-300 hover:border-blue-400 bg-slate-50/50 hover:bg-slate-50'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileChange}
                  className="hidden"
                />

                <div className="w-14 h-14 rounded-2xl bg-white shadow-sm border border-slate-200 text-blue-600 flex items-center justify-center mb-3">
                  {selectedFileMeta ? (
                    <FileCheck2 className="w-7 h-7 text-emerald-600" />
                  ) : (
                    <UploadCloud className="w-7 h-7 text-blue-600" />
                  )}
                </div>

                {selectedFileMeta ? (
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-emerald-700 flex items-center justify-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{selectedFileMeta.name}</span>
                    </p>
                    <p className="text-xs text-slate-500">
                      Ukuran: {selectedFileMeta.size} • Terdeteksi {selectedFileMeta.rowCount} baris WBS
                    </p>
                    <p className="text-[11px] text-blue-600 font-medium pt-1">
                      Klik untuk mengganti berkas lain
                    </p>
                  </div>
                ) : (
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">
                      Tarik & Letakkan file Excel (.xlsx) atau CSV proyek di sini
                    </h4>
                    <p className="text-xs text-slate-500 mt-1">
                      atau <span className="text-blue-600 font-semibold underline">pilih berkas dari komputer</span>
                    </p>
                    <p className="text-[11px] text-slate-400 mt-2 font-mono">
                      Mendukung template format standar WBS & progres mingguan
                    </p>
                  </div>
                )}
              </div>

              {/* Detected Quick Summary Card */}
              {selectedFileMeta && (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700 pb-2 border-b border-slate-200">
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-blue-600" />
                      Hasil Ekstraksi Otomatis dari File
                    </span>
                    <button
                      type="button"
                      onClick={() => setActiveTab('form')}
                      className="text-blue-600 hover:underline font-semibold"
                    >
                      Ubah di Tab Detail →
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                      <span className="text-slate-400 text-[11px] block">Kode Disarankan</span>
                      <span className="font-mono font-bold text-slate-900">{projectCode || 'Auto'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[11px] block">Estimasi Rencana</span>
                      <span className="font-mono font-bold text-blue-600">{planCum}%</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[11px] block">Estimasi Aktual</span>
                      <span className="font-mono font-bold text-emerald-600">{actCum}%</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[11px] block">Periode</span>
                      <span className="font-mono font-bold text-slate-900">{currentWeek}</span>
                    </div>
                  </div>

                  {/* Preview first 3 rows */}
                  {parsedRows.length > 0 && (
                    <div className="pt-2">
                      <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                        Pratinjau 3 Baris WBS Awal
                      </span>
                      <div className="space-y-1">
                        {parsedRows.slice(0, 3).map((r, i) => (
                          <div key={i} className="text-[11px] bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 flex justify-between items-center">
                            <span className="font-medium text-slate-800 truncate max-w-[260px]">
                              {r.code} - {r.item}
                            </span>
                            <span className="font-mono text-slate-500">
                              Bobot: {r.weight}% • Act: {r.cumulative?.actual || 0}%
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Informational Help Box */}
              {!selectedFileMeta && (
                <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200/80 text-xs text-blue-900 space-y-2">
                  <div className="font-bold flex items-center gap-1.5">
                    <FileSpreadsheet className="w-4 h-4 text-blue-600 shrink-0" />
                    Belum memiliki file?
                  </div>
                  <p className="text-slate-600 leading-relaxed">
                    Anda dapat beralih ke tab <strong className="text-slate-800">"2. Detail Metadata Proyek"</strong> untuk menginput langsung proyek secara manual, atau unduh <span className="text-blue-700 font-semibold cursor-pointer underline" onClick={() => downloadProgressTemplate('xlsx')}>format template Excel</span> untuk diisi bersama tim.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: DETAIL METADATA PROYEK */}
          <div className={`space-y-4 ${activeTab === 'upload' ? 'hidden' : 'block'}`}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Field: Kode Proyek */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Kode Proyek <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={projectCode}
                  onChange={(e) => setProjectCode(e.target.value.toUpperCase())}
                  placeholder="Contoh: GSU-06, WH-07, FL-08"
                  className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-sm font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  required
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">Kode unik pengenal proyek</span>
              </div>

              {/* Field: Periode Minggu Awal */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Periode Minggu Awal
                </label>
                <input
                  type="text"
                  value={currentWeek}
                  onChange={(e) => setCurrentWeek(e.target.value)}
                  placeholder="Contoh: Week 1 atau Week 10"
                  className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">Label minggu pelaporan awal</span>
              </div>
            </div>

            {/* Field: Nama Proyek */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Nama Proyek Lengkap <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="Contoh: Gas Sweetening Unit Revamp 25 MMSCFD"
                className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Field: Kontraktor */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Kontraktor Pelaksana
                </label>
                <div className="relative">
                  <Building className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                  <input
                    type="text"
                    value={contractorName}
                    onChange={(e) => setContractorName(e.target.value)}
                    placeholder="PT Contractor Name"
                    className="w-full pl-9 pr-3.5 py-2 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  />
                </div>
              </div>

              {/* Field: Lokasi */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Lokasi Lapangan
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Sengkang Gas Field, Wajo"
                    className="w-full pl-9 pr-3.5 py-2 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Field: Nilai Kontrak */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Nilai Kontrak (IDR)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs font-mono font-bold text-slate-500">Rp</span>
                  <input
                    type="number"
                    step="1000000"
                    value={contractValue}
                    onChange={(e) => setContractValue(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  />
                </div>
              </div>

              {/* Field: Plan Cumulative */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Rencana Kumulatif (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={planCum}
                  onChange={(e) => setPlanCum(e.target.value)}
                  className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-sm font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>

              {/* Field: Actual Cumulative */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Aktual Kumulatif (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={actCum}
                  onChange={(e) => setActCum(e.target.value)}
                  className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-sm font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Tanggal Mulai Proyek
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Tanggal Cut-off Data
                </label>
                <input
                  type="date"
                  value={cutoffDate}
                  onChange={(e) => setCutoffDate(e.target.value)}
                  className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>
            </div>

            {/* Structure info callout */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                {parsedRows.length > 0
                  ? `Menggunakan ${parsedRows.length} baris WBS dari berkas terunggah.`
                  : 'Sistem otomatis menginisialisasi struktur EPC baku (Preparation, Engineering, Procurement, Construction, Commissioning).'}
              </span>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-5 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors"
          >
            Batal
          </button>

          <div className="flex items-center gap-2">
            {activeTab === 'upload' && !selectedFileMeta && (
              <button
                type="button"
                onClick={() => setActiveTab('form')}
                className="px-4 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold text-xs transition-colors"
              >
                Isi Formulir Manual →
              </button>
            )}

            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 flex items-center gap-2 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Menyimpan Proyek...</span>
                </>
              ) : (
                <>
                  <FolderPlus className="w-4 h-4" />
                  <span>Simpan & Buka Proyek</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
