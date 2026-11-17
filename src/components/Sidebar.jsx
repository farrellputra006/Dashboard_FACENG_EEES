import React from 'react';
import { Settings, LogOut, ChevronRight, Activity, Flame, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

function getInitials(name) {
  if (!name || typeof name !== 'string') return 'U';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'U';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  const first = parts[0][0];
  const last = parts[parts.length - 1][0];
  return (first + last).toUpperCase();
}

export default function Sidebar({
  projects,
  selectedProjectId,
  onSelectProject,
  isDelayedDemo,
  onToggleStatusDemo
}) {
  const { user, loading: userLoading, logout } = useAuth();

  const userName = user?.name || 'Pengguna';
  const userInitials = getInitials(userName);
  const userJobTitle = user?.job_title || 'Project Control';
  return (
    <aside className="w-80 bg-slate-900 text-white flex flex-col justify-between shrink-0 h-screen sticky top-0 border-r border-slate-800 shadow-xl select-none z-30">
      {/* Top Header & Project List */}
      <div className="flex flex-col flex-1 min-h-0">
        {/* Header Logo */}
        <div className="p-6 border-b border-slate-800/80 bg-slate-900/95 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-slate-800 shadow-lg shadow-blue-500/20 border border-blue-400/30">
              {/* Triangular geometric icon */}
              <svg className="w-6 h-6 text-cyan-300 drop-shadow-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 20h20L12 2z" fill="rgba(56, 189, 248, 0.25)" />
                <path d="M12 8L6 18h12L12 8z" fill="rgba(37, 99, 235, 0.45)" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-lg tracking-tight text-white">Energy Equity</span>
              </div>
              <p className="text-[10px] tracking-widest text-slate-400 font-bold uppercase mt-0.5 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block animate-pulse"></span>
                PROJECT CONTROL
              </p>
            </div>
          </div>
        </div>

        {/* Section Title */}
        <div className="px-6 pt-5 pb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-400">
          <span>All Projects</span>
          <span className="bg-slate-800 text-slate-300 text-xs px-2.5 py-0.5 rounded-full border border-slate-700/80 font-mono font-medium">
            {projects.length}
          </span>
        </div>

        {/* Project List (Scrollable) */}
        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2.5 custom-scrollbar-dark">
          {projects.map((proj) => {
            const isActive = proj.id === selectedProjectId;
            
            // Badge styles
            let badgeClass = "bg-slate-700 text-slate-200 border-slate-600";
            let statusText = proj.statusLabel;

            if (proj.id === 'proj-1' && isDelayedDemo) {
              statusText = proj.delayedAlternativeLabel;
              badgeClass = "bg-rose-500/15 text-rose-300 border-rose-500/30";
            } else if (proj.status === 'ahead') {
              badgeClass = "bg-emerald-500/15 text-emerald-300 border-emerald-500/30";
            } else if (proj.status === 'delayed') {
              badgeClass = "bg-rose-500/15 text-rose-300 border-rose-500/30";
            } else if (proj.status === 'ontrack') {
              badgeClass = "bg-blue-500/15 text-blue-300 border-blue-500/30";
            } else if (proj.status === 'watchlist') {
              badgeClass = "bg-amber-500/15 text-amber-300 border-amber-500/30";
            }

            return (
              <button
                key={proj.id}
                onClick={() => onSelectProject(proj.id)}
                className={`w-full text-left p-3.5 rounded-xl transition-all duration-200 relative group border ${
                  isActive
                    ? 'border-blue-500 bg-slate-800/90 shadow-md shadow-blue-900/30 ring-1 ring-blue-500/40'
                    : 'border-slate-800/80 bg-slate-900/60 hover:bg-slate-800/60 hover:border-slate-700'
                }`}
              >
                {isActive && (
                  <div className="absolute left-0 top-3 bottom-3 w-1 bg-blue-500 rounded-r-full shadow-sm shadow-blue-400"></div>
                )}
                
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h4 className={`text-sm font-semibold leading-snug line-clamp-2 transition-colors ${
                    isActive ? 'text-white' : 'text-slate-300 group-hover:text-white'
                  }`}>
                    {proj.name}
                  </h4>
                </div>

                <div className="flex items-center justify-between gap-2 mt-2">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${badgeClass}`}>
                    {statusText}
                  </span>
                  
                  <span className="text-[11px] text-slate-400 font-mono">
                    Last update: {proj.lastUpdate}
                  </span>
                </div>

                {proj.id === 'proj-1' && isActive && (
                  <div className="mt-2.5 pt-2 border-t border-slate-700/60 flex items-center justify-between text-[10px] text-slate-400">
                    <span className="flex items-center gap-1 text-blue-400">
                      <Activity className="w-3 h-3" /> Active View
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleStatusDemo();
                      }}
                      className="text-[10px] text-slate-400 hover:text-white underline decoration-slate-600 hover:decoration-white"
                      title="Toggle between Ahead / Delayed state display"
                    >
                      {isDelayedDemo ? "Switch to +3.63%" : "Test (-3.73%)"}
                    </button>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* User Profile Footer */}
      <div className="p-4 border-t border-slate-800/90 bg-slate-950/70 backdrop-blur-sm">
        {userLoading || !user ? (
          <div className="flex items-center justify-between animate-pulse">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-10 h-10 rounded-xl bg-slate-850 bg-slate-800 shrink-0" />
              <div className="space-y-1.5 flex-1 min-w-0 pr-2">
                <div className="h-3.5 bg-slate-800 rounded w-24" />
                <div className="h-2.5 bg-slate-800/70 rounded w-32" />
              </div>
            </div>
            <div className="w-8 h-8 rounded-lg bg-slate-800 shrink-0" />
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 to-indigo-600 text-white font-bold text-sm flex items-center justify-center ring-2 ring-blue-500/30 shadow-inner shrink-0">
                {userInitials}
              </div>
              <div className="min-w-0">
                <h5 className="text-sm font-semibold text-white truncate" title={userName}>
                  {userName}
                </h5>
                <p className="text-[11px] text-slate-400 truncate" title={userJobTitle}>
                  {userJobTitle}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 text-slate-400">
              <button
                type="button"
                className="p-2 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                title="Settings"
              >
                <Settings className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={logout}
                className="p-2 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}

