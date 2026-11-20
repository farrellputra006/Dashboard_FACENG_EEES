import React from 'react';
import { Search, ChevronRight, Bell, Calendar, SlidersHorizontal, FolderPlus } from 'lucide-react';

export default function TopBar({ projectName, searchQuery, onSearchChange, onOpenCreateProject }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/70">
      {/* Left: Breadcrumbs */}
      <nav className="flex items-center gap-2 text-xs sm:text-sm text-slate-400 font-medium">
        <span className="hover:text-slate-700 transition-colors cursor-pointer font-semibold">Projects</span>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        <span className="text-slate-900 font-bold truncate max-w-md">{projectName}</span>
      </nav>

      {/* Right: Search & Quick Actions */}
      <div className="flex items-center gap-2.5">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Cari pekerjaan, dokumen..."
            className="w-full bg-white border border-slate-200/80 rounded-2xl pl-10 pr-4 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-xs transition-all"
          />
        </div>

        {onOpenCreateProject && (
          <button
            type="button"
            onClick={onOpenCreateProject}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-2xl shadow-xs transition-all whitespace-nowrap hover:shadow-sm"
            title="Upload atau Tambah Proyek Baru"
          >
            <FolderPlus className="w-4 h-4" />
            <span className="hidden sm:inline">Upload Proyek</span>
          </button>
        )}

        <button
          type="button"
          className="p-2.5 bg-white border border-slate-200/80 hover:bg-slate-50 text-slate-600 rounded-2xl transition-colors shadow-xs relative"
          title="Notifikasi"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-blue-600 rounded-full ring-2 ring-white"></span>
        </button>
      </div>
    </div>
  );
}
