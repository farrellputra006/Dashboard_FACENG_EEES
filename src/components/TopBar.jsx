import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Search,
  ChevronRight,
  Bell,
  FolderPlus,
  RefreshCw,
  AlertTriangle,
  Info,
  CheckCircle2,
  TrendingDown,
  ArrowRight,
  Filter,
  X,
  Layers,
  FileSpreadsheet,
  FileText,
  CalendarCheck2,
  CalendarClock,
  Camera,
  FolderArchive,
  CheckCheck
} from 'lucide-react';
import { apiRequest } from '../utils/api';

const READ_STORAGE_KEY = 'faceng_read_notification_ids';

export default function TopBar({
  projectName,
  currentProjectId,
  searchQuery,
  onSearchChange,
  onOpenCreateProject,
  onQuickJump
}) {
  const [notifications, setNotifications] = useState([]);
  const [warningCount, setWarningCount] = useState(0);
  const [infoCount, setInfoCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState('ALL'); // 'ALL' | 'UNREAD' | 'WARNING' | 'INFO'
  const [projectFilter, setProjectFilter] = useState('ALL'); // 'ALL' | specific project_id

  // State ID notifikasi yang sudah dibaca / dibuka (disimpan di localStorage)
  const [readIds, setReadIds] = useState(() => {
    try {
      const saved = localStorage.getItem(READ_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const popoverRef = useRef(null);

  // Fetch notifications from endpoint GET /api/notifications/general
  const fetchNotifications = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await apiRequest('/api/notifications/general');
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setNotifications(data.notifications || []);
          setWarningCount(data.warning_count || 0);
          setInfoCount(data.info_count || 0);
        }
      }
    } catch (err) {
      console.warn('Gagal memuat data notifikasi:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Hitung jumlah notifikasi yang BELUM dibaca
  const unreadCount = notifications.filter((n) => !readIds.includes(n.id)).length;

  // Handler saat tombol lonceng diklik untuk membuka/menutup popover
  const handleTogglePopover = () => {
    const nextState = !isPopoverOpen;
    setIsPopoverOpen(nextState);

    // KETIKA NOTIFIKASI DIBUKA: Langsung tandai semua notifikasi saat ini sebagai sudah dibaca
    // sehingga badge "belum terbaca" pada ikon lonceng langsung dihilangkan seketika.
    if (nextState && notifications.length > 0) {
      const allCurrentIds = notifications.map((n) => n.id);
      const updatedReadIds = Array.from(new Set([...readIds, ...allCurrentIds]));
      setReadIds(updatedReadIds);
      try {
        localStorage.setItem(READ_STORAGE_KEY, JSON.stringify(updatedReadIds));
      } catch (err) {
        console.warn('Gagal menyimpan status baca notifikasi:', err);
      }
    }
  };

  // Handler tandai semua sebagai sudah dibaca secara eksplisit
  const handleMarkAllAsRead = (e) => {
    if (e) e.stopPropagation();
    const allCurrentIds = notifications.map((n) => n.id);
    const updated = Array.from(new Set([...readIds, ...allCurrentIds]));
    setReadIds(updated);
    try {
      localStorage.setItem(READ_STORAGE_KEY, JSON.stringify(updated));
    } catch (err) {
      console.warn(err);
    }
  };

  // Close popover when clicked outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        setIsPopoverOpen(false);
      }
    };
    if (isPopoverOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isPopoverOpen]);

  // Extract unique projects from notifications for dropdown filter
  const uniqueProjects = Array.from(
    new Map(notifications.map((n) => [n.project_id, { id: n.project_id, name: n.project_name, code: n.project_code }])).values()
  );

  // Filtered list
  const filteredList = notifications.filter((item) => {
    const isUnread = !readIds.includes(item.id);

    const matchType =
      activeFilter === 'ALL' ||
      (activeFilter === 'UNREAD' && isUnread) ||
      (activeFilter === 'WARNING' && item.type === 'warning') ||
      (activeFilter === 'INFO' && item.type === 'info');

    const matchProject = projectFilter === 'ALL' || String(item.project_id) === String(projectFilter);

    return matchType && matchProject;
  });

  const totalActiveCount = notifications.length;

  // Icon mapping for sections
  const getSectionIcon = (sectionKey, type) => {
    if (type === 'info') {
      return <TrendingDown className="w-4 h-4 text-blue-600" />;
    }
    switch (sectionKey) {
      case 'scurve':
        return <FileSpreadsheet className="w-4 h-4 text-amber-600" />;
      case 'reportnotes':
        return <FileText className="w-4 h-4 text-amber-600" />;
      case 'nextweek':
        return <CalendarClock className="w-4 h-4 text-amber-600" />;
      case 'thisweek':
        return <Camera className="w-4 h-4 text-amber-600" />;
      case 'detail':
        return <Layers className="w-4 h-4 text-amber-600" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-amber-600" />;
    }
  };

  const handleItemClick = (item) => {
    // Pastikan item yang diklik terdaftar sebagai sudah dibaca
    if (!readIds.includes(item.id)) {
      const updated = [...readIds, item.id];
      setReadIds(updated);
      try {
        localStorage.setItem(READ_STORAGE_KEY, JSON.stringify(updated));
      } catch (err) {
        console.warn(err);
      }
    }

    if (onQuickJump) {
      onQuickJump(item.project_id, item.section_key);
    }
    setIsPopoverOpen(false);
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/70 relative">
      {/* Left: Breadcrumbs */}
      <nav className="flex items-center gap-2 text-xs sm:text-sm text-slate-400 font-medium">
        <span className="hover:text-slate-700 transition-colors cursor-pointer font-semibold">Projects</span>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        <span className="text-slate-900 font-bold truncate max-w-md">{projectName}</span>
      </nav>

      {/* Right: Search, Quick Actions & Notification Bell */}
      <div className="flex items-center gap-2.5">
        {/* Search Bar */}
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

        {/* Upload Project Button */}
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

        {/* Notification Bell Container & Popover */}
        <div className="relative" ref={popoverRef}>
          <button
            type="button"
            onClick={handleTogglePopover}
            className={`p-2.5 bg-white border rounded-2xl transition-all shadow-xs relative ${
              isPopoverOpen
                ? 'border-blue-500 text-blue-600 bg-blue-50/50 ring-2 ring-blue-500/20'
                : 'border-slate-200/80 hover:bg-slate-50 text-slate-600'
            }`}
            title={
              unreadCount > 0
                ? `${unreadCount} notifikasi belum dibuka`
                : 'Pusat Notifikasi & Pengingat Kelengkapan Proyek'
            }
          >
            <Bell className="w-4 h-4" />

            {/* Badge Indikator: Hanya muncul jika ada notifikasi BELUM DIBUKA. Begitu dibuka, langsung hilang seketika! */}
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-amber-500 text-white text-[10px] font-mono font-bold rounded-full flex items-center justify-center ring-2 ring-white shadow-xs animate-pulse">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Popover Dropdown */}
          {isPopoverOpen && (
            <div className="absolute right-0 top-12 z-50 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200/90 overflow-hidden flex flex-col max-h-[30rem] animate-scaleUp">
              {/* Header */}
              <div className="p-4 bg-slate-50/90 border-b border-slate-200/80 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                    <Bell className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <span>Notifikasi & Kelengkapan</span>
                      {unreadCount === 0 && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded font-normal bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Sudah Dibaca
                        </span>
                      )}
                    </h4>
                    <p className="text-[10px] text-slate-400">
                      Pengingat section & status proyek
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={handleMarkAllAsRead}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-[10px] font-bold border border-blue-200 transition-colors"
                      title="Tandai semua notifikasi sudah dibaca"
                    >
                      <CheckCheck className="w-3 h-3 text-blue-600" />
                      <span>Tandai Dibaca</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={fetchNotifications}
                    disabled={isLoading}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors disabled:opacity-40"
                    title="Perbarui notifikasi"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-blue-600' : ''}`} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsPopoverOpen(false)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Sub-Header: Filters */}
              {notifications.length > 0 && (
                <div className="px-3 py-2 bg-slate-50/50 border-b border-slate-100 flex flex-col gap-1.5 text-[11px]">
                  {/* Type Filter Pills */}
                  <div className="flex items-center gap-1 overflow-x-auto custom-scrollbar pb-0.5">
                    <button
                      type="button"
                      onClick={() => setActiveFilter('ALL')}
                      className={`px-2.5 py-1 rounded-lg font-semibold transition-all whitespace-nowrap ${
                        activeFilter === 'ALL'
                          ? 'bg-white text-blue-600 shadow-xs border border-slate-200/80 font-bold'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Semua ({totalActiveCount})
                    </button>

                    {unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={() => setActiveFilter('UNREAD')}
                        className={`px-2.5 py-1 rounded-lg font-semibold transition-all whitespace-nowrap ${
                          activeFilter === 'UNREAD'
                            ? 'bg-amber-500 text-white shadow-xs font-bold'
                            : 'text-amber-600 hover:text-amber-800'
                        }`}
                      >
                        Belum Dibaca ({unreadCount})
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setActiveFilter('WARNING')}
                      className={`px-2.5 py-1 rounded-lg font-semibold transition-all whitespace-nowrap ${
                        activeFilter === 'WARNING'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200 font-bold'
                          : 'text-slate-500 hover:text-amber-700'
                      }`}
                    >
                      Section Kosong ({warningCount})
                    </button>

                    {infoCount > 0 && (
                      <button
                        type="button"
                        onClick={() => setActiveFilter('INFO')}
                        className={`px-2.5 py-1 rounded-lg font-semibold transition-all whitespace-nowrap ${
                          activeFilter === 'INFO'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200 font-bold'
                            : 'text-slate-500 hover:text-blue-700'
                        }`}
                      >
                        Info ({infoCount})
                      </button>
                    )}
                  </div>

                  {/* Project Selector if more than 1 project */}
                  {uniqueProjects.length > 1 && (
                    <div className="flex items-center gap-1 text-[10px] text-slate-500 pt-1 border-t border-slate-100">
                      <span className="shrink-0 font-medium">Proyek:</span>
                      <select
                        value={projectFilter}
                        onChange={(e) => setProjectFilter(e.target.value)}
                        className="bg-white border border-slate-200 rounded-md px-1.5 py-0.5 text-[10px] text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="ALL">Semua Proyek ({uniqueProjects.length})</option>
                        {uniqueProjects.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.code} - {p.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )}

              {/* Body: Notification Items */}
              <div className="overflow-y-auto custom-scrollbar flex-1 p-2 space-y-1.5 max-h-[19rem]">
                {isLoading && notifications.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 space-y-2">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-500" />
                    <p className="text-xs">Memeriksa kelengkapan section...</p>
                  </div>
                ) : filteredList.length === 0 ? (
                  /* Empty State: Semua data section proyek sudah lengkap / tidak ada notifikasi di filter */
                  <div className="py-8 px-4 text-center space-y-2.5">
                    <div className="w-11 h-11 mx-auto rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200/80 shadow-xs">
                      <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div>
                      <h5 className="text-xs font-bold text-slate-800">
                        {activeFilter === 'UNREAD'
                          ? 'Semua Notifikasi Sudah Dibaca!'
                          : activeFilter !== 'ALL' || projectFilter !== 'ALL'
                          ? 'Tidak ada notifikasi pada filter ini'
                          : 'Semua Data Proyek Lengkap!'}
                      </h5>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed max-w-[240px] mx-auto">
                        {activeFilter === 'UNREAD'
                          ? 'Seluruh pengingat section telah Anda buka dan tinjau.'
                          : activeFilter !== 'ALL' || projectFilter !== 'ALL'
                          ? 'Coba ganti filter untuk melihat informasi lainnya.'
                          : 'Semua data dan section proyek sudah terisi lengkap.'}
                      </p>
                    </div>
                  </div>
                ) : (
                  filteredList.map((item) => {
                    const isWarning = item.type === 'warning';
                    const isItemUnread = !readIds.includes(item.id);

                    return (
                      <div
                        key={item.id}
                        onClick={() => handleItemClick(item)}
                        className={`group p-3 rounded-xl border text-left cursor-pointer transition-all relative ${
                          isWarning
                            ? 'bg-white hover:bg-amber-50/50 border-slate-200/80 hover:border-amber-300'
                            : 'bg-white hover:bg-blue-50/50 border-slate-200/80 hover:border-blue-300'
                        }`}
                      >
                        {/* Unread indicator dot if not yet read */}
                        {isItemUnread && (
                          <span
                            className="absolute top-3 right-3 w-2 h-2 rounded-full bg-blue-600"
                            title="Belum dibaca"
                          />
                        )}

                        <div className="flex items-start gap-2.5">
                          {/* Status Icon */}
                          <div
                            className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border mt-0.5 ${
                              isWarning
                                ? 'bg-amber-50 text-amber-700 border-amber-200/80'
                                : 'bg-blue-50 text-blue-700 border-blue-200/80'
                            }`}
                          >
                            {getSectionIcon(item.section_key, item.type)}
                          </div>

                          {/* Text content */}
                          <div className="flex-1 min-w-0 pr-2">
                            <div className="flex items-center justify-between gap-1 mb-0.5">
                              <span className="px-1.5 py-0.2 rounded font-mono text-[9px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                                {item.project_code}
                              </span>
                              <span className="text-[10px] font-semibold text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
                                <span>{item.action_label || 'Buka'}</span>
                                <ArrowRight className="w-2.5 h-2.5" />
                              </span>
                            </div>

                            <h5 className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                              {item.title}
                            </h5>
                            <p className="text-[11px] text-slate-500 leading-snug line-clamp-2 mt-0.5">
                              {item.message}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Footer Summary */}
              {notifications.length > 0 && (
                <div className="p-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                  <span>Klik notifikasi untuk langsung menuju section</span>
                  <span className="font-mono font-semibold text-slate-600">
                    {filteredList.length} dari {totalActiveCount}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
