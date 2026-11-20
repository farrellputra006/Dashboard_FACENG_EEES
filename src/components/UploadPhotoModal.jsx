import React, { useState, useRef, useEffect } from 'react';
import {
  UploadCloud,
  X,
  Camera,
  Image as ImageIcon,
  Loader2,
  Calendar,
  MapPin,
  FileText,
  AlertCircle,
  FolderKanban,
  Clock
} from 'lucide-react';
import { apiRequest } from '../utils/api';

export default function UploadPhotoModal({
  isOpen,
  onClose,
  currentProject,
  projectsList = [],
  selectedWeek = 'Week 12',
  availableWeeks = [],
  onPhotoUploaded
}) {
  if (!isOpen) return null;

  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [projectId, setProjectId] = useState(() => {
    return currentProject?.rawId || (typeof currentProject?.id === 'string' ? currentProject.id.replace('proj-', '') : currentProject?.id) || '1';
  });
  const [week, setWeek] = useState(selectedWeek || 'Week 12');
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [location, setLocation] = useState(currentProject?.location || 'Compressor Pad Bay, Gilireng, Wajo');
  const [takenAt, setTakenAt] = useState(() => new Date().toISOString().split('T')[0]);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Sync default values when modal opens or props change
  useEffect(() => {
    if (currentProject) {
      const rawId = currentProject.rawId || (typeof currentProject.id === 'string' ? currentProject.id.replace('proj-', '') : currentProject.id);
      setProjectId(rawId || '1');
      if (currentProject.location) {
        setLocation(currentProject.location);
      }
    }
    if (selectedWeek) {
      setWeek(selectedWeek);
    }
  }, [currentProject, selectedWeek, isOpen]);

  // Handle file select
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Hanya format file gambar yang diperbolehkan (JPG, PNG, WEBP).');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage('Ukuran file terlalu besar. Maksimum 10 MB.');
      return;
    }

    setErrorMessage('');
    setSelectedFile(file);

    // Create local object URL for preview
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    // Auto-fill title if empty based on file name
    if (!title) {
      const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      setTitle(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl('');
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setErrorMessage('Silakan pilih berkas foto dokumentasi terlebih dahulu.');
      return;
    }

    setIsUploading(true);
    setErrorMessage('');

    try {
      const formData = new FormData();
      formData.append('photo', selectedFile);
      formData.append('project_id', projectId);
      formData.append('week', week);
      formData.append('week_label', week);
      formData.append('title', title.trim() || 'Dokumentasi Progres ' + week);
      formData.append('caption', caption.trim() || title.trim());
      formData.append('location', location.trim());
      formData.append('taken_at', takenAt);

      const res = await apiRequest('/api/project-photos', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Gagal mengunggah foto progres.');
      }

      if (onPhotoUploaded) {
        onPhotoUploaded(data.photo, data.photos);
      }

      // Cleanup
      handleRemoveFile();
      onClose();
    } catch (err) {
      setErrorMessage(err.message || 'Terjadi kesalahan saat mengunggah foto.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
      <div
        className="bg-white rounded-2xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden my-8 animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/30 text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/30">
              <Camera className="w-5 h-5 text-blue-300" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Upload Dokumentasi Foto Lapangan
              </h3>
              <p className="text-xs text-slate-400">
                Visual Progress Documentation • This Week Progress
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isUploading}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-2.5 text-xs">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Project & Week Selector Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <FolderKanban className="w-3.5 h-3.5 text-blue-600" />
                <span>Pilih Proyek</span>
              </label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                disabled={isUploading}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                {projectsList.map((p) => {
                  const pId = p.rawId || (typeof p.id === 'string' ? p.id.replace('proj-', '') : p.id);
                  return (
                    <option key={p.id} value={pId}>
                      {p.name} ({p.code})
                    </option>
                  );
                })}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-blue-600" />
                <span>Pilih Week</span>
              </label>
              <div className="relative">
                <select
                  value={week}
                  onChange={(e) => setWeek(e.target.value)}
                  disabled={isUploading}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  {(availableWeeks.length > 0 ? availableWeeks : ['Week 10', 'Week 11', 'Week 12']).map((w) => (
                    <option key={w} value={w}>
                      {w}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* File Upload / Dropzone & Preview */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5 text-blue-600" />
              <span>Berkas Foto Lapangan (JPG, PNG, WEBP)</span>
            </label>

            {!previewUrl ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 hover:border-blue-500 bg-slate-50 hover:bg-blue-50/50 rounded-2xl p-6 text-center cursor-pointer transition-all group"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/jpg"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-white text-slate-500 group-hover:text-blue-600 group-hover:scale-110 flex items-center justify-center border border-slate-200 shadow-xs transition-transform">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <p className="text-xs font-bold text-slate-800">
                  Klik untuk memilih foto atau seret ke sini
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Mendukung JPG, JPEG, PNG, WEBP (Maks. 10 MB)
                </p>
              </div>
            ) : (
              <div className="relative rounded-2xl border border-slate-200 bg-slate-900 overflow-hidden group">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-full h-48 object-contain bg-slate-950"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 bg-white/90 hover:bg-white text-slate-800 text-xs font-bold rounded-lg shadow-sm"
                  >
                    Ganti Foto
                  </button>
                  <button
                    type="button"
                    onClick={handleRemoveFile}
                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg shadow-sm"
                  >
                    Hapus
                  </button>
                </div>
                <div className="p-2.5 bg-slate-800/95 border-t border-slate-700 flex items-center justify-between text-[11px] text-slate-300">
                  <span className="truncate max-w-[280px]" title={selectedFile?.name}>
                    {selectedFile?.name}
                  </span>
                  <span className="font-mono text-slate-400">
                    {(selectedFile?.size / 1024 / 1024).toFixed(2)} MB
                  </span>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/jpg"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
            )}
          </div>

          {/* Title & Caption */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Judul Dokumentasi
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="misal: Pemasangan pipa jalur utama segmen B"
              disabled={isUploading}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-blue-600" />
              <span>Keterangan / Caption Foto</span>
            </label>
            <textarea
              rows={3}
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="misal: Pemasangan pipa jalur utama segmen B menggunakan crane 80-ton dengan pengawasan tim QC & HSE."
              disabled={isUploading}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          {/* Location & Taken Date Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>Lokasi Pengambilan</span>
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Compressor Pad Bay, Gilireng, Wajo"
                disabled={isUploading}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Tanggal Foto</span>
              </label>
              <input
                type="date"
                value={takenAt}
                onChange={(e) => setTakenAt(e.target.value)}
                disabled={isUploading}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isUploading}
              className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-semibold text-xs transition-colors"
            >
              Batal
            </button>

            <button
              type="submit"
              disabled={isUploading || !selectedFile}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/25 flex items-center gap-2 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Mengunggah Foto...</span>
                </>
              ) : (
                <>
                  <Camera className="w-4 h-4" />
                  <span>Unggah Foto</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
