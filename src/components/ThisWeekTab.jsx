import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  Clock,
  Sparkles,
  Camera,
  MapPin,
  Maximize2,
  Calendar,
  FileCheck2,
  Truck,
  HardHat,
  X,
  UploadCloud,
  Trash2,
  Loader2,
  Plus,
  AlertCircle
} from 'lucide-react';
import { thisWeekActivities } from '../data/dashboardData';
import UploadPhotoModal from './UploadPhotoModal';
import { apiRequest } from '../utils/api';

export default function ThisWeekTab({
  dbActivities,
  dbPhotos,
  selectedWeek,
  projectId,
  currentProject,
  projectsList = [],
  availableWeeks = [],
  onPhotosUpdated
}) {
  const [activePhoto, setActivePhoto] = useState(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [tabNotification, setTabNotification] = useState(null);

  // Sync photos state from dbPhotos prop or fallback
  const formatPhotoList = (rawPhotos) => {
    if (rawPhotos && Array.isArray(rawPhotos)) {
      return rawPhotos.map((p, idx) => ({
        id: p.id || idx + 1,
        title: p.title || 'Dokumentasi Progres',
        timestamp: p.taken_at
          ? new Date(p.taken_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
          : (p.timestamp || 'Cutoff Date'),
        location: p.location || currentProject?.location || 'Sengkang Field, Wajo',
        tag: 'Site Record',
        accent: ['from-blue-600 to-indigo-900', 'from-amber-600 to-slate-900', 'from-emerald-600 to-slate-900', 'from-sky-600 to-slate-900'][idx % 4],
        caption: p.caption || p.description || p.title,
        description: p.caption || p.description || p.title,
        image_path: p.image_path
      }));
    }
    return thisWeekActivities.photos;
  };

  const [photos, setPhotos] = useState(() => formatPhotoList(dbPhotos));

  useEffect(() => {
    setPhotos(formatPhotoList(dbPhotos));
  }, [dbPhotos, selectedWeek]);

  // Handler when a new photo is uploaded
  const handlePhotoUploaded = (newPhoto, updatedPhotosList) => {
    let nextList = [];
    if (updatedPhotosList && Array.isArray(updatedPhotosList)) {
      nextList = formatPhotoList(updatedPhotosList);
    } else if (newPhoto) {
      nextList = [formatPhotoList([newPhoto])[0], ...photos];
    }
    setPhotos(nextList);

    if (onPhotosUpdated) {
      onPhotosUpdated(updatedPhotosList || nextList);
    }

    setTabNotification(`Foto dokumentasi "${newPhoto.title}" berhasil diunggah.`);
    setTimeout(() => {
      setTabNotification(null);
    }, 5000);
  };

  // Handler when a photo is deleted
  const handleDeletePhoto = async (photoId, photoTitle) => {
    const confirmDelete = window.confirm(
      `Apakah Anda yakin ingin menghapus foto dokumentasi "${photoTitle || 'ini'}"? Tindakan ini tidak dapat dibatalkan.`
    );
    if (!confirmDelete) return;

    setDeletingId(photoId);

    try {
      const res = await apiRequest(`/api/project-photos/${photoId}`, {
        method: 'DELETE',
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Gagal menghapus foto dokumentasi.');
      }

      const updated = photos.filter((p) => p.id !== photoId);
      setPhotos(updated);

      if (onPhotosUpdated) {
        onPhotosUpdated(data.photos || updated);
      }

      setTabNotification(`Foto dokumentasi "${photoTitle || 'ini'}" berhasil dihapus.`);
      setTimeout(() => {
        setTabNotification(null);
      }, 5000);
    } catch (err) {
      alert(err.message || 'Terjadi kesalahan saat menghapus foto.');
    } finally {
      setDeletingId(null);
    }
  };

  // Process activities from MySQL
  let activityGroups = thisWeekActivities.groups;

  if (dbActivities && dbActivities.length > 0) {
    const actuals = dbActivities.filter((a) => a.activity_type === 'this_week_actual');
    if (actuals.length > 0) {
      // Group by discipline
      const map = {};
      actuals.forEach((a) => {
        const disc = a.discipline || 'General';
        if (!map[disc]) {
          let iconName = 'CheckCircle2';
          if (disc.includes('Engineering') || disc.includes('QC')) iconName = 'FileCheck2';
          else if (disc.includes('Procurement')) iconName = 'Truck';
          else if (disc.includes('Construction')) iconName = 'HardHat';
          map[disc] = {
            title: disc,
            icon: iconName,
            activities: []
          };
        }
        map[disc].activities.push({
          task: a.description,
          status: 'completed',
          date: selectedWeek || 'Week Cutoff'
        });
      });
      activityGroups = Object.values(map);
    }
  }

  const getDepartmentIcon = (iconName) => {
    switch (iconName) {
      case 'FileCheck2':
        return <FileCheck2 className="w-5 h-5 text-sky-600" />;
      case 'Truck':
        return <Truck className="w-5 h-5 text-emerald-600" />;
      case 'HardHat':
        return <HardHat className="w-5 h-5 text-amber-600" />;
      default:
        return <CheckCircle2 className="w-5 h-5 text-blue-600" />;
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Toast Notification */}
      {tabNotification && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center justify-between shadow-xs animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{tabNotification}</span>
          </div>
          <button
            type="button"
            onClick={() => setTabNotification(null)}
            className="text-emerald-600 hover:text-emerald-800 text-xs font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* 1. Weekly Activity List */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight">
              Weekly Executed Activities ({selectedWeek || 'Current Week'})
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Verified physical accomplishments across engineering, procurement, and site construction
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg border border-blue-200">
            {selectedWeek || 'Week 12'} Status: Closed
          </span>
        </div>

        <div className={`grid grid-cols-1 md:grid-cols-${Math.min(activityGroups.length, 3)} gap-6`}>
          {activityGroups.map((group) => (
            <div
              key={group.title}
              className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 flex flex-col justify-between hover:shadow-md transition-shadow"
            >
              <div>
                {/* Group Title Header */}
                <div className="flex items-center gap-3 pb-3 mb-4 border-b border-slate-100">
                  <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                    {getDepartmentIcon(group.icon)}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{group.title}</h4>
                    <span className="text-[11px] text-slate-400">Department Scope</span>
                  </div>
                </div>

                {/* Activities List */}
                <ul className="space-y-3">
                  {group.activities.map((act, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-xs text-slate-700 leading-relaxed">
                      {act.status === 'completed' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      ) : act.status === 'milestone' ? (
                        <Sparkles className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                      ) : (
                        <Clock className="w-4 h-4 text-sky-500 shrink-0 mt-0.5" />
                      )}
                      <div>
                        <p className="font-medium">{act.task}</p>
                        <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
                          Recorded: {act.date}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span>{group.activities.length} Tasks Executed</span>
                <span className="font-semibold text-emerald-600">100% Completed</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Visual Progress Documentation */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                Visual Progress Documentation ({selectedWeek || 'Current Week'})
              </h3>
              <p className="text-xs text-slate-500">
                Verified site inspection and heavy cargo delivery records
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
              {photos.length} Foto Dokumentasi
            </span>
            <button
              type="button"
              onClick={() => setIsUploadModalOpen(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Upload Dokumentasi Foto</span>
            </button>
          </div>
        </div>

        {/* Empty State when no photos exist for this week */}
        {photos.length === 0 ? (
          <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 p-10 text-center space-y-4">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
              <Camera className="w-7 h-7" />
            </div>
            <div className="max-w-md mx-auto space-y-1">
              <h4 className="text-sm font-bold text-slate-900">
                Belum ada dokumentasi foto untuk {selectedWeek || 'periode ini'}
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Unggah dokumentasi foto lapangan (misalnya pemasangan pipa, pekerjaan pondasi, atau inspeksi QC) untuk melengkapi laporan progres mingguan.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsUploadModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-600/20 transition-all"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Unggah Foto Sekarang</span>
            </button>
          </div>
        ) : (
          /* Photos Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {photos.map((photo) => {
              const isDeleting = deletingId === photo.id;
              return (
                <div
                  key={photo.id}
                  onClick={() => setActivePhoto(photo)}
                  className="group bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden cursor-pointer hover:shadow-lg hover:border-slate-300 transition-all duration-300 flex flex-col relative"
                >
                  {/* Photo Image Card */}
                  <div className={`relative h-48 bg-slate-900 overflow-hidden flex items-center justify-center text-center`}>
                    {photo.image_path ? (
                      <img
                        src={photo.image_path}
                        alt={photo.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          // Fallback to gradient if image URL cannot be loaded
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className={`absolute inset-0 bg-gradient-to-br ${photo.accent} flex items-center justify-center p-4 text-center`}>
                        <div className="text-white/95 px-3">
                          <div className="w-10 h-10 mx-auto mb-2 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 group-hover:scale-110 transition-transform">
                            <Camera className="w-5 h-5 text-white" />
                          </div>
                          <p className="text-xs font-bold leading-snug drop-shadow-sm line-clamp-2">
                            {photo.title}
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/30 pointer-events-none"></div>

                    {/* Top Location / Tag */}
                    <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between z-10">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-black/50 text-white backdrop-blur-md border border-white/20">
                        {photo.tag || 'Site Record'}
                      </span>

                      {/* Top Action Buttons (Delete & Maximize) */}
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeletePhoto(photo.id, photo.title);
                          }}
                          disabled={isDeleting}
                          title="Hapus foto dokumentasi ini"
                          className="p-1.5 rounded-lg bg-black/60 hover:bg-rose-600 text-white backdrop-blur-md transition-colors"
                        >
                          {isDeleting ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-300" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <span className="p-1.5 rounded-lg bg-black/60 text-white backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity">
                          <Maximize2 className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card Meta & Caption */}
                  <div className="p-4 flex-1 flex flex-col justify-between space-y-2.5">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                        {photo.title}
                      </h4>
                      <p className="text-[11px] text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                        {photo.caption || photo.description}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        {photo.timestamp}
                      </span>
                      <span className="flex items-center gap-1 font-mono truncate max-w-[130px]" title={photo.location}>
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        {photo.location}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Photo Preview Lightbox Modal */}
      {activePhoto && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setActivePhoto(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden animate-scaleUp"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Image Area */}
            <div className="relative bg-slate-950 flex items-center justify-center min-h-[300px] max-h-[60vh] overflow-hidden">
              {activePhoto.image_path ? (
                <img
                  src={activePhoto.image_path}
                  alt={activePhoto.title}
                  className="w-full h-auto max-h-[60vh] object-contain"
                />
              ) : (
                <div className={`w-full h-64 bg-gradient-to-br ${activePhoto.accent} flex items-center justify-center p-6 text-white text-center`}>
                  <div className="max-w-md">
                    <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
                      <Camera className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="text-base font-bold">{activePhoto.title}</h3>
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={() => setActivePhoto(null)}
                className="absolute top-4 right-4 p-2 rounded-full bg-black/60 hover:bg-black/90 text-white transition-colors z-10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Details / Caption */}
            <div className="p-5 space-y-3 bg-white">
              <div>
                <h3 className="text-base font-bold text-slate-900">{activePhoto.title}</h3>
                <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                  {activePhoto.caption || activePhoto.description}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-blue-600 shrink-0" />
                  <span className="font-semibold text-slate-700">{activePhoto.location}</span>
                </div>
                <div className="flex items-center gap-1.5 font-mono text-slate-500">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{activePhoto.timestamp}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload Photo Modal */}
      <UploadPhotoModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        currentProject={currentProject}
        projectsList={projectsList}
        selectedWeek={selectedWeek}
        availableWeeks={availableWeeks}
        onPhotoUploaded={handlePhotoUploaded}
      />
    </div>
  );
}
