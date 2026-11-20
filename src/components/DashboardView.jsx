import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import ProjectHeader from './ProjectHeader';
import TabsNav from './TabsNav';
import OverviewTab from './OverviewTab';
import SCurveTab from './SCurveTab';
import ProgressSummaryTab from './ProgressSummaryTab';
import ProgressDetailTab from './ProgressDetailTab';
import ThisWeekTab from './ThisWeekTab';
import NextWeekTab from './NextWeekTab';
import ReportNotesTab from './ReportNotesTab';
import ExportModal from './ExportModal';
import ImportFileModal from './ImportFileModal';
import CreateProjectModal from './CreateProjectModal';
import DeleteProjectModal from './DeleteProjectModal';
import { projectsData } from '../data/dashboardData';
import {
  transformProject,
  transformWbsCategories,
  transformSCurve,
  transformSubcontractors,
  transformHseReport
} from '../utils/laravelAdapter';
import { apiRequest } from '../utils/api';
import { Database, Wifi, RefreshCw, CheckCircle2 } from 'lucide-react';

export default function DashboardView() {
  // Check for pre-injected data from Laravel Blade View (window.__LARAVEL_DATABASE_DATA__)
  const initialLaravelData = typeof window !== 'undefined' && window.__LARAVEL_DATABASE_DATA__;

  const [projectsList, setProjectsList] = useState(() => {
    if (initialLaravelData?.projects && initialLaravelData.projects.length > 0) {
      return initialLaravelData.projects.map(transformProject);
    }
    return projectsData;
  });

  const [selectedProjectId, setSelectedProjectId] = useState('proj-1');
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedWeek, setSelectedWeek] = useState('Week 12');
  const [availableWeeks, setAvailableWeeks] = useState(['Week 10', 'Week 11', 'Week 12']);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDelayedDemo, setIsDelayedDemo] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);
  const [isDeleteProjectOpen, setIsDeleteProjectOpen] = useState(false);
  const [successNotification, setSuccessNotification] = useState(null);
  const [isFetchingWeek, setIsFetchingWeek] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Database eager loaded records
  const [dbRelations, setDbRelations] = useState(() => {
    if (initialLaravelData?.selectedProject) {
      return initialLaravelData.selectedProject;
    }
    return null;
  });

  const [dataSource, setDataSource] = useState(
    initialLaravelData ? 'MySQL Database (Blade SSR)' : 'MySQL Multi-Week Ready'
  );

  // Active project selection
  const currentProject =
    projectsList.find((p) => p.id === selectedProjectId) ||
    projectsList[0] || {
      id: 'proj-none',
      name: 'Tidak ada proyek',
      code: '-',
      status: 'ontrack',
      statusLabel: 'N/A',
      location: '-',
      contractValue: '-',
    };

  // Live API Fetch Effect (Connects directly to Laravel Backend /api/dashboard with Sanctum Bearer token)
  useEffect(() => {
    if (!currentProject || !currentProject.id || currentProject.id === 'proj-none') {
      return;
    }
    const rawId = currentProject.rawId || currentProject.id?.replace('proj-', '');
    if (!rawId) return;
    const apiUrl = `/api/dashboard?project_id=${rawId}${selectedWeek ? `&week=${encodeURIComponent(selectedWeek)}` : ''}`;

    setIsFetchingWeek(true);
    const controller = new AbortController();

    apiRequest(apiUrl, {
      signal: controller.signal
    })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((json) => {
        const payload = json.data || json;
        if (payload?.projects && payload.projects.length > 0) {
          setProjectsList(payload.projects.map(transformProject));
        }
        if (payload?.available_weeks && payload.available_weeks.length > 0) {
          setAvailableWeeks(payload.available_weeks);
        }
        if (payload?.selected_week) {
          // Sync if different
        }
        if (payload?.selected_project) {
          setDbRelations(payload.selected_project);
          setDataSource(`MySQL Database (${payload.selected_week || selectedWeek})`);
        }
      })
      .catch((err) => {
        if (err.name !== 'AbortError') {
          // Keep current fallback data
        }
      })
      .finally(() => {
        setIsFetchingWeek(false);
      });

    return () => controller.abort();
  }, [selectedProjectId, selectedWeek, refreshKey]);

  // Transformed child data from MySQL for the selected week
  const dynamicWbsRows = dbRelations?.wbs_categories ? transformWbsCategories(dbRelations.wbs_categories) : null;
  const dynamicSCurve = dbRelations?.s_curve_metrics ? transformSCurve(dbRelations.s_curve_metrics) : null;
  const dynamicSubcontractors = dbRelations?.subcontractor_packages ? transformSubcontractors(dbRelations.subcontractor_packages) : null;
  const dynamicHse = dbRelations?.hse_reports && dbRelations.hse_reports[0] ? transformHseReport(dbRelations.hse_reports[0]) : null;
  const dynamicPhotos = dbRelations?.progress_photos || null;
  const dynamicActivities = dbRelations?.weekly_activities || null;

  // Handler for Excel / CSV Import (using authenticated apiRequest)
  const handleApplyImport = async (importData) => {
    const rawId = currentProject.rawId || currentProject.id?.replace('proj-', '') || 1;
    const res = await apiRequest(`/api/projects/${rawId}/import`, {
      method: 'POST',
      body: {
        week_label: importData.weekLabel,
        rows: importData.rows,
      },
    });

    const result = await res.json();
    if (!res.ok || !result.success) {
      throw new Error(result.message || 'Gagal menyimpan data import ke MySQL.');
    }

    // Switch selected week to newly imported week
    const newWeek = importData.weekLabel;
    if (!availableWeeks.includes(newWeek)) {
      setAvailableWeeks((prev) => [...prev, newWeek]);
    }
    setSelectedWeek(newWeek);
    setDataSource(`MySQL Database (Imported: ${newWeek})`);
  };

  // Handler when a new project is created / uploaded
  const handleProjectCreated = (newProject, allProjects) => {
    if (allProjects && allProjects.length > 0) {
      setProjectsList(allProjects.map(transformProject));
    } else if (newProject) {
      setProjectsList((prev) => [...prev, transformProject(newProject)]);
    }

    const newProjId = `proj-${newProject.id}`;
    setSelectedProjectId(newProjId);
    const initWk = newProject.current_week || 'Week 1';
    setSelectedWeek(initWk);
    setDataSource(`MySQL Database (${newProject.project_name})`);
    setSuccessNotification(`Proyek baru "${newProject.project_name}" (${newProject.project_code}) berhasil dibuat & dimuat.`);

    setTimeout(() => {
      setSuccessNotification(null);
    }, 6000);
  };

  // Handler for Hybrid Data Management: when a WBS row is manually edited / overridden
  const handleWbsUpdated = (updatedWbs, overallMetrics) => {
    // 1. Update project in projectsList (planProgress, actualProgress, deviation, status)
    if (overallMetrics) {
      setProjectsList((prev) =>
        prev.map((p) => {
          if (p.id === selectedProjectId) {
            const dev = Number(overallMetrics.deviation || 0);
            return {
              ...p,
              planProgress: Number(overallMetrics.plan_cumulative || p.planProgress),
              actualProgress: Number(overallMetrics.actual_cumulative || p.actualProgress),
              deviation: dev > 0 ? `+${dev.toFixed(2)}%` : `${dev.toFixed(2)}%`,
              rawDeviation: dev,
              status: dev > 0 ? 'ahead' : (dev < 0 ? 'delayed' : 'ontrack'),
              statusLabel: overallMetrics.status || (dev > 0 ? `+${dev.toFixed(2)}% Ahead` : 'On Track'),
            };
          }
          return p;
        })
      );
    }

    // 2. Update dbRelations WBS categories and SCurve metrics
    setDbRelations((prev) => {
      if (!prev) return prev;
      const updatedCategories = (prev.wbs_categories || []).map((cat) => {
        if (cat.id === updatedWbs.id || cat.code === updatedWbs.code) {
          return {
            ...cat,
            ...updatedWbs,
          };
        }
        return cat;
      });

      // Update S-Curve metric for current week
      const updatedSCurve = (prev.s_curve_metrics || []).map((m) => {
        if (m.week_label === selectedWeek) {
          return {
            ...m,
            cum_plan: overallMetrics ? overallMetrics.plan_cumulative : m.cum_plan,
            cum_actual: overallMetrics ? overallMetrics.actual_cumulative : m.cum_actual,
          };
        }
        return m;
      });

      return {
        ...prev,
        wbs_categories: updatedCategories,
        s_curve_metrics: updatedSCurve,
        plan_cumulative: overallMetrics?.plan_cumulative ?? prev.plan_cumulative,
        actual_cumulative: overallMetrics?.actual_cumulative ?? prev.actual_cumulative,
        deviation: overallMetrics?.deviation ?? prev.deviation,
        status: overallMetrics?.status ?? prev.status,
      };
    });

    setSuccessNotification(`Data "${updatedWbs.name}" berhasil diperbarui. Grafik S-Curve & seluruh KPI langsung tersinkronisasi.`);
    setTimeout(() => {
      setSuccessNotification(null);
    }, 6000);
  };

  // Handler when a project is permanently deleted (Cascade deletion)
  const handleDeleteSuccess = (deletedId, remainingProjects) => {
    let nextList = [];
    if (remainingProjects && remainingProjects.length > 0) {
      nextList = remainingProjects.map(transformProject);
    } else {
      nextList = projectsList.filter(
        (p) => (p.rawId || (typeof p.id === 'string' ? p.id.replace('proj-', '') : p.id)) != deletedId
      );
    }
    setProjectsList(nextList);

    const deletedName = currentProject?.name || 'Proyek';
    const deletedCode = currentProject?.code || '';

    if (nextList.length > 0) {
      const nextProj = nextList[0];
      setSelectedProjectId(nextProj.id);
      setSelectedWeek(nextProj.current_week || 'Week 12');
      setDataSource(`MySQL Database (${nextProj.name})`);
    } else {
      setSelectedProjectId(null);
      setDbRelations(null);
      setDataSource('Tidak ada proyek');
    }

    setSuccessNotification(
      `Proyek "${deletedName}" ${deletedCode ? `(${deletedCode}) ` : ''}beserta seluruh data progres & histori berhasil dihapus.`
    );
    setTimeout(() => {
      setSuccessNotification(null);
    }, 6000);
  };

  return (
    <div className="min-h-screen bg-[#F4F6FA] flex font-sans text-slate-800 antialiased">
      {/* 1. Sidebar Kiri (Executive Clean White & Border) */}
      <Sidebar
        projects={projectsList}
        selectedProjectId={selectedProjectId}
        onSelectProject={(id) => {
          setSelectedProjectId(id);
        }}
        isDelayedDemo={isDelayedDemo}
        onToggleStatusDemo={() => setIsDelayedDemo(!isDelayedDemo)}
        onOpenCreateProject={() => setIsCreateProjectOpen(true)}
      />

      {/* 2. Area Konten Utama */}
      <main className="flex-1 p-6 md:p-8 overflow-y-auto min-w-0 max-h-screen">
        <div className="max-w-7xl mx-auto space-y-4">
          {/* Top Bar with Breadcrumbs & Search */}
          <TopBar
            projectName={currentProject.name}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onOpenCreateProject={() => setIsCreateProjectOpen(true)}
          />

          {/* Success Notification Banner */}
          {successNotification && (
            <div className="p-4 bg-emerald-50/90 border border-emerald-200/90 text-emerald-800 rounded-2xl text-xs font-semibold flex items-center justify-between shadow-xs animate-fadeIn">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{successNotification}</span>
              </div>
              <button
                type="button"
                onClick={() => setSuccessNotification(null)}
                className="text-emerald-600 hover:text-emerald-800 text-xs font-bold"
              >
                ✕
              </button>
            </div>
          )}

          {/* Database Source Indicator Pill & Multi-Week Live Status */}
          <div className="flex items-center justify-between pt-1">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white text-slate-700 text-xs font-medium border border-slate-200/80 shadow-xs">
              <Database className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
              <span>Sumber Data: <strong className="text-slate-900 font-semibold">{dataSource}</strong></span>
              <span className="text-slate-300">•</span>
              <span className="text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">{selectedWeek} Active</span>
              {isFetchingWeek && (
                <RefreshCw className="w-3.5 h-3.5 text-blue-500 animate-spin ml-1" />
              )}
            </div>
          </div>

          {/* Project Header with Dynamic Week Selector & Import Button */}
          <ProjectHeader
            project={currentProject}
            selectedWeek={selectedWeek}
            onSelectWeek={setSelectedWeek}
            availableWeeks={availableWeeks}
            onExportPdf={() => setIsExportOpen(true)}
            onOpenImportModal={() => setIsImportOpen(true)}
            onOpenDeleteModal={() => setIsDeleteProjectOpen(true)}
          />

          {/* 3. Sistem Tab Navigasi (6 Tab Interaktif) */}
          <TabsNav activeTab={activeTab} onTabChange={setActiveTab} />

          {/* 4. Tab Content Area */}
          <div className="pb-12">
            {activeTab === 'overview' && (
              <OverviewTab
                project={currentProject}
                wbsRows={dynamicWbsRows}
                hseData={dynamicHse}
                onNavigateTab={(tab) => setActiveTab(tab)}
              />
            )}

            {activeTab === 'scurve' && (
              <SCurveTab
                dbMetrics={dynamicSCurve}
                project={currentProject}
                selectedWeek={selectedWeek}
                projectId={currentProject.rawId || currentProject.id}
                onScheduleUpdated={() => setRefreshKey((k) => k + 1)}
              />
            )}

            {activeTab === 'summary' && (
              <ProgressSummaryTab
                initialRows={dynamicWbsRows}
                hseReportData={dynamicHse}
                selectedWeek={selectedWeek}
                onOpenImportModal={() => setIsImportOpen(true)}
                projectId={currentProject.rawId || currentProject.id}
                onWbsUpdated={handleWbsUpdated}
                onOpenDeleteModal={() => setIsDeleteProjectOpen(true)}
                onScheduleUpdated={() => setRefreshKey((k) => k + 1)}
              />
            )}

            {activeTab === 'detail' && (
              <ProgressDetailTab
                globalSearch={searchQuery}
                dbPackages={dynamicSubcontractors}
              />
            )}

            {activeTab === 'thisweek' && (
              <ThisWeekTab
                dbActivities={dynamicActivities}
                dbPhotos={dynamicPhotos}
                selectedWeek={selectedWeek}
                projectId={currentProject.rawId || currentProject.id}
                currentProject={currentProject}
                projectsList={projectsList}
                availableWeeks={availableWeeks}
                onPhotosUpdated={(newPhotos) => {
                  setDbRelations((prev) => (prev ? { ...prev, progress_photos: newPhotos } : prev));
                }}
              />
            )}

            {activeTab === 'nextweek' && (
              <NextWeekTab
                dbActivities={dynamicActivities}
                selectedWeek={selectedWeek}
                projectId={currentProject.rawId || currentProject.id}
                currentProject={currentProject}
                projectsList={projectsList}
                availableWeeks={availableWeeks}
              />
            )}

            {activeTab === 'reportnotes' && (
              <ReportNotesTab
                projectId={currentProject.rawId || currentProject.id}
                selectedWeek={selectedWeek}
                currentProject={currentProject}
              />
            )}
          </div>
        </div>
      </main>

      {/* Export Report Modal */}
      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        projectName={currentProject.name}
        activeWeek={selectedWeek}
      />

      {/* Import Excel / CSV Modal */}
      <ImportFileModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onApplyData={handleApplyImport}
        currentWeek={selectedWeek}
        currentFileName={`${currentProject.name}_${selectedWeek}.xlsx`}
      />

      {/* Create / Upload New Project Modal */}
      <CreateProjectModal
        isOpen={isCreateProjectOpen}
        onClose={() => setIsCreateProjectOpen(false)}
        onProjectCreated={handleProjectCreated}
      />

      {/* Delete Project Confirmation Modal */}
      <DeleteProjectModal
        isOpen={isDeleteProjectOpen}
        onClose={() => setIsDeleteProjectOpen(false)}
        project={currentProject}
        onDeleteSuccess={handleDeleteSuccess}
      />
    </div>
  );
}
