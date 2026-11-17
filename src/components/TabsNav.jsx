import React from 'react';
import {
  LayoutDashboard,
  TrendingUp,
  FileSpreadsheet,
  ListChecks,
  CalendarCheck2,
  CalendarClock
} from 'lucide-react';

export default function TabsNav({ activeTab, onTabChange }) {
  const tabs = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'scurve', label: 'S-Curve', icon: TrendingUp },
    { id: 'summary', label: 'Progress Summary', icon: FileSpreadsheet },
    { id: 'detail', label: 'Progress Detail', icon: ListChecks },
    { id: 'thisweek', label: 'This Week Progress', icon: CalendarCheck2 },
    { id: 'nextweek', label: 'Next Week Plan', icon: CalendarClock },
  ];

  return (
    <div className="pb-6">
      <div className="flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap border ${
                isActive
                  ? 'bg-slate-800 text-white border-slate-800 shadow-sm shadow-slate-900/10'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

