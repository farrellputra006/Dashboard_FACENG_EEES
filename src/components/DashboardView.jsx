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
import ExportModal from './ExportModal';
import ImportFileModal from './ImportFileModal';
import { projectsData } from '../data/dashboardData';
import {
  transformProject,
  transformWbsCategories,
  transformSCurve,
  transformSubcontractors,
  transformHseReport
} from '../utils/laravelAdapter';
import { apiRequest } from '../utils/api';
import { Database, Wifi, RefreshCw } from 'lucide-react';

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
  const [isFetchingWeek, setIsFetchingWeek] = useState(false);

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
    projectsList.find((p) => p.id === selectedProjectId) || projectsList[0];

  // Live API Fetch Effect (Connects directly to Laravel Backend /api/dashboard with Sanctum Bearer token)
  useEffect(() => {
    const rawId = currentProject.rawId || currentProject.id?.replace('proj-', '');
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
  }, [selectedProjectId, selectedWeek]);

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

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-800 antialiased">
      {/* 1. Sidebar Kiri (Fixed/Sticky w-80 bg-slate-900) */}
      <Sidebar
        projects={projectsList}
        selectedProjectId={selectedProjectId}
        onSelectProject={(id) => {
          setSelectedProjectId(id);
        }}
        isDelayedDemo={isDelayedDemo}
        onToggleStatusDemo={() => setIsDelayedDemo(!isDelayedDemo)}
      />

      {/* 2. Area Konten Utama */}
      <main className="flex-1 p-6 md:p-8 overflow-y-auto min-w-0 max-h-screen">
        <div className="max-w-7xl mx-auto space-y-2">
          {/* Top Bar with Breadcrumbs & Search */}
          <TopBar
            projectName={currentProject.name}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />

          {/* Database Source Indicator Pill & Multi-Week Live Status */}
          <div className="flex items-center justify-between pt-1">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-900 text-white text-[11px] font-mono border border-slate-800 shadow-xs">
              <Database className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span>Source: <span className="text-emerald-300 font-bold">{dataSource}</span></span>
              <span className="text-slate-500">•</span>
              <span className="text-slate-300 font-semibold">{selectedWeek} Active</span>
              {isFetchingWeek && (
                <RefreshCw className="w-3 h-3 text-blue-400 animate-spin" />
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
              />
            )}

            {activeTab === 'summary' && (
              <ProgressSummaryTab
                initialRows={dynamicWbsRows}
                hseReportData={dynamicHse}
                selectedWeek={selectedWeek}
                onOpenImportModal={() => setIsImportOpen(true)}
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
              />
            )}

            {activeTab === 'nextweek' && (
              <NextWeekTab
                dbActivities={dynamicActivities}
                selectedWeek={selectedWeek}
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
    </div>
  );
}
