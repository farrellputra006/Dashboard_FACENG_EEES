import React from 'react';
import { Settings, LogOut, ChevronRight, Activity, Flame, ShieldAlert, CheckCircle2, User, X, ShieldCheck, Plus, FolderPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import AccountSettingsModal from './AccountSettingsModal';

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
  onToggleStatusDemo,
  onOpenCreateProject,
}) {
  const { user, loading: userLoading, logout } = useAuth();
  const [showSettingsModal, setShowSettingsModal] = React.useState(false);

  const userName = user?.name || 'Pengguna';
  const userInitials = getInitials(userName);
  const userJobTitle = user?.job_title || 'Project Control';

  return (
    <aside className="w-80 bg-white text-slate-800 flex flex-col justify-between shrink-0 h-screen sticky top-0 border-r border-slate-200/80 shadow-xs select-none z-30">
      {/* Top Header & Project List */}
      <div className="flex flex-col flex-1 min-h-0">
        {/* Header Logo */}
        <div className="p-6 border-b border-slate-100 bg-white">
          <div className="flex items-center gap-3">
            <img
              src="/images/logo-energy-equity.png"
              alt="Energy Equity Logo"
              className="h-10 w-auto object-contain shrink-0"
            />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-lg tracking-tight text-slate-900 leading-tight">Energy Equity</span>
              </div>
              <p className="text-[10px] tracking-widest text-blue-600 font-bold uppercase mt-0.5 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block animate-pulse"></span>
                PROJECT CONTROL
              </p>
            </div>
          </div>
        </div>

        {/* Section Title & Add/Upload Project Action */}
        <div className="px-5 pt-5 pb-2.5 flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400">
          <div className="flex items-center gap-2">
            <span>All Projects</span>
            <span className="bg-slate-100 text-slate-600 text-[11px] px-2 py-0.5 rounded-full border border-slate-200 font-mono font-semibold">
              {projects.length}
            </span>
          </div>

          {onOpenCreateProject && (
            <button
              type="button"
              onClick={onOpenCreateProject}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold shadow-xs transition-all hover:scale-105"
              title="Upload atau Buat Proyek Baru"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Upload Proyek</span>
            </button>
          )}
        </div>

        {/* Project List (Scrollable) */}
        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2.5 custom-scrollbar">
          {projects.map((proj) => {
            const isActive = proj.id === selectedProjectId;
            
            // Modern Soft Badge styles
            let badgeClass = "bg-slate-100 text-slate-700 border-slate-200";
            let statusText = proj.statusLabel;

            if (proj.id === 'proj-1' && isDelayedDemo) {
              statusText = proj.delayedAlternativeLabel;
              badgeClass = "bg-rose-50 text-rose-700 border-rose-200";
            } else if (proj.status === 'ahead') {
              badgeClass = "bg-emerald-50 text-emerald-700 border-emerald-200";
            } else if (proj.status === 'delayed') {
              badgeClass = "bg-rose-50 text-rose-700 border-rose-200";
            } else if (proj.status === 'ontrack') {
              badgeClass = "bg-blue-50 text-blue-700 border-blue-200";
            } else if (proj.status === 'watchlist') {
              badgeClass = "bg-amber-50 text-amber-700 border-amber-200";
            }

            return (
              <button
                key={proj.id}
                onClick={() => onSelectProject(proj.id)}
                className={`w-full text-left p-3.5 rounded-2xl transition-all duration-200 relative group border ${
                  isActive
                    ? 'border-blue-500/40 bg-blue-50/60 shadow-xs ring-1 ring-blue-500/20'
                    : 'border-slate-200/60 bg-slate-50/50 hover:bg-slate-100/70 hover:border-slate-300'
                }`}
              >
                {isActive && (
                  <div className="absolute left-0 top-3 bottom-3 w-1 bg-blue-600 rounded-r-full shadow-xs"></div>
                )}
                
                <div className="flex items-start justify-between gap-2 mb-2 pl-1">
                  <h4 className={`text-sm font-semibold leading-snug line-clamp-2 transition-colors ${
                    isActive ? 'text-slate-900 font-bold' : 'text-slate-700 group-hover:text-slate-900'
                  }`}>
                    {proj.name}
                  </h4>
                </div>

                <div className="flex items-center justify-between gap-2 mt-2 pl-1">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${badgeClass}`}>
                    {statusText}
                  </span>
                  
                  <span className="text-[11px] text-slate-400 font-mono tabular-nums">
                    {proj.lastUpdate}
                  </span>
                </div>

                {proj.id === 'proj-1' && isActive && (
                  <div className="mt-2.5 pt-2 border-t border-blue-200/50 flex items-center justify-between text-[10px] text-slate-500 pl-1">
                    <span className="flex items-center gap-1 text-blue-600 font-medium">
                      <Activity className="w-3 h-3" /> Active View
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleStatusDemo();
                      }}
                      className="text-[10px] text-slate-500 hover:text-blue-600 underline font-medium"
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
      <div className="p-4 border-t border-slate-100 bg-slate-50/60">
        {userLoading || !user ? (
          <div className="flex items-center justify-between animate-pulse">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-10 h-10 rounded-xl bg-slate-200 shrink-0" />
              <div className="space-y-1.5 flex-1 min-w-0 pr-2">
                <div className="h-3.5 bg-slate-200 rounded w-24" />
                <div className="h-2.5 bg-slate-200 rounded w-32" />
              </div>
            </div>
            <div className="w-8 h-8 rounded-lg bg-slate-200 shrink-0" />
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white font-bold text-sm flex items-center justify-center shadow-xs shrink-0">
                {userInitials}
              </div>
              <div className="min-w-0">
                <h5 className="text-sm font-bold text-slate-900 truncate" title={userName}>
                  {userName}
                </h5>
                <p className="text-[11px] text-slate-500 truncate font-medium" title={userJobTitle}>
                  {userJobTitle}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 text-slate-400">
              <button
                type="button"
                onClick={() => setShowSettingsModal(true)}
                className="p-2 hover:text-slate-800 hover:bg-white rounded-xl border border-transparent hover:border-slate-200 transition-colors shadow-none hover:shadow-xs"
                title="Informasi Akun Pengguna"
              >
                <Settings className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={logout}
                className="p-2 hover:text-rose-600 hover:bg-white rounded-xl border border-transparent hover:border-slate-200 transition-colors shadow-none hover:shadow-xs"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Account Settings & Security Modal (User Management & Self Password Change) */}
      <AccountSettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
      />
    </aside>
  );
}
