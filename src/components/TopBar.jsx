import React from 'react';
import { Search, ChevronRight, Bell, Calendar, SlidersHorizontal } from 'lucide-react';

export default function TopBar({ projectName, searchQuery, onSearchChange }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200/80">
      {/* Left: Breadcrumbs */}
      <nav className="flex items-center gap-2 text-sm text-slate-500 font-medium">
        <span className="hover:text-slate-800 transition-colors cursor-pointer">Projects</span>
        <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
        <span className="text-slate-900 font-semibold truncate max-w-md">{projectName}</span>
      </nav>

      {/* Right: Search & Quick Actions */}
      <div className="flex items-center gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search tasks, documents..."
            className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-sm transition-all"
          />
        </div>

        <button
          type="button"
          className="p-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl transition-colors shadow-sm relative"
          title="Notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full ring-2 ring-white"></span>
        </button>
      </div>
    </div>
  );
}

