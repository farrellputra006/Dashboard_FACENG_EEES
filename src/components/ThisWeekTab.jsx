import React, { useState } from 'react';
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
  ShieldAlert,
  X
} from 'lucide-react';
import { thisWeekActivities } from '../data/dashboardData';

export default function ThisWeekTab({ dbActivities, dbPhotos, selectedWeek }) {
  const [activePhoto, setActivePhoto] = useState(null);

  const photos = dbPhotos && dbPhotos.length > 0 ? dbPhotos.map((p, idx) => ({
    id: p.id || idx + 1,
    title: p.title,
    timestamp: p.taken_at ? new Date(p.taken_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Cutoff Date',
    location: p.location || 'Sengkang Field, Wajo',
    tag: 'Site Record',
    accent: ['from-blue-600 to-indigo-900', 'from-amber-600 to-slate-900', 'from-emerald-600 to-slate-900', 'from-sky-600 to-slate-900'][idx % 4],
    description: p.caption || p.title,
    image_path: p.image_path
  })) : thisWeekActivities.photos;

  // Process activities from MySQL
  let activityGroups = thisWeekActivities.groups;

  if (dbActivities && dbActivities.length > 0) {
    const actuals = dbActivities.filter(a => a.activity_type === 'this_week_actual');
    if (actuals.length > 0) {
      // Group by discipline
      const map = {};
      actuals.forEach(a => {
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
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
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
          <span className="text-xs font-mono text-slate-400 bg-slate-100 px-2 py-1 rounded">
            {photos.length} High-Res Photos
          </span>
        </div>

        {/* 4 Photos Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {photos.map((photo) => (
            <div
              key={photo.id}
              onClick={() => setActivePhoto(photo)}
              className="group bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden cursor-pointer hover:shadow-lg hover:border-slate-300 transition-all duration-300 flex flex-col"
            >
              {/* Photo Image Card */}
              <div className={`relative h-44 bg-gradient-to-br ${photo.accent} overflow-hidden flex items-center justify-center p-4 text-center`}>
                <div className="absolute inset-0 bg-black/25 group-hover:bg-black/15 transition-colors"></div>
                
                {/* Simulated realistic engineering illustration badge */}
                <div className="relative z-10 text-white/95 px-3">
                  <div className="w-10 h-10 mx-auto mb-2 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 group-hover:scale-110 transition-transform">
                    <Camera className="w-5 h-5 text-white" />
                  </div>
                  <p className="text-xs font-bold leading-snug drop-shadow-sm line-clamp-2">
                    {photo.title}
                  </p>
                </div>

                {/* Top Location & Tag */}
                <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between z-10">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-black/40 text-white backdrop-blur-md border border-white/20">
                    {photo.tag}
                  </span>
                  <span className="p-1 rounded-md bg-white/30 backdrop-blur-md text-white opacity-0 group-hover:opacity-100 transition-opacity">
                    <Maximize2 className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>

              {/* Card Meta & Caption */}
              <div className="p-4 flex-1 flex flex-col justify-between space-y-2.5">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                    {photo.title}
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                    {photo.description}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {photo.timestamp}
                  </span>
                  <span className="flex items-center gap-1 font-mono truncate max-w-[110px]" title={photo.location}>
                    <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                    {photo.location}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Photo Preview Lightbox Modal */}
      {activePhoto && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setActivePhoto(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden animate-scaleUp"
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`h-64 sm:h-80 bg-gradient-to-br ${activePhoto.accent} relative flex items-center justify-center p-6 text-white text-center`}>
              <div className="relative z-10 max-w-lg">
                <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
                  <Camera className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold">{activePhoto.title}</h3>
                <p className="text-xs sm:text-sm text-slate-200 mt-2 leading-relaxed">
                  {activePhoto.description}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setActivePhoto(null)}
                className="absolute top-4 right-4 p-2 rounded-full bg-black/40 hover:bg-black/60 text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 flex items-center justify-between text-xs bg-slate-50 border-t border-slate-100">
              <div className="flex items-center gap-2 text-slate-600">
                <MapPin className="w-4 h-4 text-blue-600" />
                <span className="font-semibold">{activePhoto.location}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-400 font-mono">
                <Calendar className="w-4 h-4" />
                <span>{activePhoto.timestamp}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
