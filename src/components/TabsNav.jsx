import React from 'react';
import {
  LayoutDashboard,
  TrendingUp,
  FileSpreadsheet,
  ListChecks,
  CalendarCheck2,
  CalendarClock,
  FileText
} from 'lucide-react';

export default function TabsNav({ activeTab, onTabChange }) {
  const tabs = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'scurve', label: 'S-Curve', icon: TrendingUp },
    { id: 'summary', label: 'Progress Summary', icon: FileSpreadsheet },
    { id: 'detail', label: 'Progress Detail', icon: ListChecks },
    { id: 'thisweek', label: 'This Week Progress', icon: CalendarCheck2 },
    { id: 'nextweek', label: 'Next Week Plan', icon: CalendarClock },
    { id: 'reportnotes', label: 'Project Notes & Risk', icon: FileText },
  ];

  return (
    <div className="pb-4">
      {/* Segmented Executive Tab Navigation Container */}
      <div className="bg-slate-200/50 p-1.5 rounded-2xl border border-slate-200/80 shadow-xs inline-flex items-center gap-1.5 overflow-x-auto max-w-full custom-scrollbar">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-white text-blue-600 font-bold shadow-xs border border-slate-200/70'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50 font-semibold border border-transparent'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
