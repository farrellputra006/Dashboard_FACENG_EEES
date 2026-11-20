import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  FileText,
  UploadCloud,
  Download,
  Eye,
  Trash2,
  Plus,
  Search,
  Filter,
  X,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Calendar,
  User,
  HardDrive,
  FileCheck,
  AlertTriangle,
  FolderArchive
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../utils/api';

const CATEGORY_OPTIONS = [
  'ALL',
  'Weekly Report',
  'Kontrak / LOA',
  'SPK',
  'Schedule PDF',
  'Lainnya'
];

export default function ProjectAttachmentsCard({ projectId, currentProject, selectedWeek }) {
  const { user } = useAuth();
  const canMutate = user && ['admin', 'project_control'].includes(user.role);

  const rawId = currentProject?.rawId || (typeof projectId === 'string' ? projectId.replace('proj-', '') : projectId) || 1;

  // State
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState(null);

  // Upload Modal State
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadCategory, setUploadCategory] = useState('Weekly Report');
  const [uploadError, setUploadError] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  // Preview Modal State
  const [previewDoc, setPreviewDoc] = useState(null);

  // Delete Modal State
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Fetch attachments list
  const fetchAttachments = useCallback(async () => {
    if (!rawId) return;
    setLoading(true);
    try {
      const res = await apiRequest(`/api/projects/${rawId}/attachments`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setAttachments(data.attachments || []);
        }
      }
    } catch (err) {
      console.warn('Gagal memuat daftar lampiran PDF:', err);
    } finally {
      setLoading(false);
    }
  }, [rawId]);

  useEffect(() => {
    fetchAttachments();
  }, [fetchAttachments]);

  // Handle Drag & Drop in Upload Modal
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleFileSelection = (file) => {
    setUploadError('');
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      setUploadError('Hanya file dokumen PDF (.pdf) yang diperbolehkan.');
      setUploadFile(null);
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      setUploadError('Ukuran file melebihi batas maksimum 20 MB.');
      setUploadFile(null);
      return;
    }

    setUploadFile(file);

    // Auto-fill title if empty
    if (!uploadTitle.trim()) {
      const cleanName = file.name.replace(/\.pdf$/i, '').replace(/[-_]/g, ' ');
      setUploadTitle(cleanName);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelection(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelection(e.target.files[0]);
    }
  };

  // Execute Upload
  const handleExecuteUpload = async (e) => {
    e.preventDefault();
    if (!canMutate) {
      showToast('Akses ditolak: Hanya Admin dan Project Control yang dapat mengunggah dokumen.', 'error');
      return;
    }

    if (!uploadFile) {
      setUploadError('Silakan pilih berkas file PDF terlebih dahulu.');
      return;
    }

    setIsUploading(true);
    setUploadError('');

    try {
      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('title', uploadTitle.trim() || uploadFile.name.replace(/\.pdf$/i, ''));
      formData.append('category', uploadCategory);

      const res = await apiRequest(`/api/projects/${rawId}/attachments`, {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Gagal mengunggah file lampiran PDF.');
      }

      showToast(data.message || 'Lampiran dokumen PDF berhasil disimpan!');
      setIsUploadModalOpen(false);
      setUploadFile(null);
      setUploadTitle('');
      setUploadCategory('Weekly Report');
      if (fileInputRef.current) fileInputRef.current.value = '';

      // Refresh list
      await fetchAttachments();
    } catch (err) {
      setUploadError(err.message || 'Terjadi kesalahan sistem saat mengunggah.');
    } finally {
      setIsUploading(false);
    }
  };

  // Execute Delete
  const handleExecuteDelete = async () => {
    if (!deleteTarget || !canMutate) return;

    setIsDeleting(true);
    try {
      const res = await apiRequest(`/api/projects/${rawId}/attachments/${deleteTarget.id}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Gagal menghapus lampiran dokumen PDF.');
      }

      showToast(data.message || 'Lampiran dokumen PDF berhasil dihapus!');
      setAttachments((prev) => prev.filter((item) => item.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      showToast(err.message || 'Terjadi kesalahan saat menghapus.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // Filter attachments
  const filteredAttachments = attachments.filter((item) => {
    const matchCategory = selectedCategory === 'ALL' || item.category === selectedCategory;
    const q = searchQuery.toLowerCase().trim();
    const matchSearch =
      !q ||
      item.title?.toLowerCase().includes(q) ||
      item.file_name?.toLowerCase().includes(q) ||
      item.category?.toLowerCase().includes(q);
    return matchCategory && matchSearch;
  });

  const getCategoryBadgeClass = (category) => {
    switch (category) {
      case 'Weekly Report':
        return 'bg-blue-50 text-blue-700 border-blue-200/80';
      case 'Kontrak / LOA':
        return 'bg-amber-50 text-amber-700 border-amber-200/80';
      case 'SPK':
        return 'bg-purple-50 text-purple-700 border-purple-200/80';
      case 'Schedule PDF':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200/80';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200/80';
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`no-print fixed top-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl text-xs font-semibold border transition-all animate-bounce ${
            toast.type === 'error'
              ? 'bg-rose-900/90 text-rose-100 border-rose-700'
              : 'bg-emerald-900/90 text-emerald-100 border-emerald-700'
          }`}
        >
          {toast.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-rose-300" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-300" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* 1. Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
              <FolderArchive className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <span>Lampiran Dokumen PDF</span>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                  {attachments.length} Dokumen
                </span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Arsip berkas resmi proyek (Weekly Report, Kontrak / LOA, SPK, Schedule PDF, dll)
              </p>
            </div>
          </div>
        </div>

        {/* Upload Button (Only for admin & project_control) */}
        {canMutate && (
          <div className="flex flex-col items-start sm:items-end">
            <button
              type="button"
              onClick={() => {
                setUploadError('');
                setUploadFile(null);
                setUploadTitle('');
                setIsUploadModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all hover:shadow-sm"
              title="Upload berkas lampiran PDF baru"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Upload Lampiran PDF</span>
            </button>
            <span className="text-[10px] text-slate-400 mt-1">
              Format .pdf, maks. 20 MB per file
            </span>
          </div>
        )}
      </div>

      {/* 2. Filter Pills & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          {CATEGORY_OPTIONS.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white shadow-xs font-bold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900'
              }`}
            >
              {cat === 'ALL' ? 'Semua Kategori' : cat}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama dokumen PDF..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
        </div>
      </div>

      {/* 3. Document List */}
      {loading ? (
        <div className="py-12 text-center text-slate-400 space-y-2">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600" />
          <p className="text-xs font-medium">Memuat daftar lampiran dokumen PDF...</p>
        </div>
      ) : filteredAttachments.length === 0 ? (
        <div className="bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-200 p-8 text-center space-y-3">
          <div className="w-12 h-12 mx-auto rounded-xl bg-white border border-slate-200 text-slate-400 flex items-center justify-center shadow-xs">
            <FileText className="w-6 h-6 text-slate-400" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-800">
              {searchQuery || selectedCategory !== 'ALL'
                ? 'Tidak ada lampiran PDF yang cocok dengan filter'
                : 'Belum ada dokumen PDF yang dilampirkan'}
            </h4>
            <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
              {canMutate
                ? 'Gunakan tombol "Upload Lampiran PDF" di atas untuk melampirkan berkas Weekly Report, Salinan Kontrak, LOA, atau SPK ke proyek ini.'
                : 'Dokumen lampiran PDF belum tersedia untuk proyek ini.'}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAttachments.map((item) => (
            <div
              key={item.id}
              className="group bg-white rounded-xl border border-slate-200/80 hover:border-blue-300 hover:shadow-xs p-4 flex flex-col justify-between transition-all space-y-3"
            >
              {/* Top: Icon, Title & Category */}
              <div>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-200/70 font-bold text-xs group-hover:scale-105 transition-transform">
                    <FileText className="w-5 h-5 text-rose-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4
                      className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1"
                      title={item.title}
                    >
                      {item.title}
                    </h4>
                    <p
                      className="text-[11px] font-mono text-slate-400 truncate mt-0.5"
                      title={item.file_name}
                    >
                      {item.file_name}
                    </p>
                  </div>
                </div>

                {/* Badges & Meta */}
                <div className="flex flex-wrap items-center gap-2 mt-3 pt-2.5 border-t border-slate-100 text-[11px]">
                  <span
                    className={`px-2 py-0.5 rounded-md font-semibold text-[10px] border ${getCategoryBadgeClass(
                      item.category
                    )}`}
                  >
                    {item.category || 'Dokumen'}
                  </span>
                  <span className="font-mono tabular-nums text-slate-500 font-medium">
                    {item.formatted_size || '0 KB'}
                  </span>
                </div>
              </div>

              {/* Bottom: Date, Uploader & Action Buttons */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                <div className="truncate pr-2">
                  <span>
                    {new Date(item.created_at).toLocaleDateString('id-ID', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </span>
                  {item.uploader?.name && (
                    <span className="text-slate-500 ml-1">
                      • {item.uploader.name.split(' ')[0]}
                    </span>
                  )}
                </div>

                {/* 3 Action Buttons: Preview, Download, Delete */}
                <div className="flex items-center gap-1 shrink-0">
                  {/* Preview Button */}
                  <button
                    type="button"
                    onClick={() => setPreviewDoc(item)}
                    className="p-1.5 rounded-lg bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-600 transition-colors"
                    title="Preview dokumen PDF langsung di browser"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>

                  {/* Download Button */}
                  <a
                    href={item.file_url}
                    download={item.file_name}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 rounded-lg bg-slate-100 hover:bg-emerald-50 text-slate-600 hover:text-emerald-600 transition-colors"
                    title="Download file PDF asli"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </a>

                  {/* Delete Button (Only for admin & project_control) */}
                  {canMutate && (
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(item)}
                      className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 transition-colors"
                      title="Hapus lampiran PDF ini"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: UPLOAD LAMPIRAN PDF                                             */}
      {/* ========================================================================= */}
      {isUploadModalOpen && (
        <div
          className="no-print fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => !isUploading && setIsUploadModalOpen(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col animate-scaleUp"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shrink-0">
                  <UploadCloud className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Upload Lampiran PDF
                  </h3>
                  <p className="text-xs text-slate-500">
                    Arsip dokumen resmi proyek ({currentProject?.name || 'Proyek Aktif'})
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => !isUploading && setIsUploadModalOpen(false)}
                disabled={isUploading}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleExecuteUpload} className="p-6 space-y-4">
              {uploadError && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{uploadError}</span>
                </div>
              )}

              {/* Drag & Drop Zone */}
              {!uploadFile ? (
                <div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center gap-2.5 ${
                    dragActive
                      ? 'border-blue-500 bg-blue-50/50'
                      : 'border-slate-200 bg-slate-50/60 hover:bg-slate-50 hover:border-blue-400'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={handleFileInputChange}
                    className="hidden"
                  />
                  <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center justify-center text-rose-600">
                    <FileText className="w-6 h-6 text-rose-600" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">
                      Tarik & lepaskan file PDF di sini
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      atau <span className="text-blue-600 font-semibold underline">Pilih File dari Komputer</span>
                    </p>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200/80">
                    Khusus Berkas PDF • Maks. 20 MB
                  </span>
                </div>
              ) : (
                /* Selected File Card */
                <div className="bg-rose-50/50 border border-rose-200/80 rounded-xl p-3.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-rose-600 text-white flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate">{uploadFile.name}</p>
                      <p className="text-[10px] font-mono text-slate-500">
                        {(uploadFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setUploadFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-100 transition-colors"
                    title="Ganti file"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Title Field */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Judul Dokumen <span className="text-slate-400 font-normal">(Opsional)</span>
                </label>
                <input
                  type="text"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  placeholder="Misal: Weekly Report W25 atau SPK Fabrikasi Spool"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Jika dikosongkan, nama file asli akan digunakan sebagai judul otomatis.
                </span>
              </div>

              {/* Category Dropdown */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Kategori Dokumen
                </label>
                <select
                  value={uploadCategory}
                  onChange={(e) => setUploadCategory(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none bg-white"
                >
                  <option value="Weekly Report">Weekly Report</option>
                  <option value="Kontrak / LOA">Kontrak / LOA</option>
                  <option value="SPK">SPK</option>
                  <option value="Schedule PDF">Schedule PDF</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
              </div>

              {/* Submit / Cancel Buttons */}
              <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  disabled={isUploading}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isUploading || !uploadFile}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Mengunggah...</span>
                    </>
                  ) : (
                    <>
                      <UploadCloud className="w-4 h-4" />
                      <span>Unggah PDF</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: PREVIEW DOKUMEN PDF                                             */}
      {/* ========================================================================= */}
      {previewDoc && (
        <div
          className="no-print fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-fadeIn"
          onClick={() => setPreviewDoc(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-5xl w-full h-[88vh] border border-slate-200 shadow-2xl overflow-hidden flex flex-col animate-scaleUp"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-4 px-6 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-3 min-w-0 pr-4">
                <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-200">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-slate-900 truncate" title={previewDoc.title}>
                    {previewDoc.title}
                  </h3>
                  <div className="flex items-center gap-2 text-[10px] text-slate-400">
                    <span className="font-mono">{previewDoc.file_name}</span>
                    <span>•</span>
                    <span className="font-mono">{previewDoc.formatted_size}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons in Preview Header */}
              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={previewDoc.file_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200 transition-colors shadow-xs"
                  title="Buka PDF di tab baru browser"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Tab Baru</span>
                </a>

                <a
                  href={previewDoc.file_url}
                  download={previewDoc.file_name}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-colors"
                  title="Download file PDF asli"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Download</span>
                </a>

                <button
                  type="button"
                  onClick={() => setPreviewDoc(null)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors ml-1"
                  title="Tutup Preview"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Body: Embedded PDF iframe */}
            <div className="flex-1 w-full bg-slate-900 relative">
              <iframe
                src={`${previewDoc.file_url}#toolbar=1&navpanes=0`}
                className="w-full h-full border-0"
                title={previewDoc.title}
              />
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: KONFIRMASI HAPUS DOKUMEN PDF                                    */}
      {/* ========================================================================= */}
      {deleteTarget && (
        <div
          className="no-print fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => !isDeleting && setDeleteTarget(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden animate-scaleUp"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 bg-rose-50/50 border-b border-rose-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0 border border-rose-200">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 tracking-tight">
                    Hapus Lampiran PDF
                  </h3>
                  <p className="text-xs text-rose-600 font-medium">
                    Tindakan ini tidak dapat dibatalkan
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => !isDeleting && setDeleteTarget(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed">
                Apakah Anda yakin ingin menghapus lampiran dokumen PDF{' '}
                <strong className="text-slate-900">"{deleteTarget.title}"</strong> (
                <span className="font-mono">{deleteTarget.file_name}</span>)? File fisik di server akan dihapus secara permanen.
              </p>

              <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setDeleteTarget(null)}
                  disabled={isDeleting}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleExecuteDelete}
                  disabled={isDeleting}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition-all disabled:opacity-50"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Menghapus...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      <span>Hapus Permanen</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
