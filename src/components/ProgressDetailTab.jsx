import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  Clock,
  Filter,
  Search,
  Building,
  AlertCircle,
  TrendingDown,
  TrendingUp
} from 'lucide-react';
import { progressDetailItems } from '../data/dashboardData';

export default function ProgressDetailTab({ globalSearch = '', dbPackages }) {
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [localSearch, setLocalSearch] = useState('');

  const filterOptions = ['ALL', 'Completed', 'Ahead', 'On Track', 'Delayed', 'Watchlist'];
  const items = dbPackages && dbPackages.length > 0 ? dbPackages : progressDetailItems;

  const filteredItems = items.filter((item) => {
    const matchesFilter =
      statusFilter === 'ALL' || item.status.toLowerCase() === statusFilter.toLowerCase();
    
    const query = (globalSearch || localSearch).toLowerCase().trim();
    const matchesQuery =
      !query ||
      item.description.toLowerCase().includes(query) ||
      item.subcontractor.toLowerCase().includes(query) ||
      item.notes.toLowerCase().includes(query);

    return matchesFilter && matchesQuery;
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header & Filter Controls */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 tracking-tight">
            Work Packages & Subcontractor Progress Detail
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time tracking of construction work breakdown structure (WBS) & contractor deliverables
          </p>
        </div>

        {/* Filter Pills in Segmented Control Style */}
        <div className="inline-flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200/60">
          {filterOptions.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => setStatusFilter(opt)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                statusFilter === opt
                  ? 'bg-white text-blue-600 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/90 text-slate-600 font-bold uppercase text-[11px] tracking-wider border-b border-slate-200/80">
                <th className="p-3.5 text-center w-12 text-slate-500">No</th>
                <th className="p-3.5 min-w-[200px] text-slate-700">Work Description / Category</th>
                <th className="p-3.5 min-w-[190px] text-slate-700">Sub-Contractor / Owner</th>
                <th className="p-3.5 min-w-[240px] text-slate-700">Visual Progress Bar (Actual vs Plan)</th>
                <th className="p-3.5 min-w-[120px] text-center text-slate-700">Status Badge</th>
                <th className="p-3.5 min-w-[250px] text-slate-700">Obstacles / Notes</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 font-sans">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    No work packages match your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  let badgeStyle = "bg-slate-100 text-slate-700 border-slate-200/80";
                  if (item.status === 'Completed' || item.status === 'Ahead') {
                    badgeStyle = "bg-emerald-50 text-emerald-700 border-emerald-200/80";
                  } else if (item.status === 'Delayed') {
                    badgeStyle = "bg-rose-50 text-rose-700 border-rose-200/80";
                  } else if (item.status === 'On Track') {
                    badgeStyle = "bg-blue-50 text-blue-700 border-blue-200/80";
                  } else if (item.status === 'Watchlist') {
                    badgeStyle = "bg-amber-50 text-amber-700 border-amber-200/80";
                  }

                  // Progress bar color based on prompt specs
                  let barColor = item.color; // e.g. bg-slate-800, bg-amber-500, bg-blue-600

                  return (
                    <tr key={item.no} className="hover:bg-blue-50/20 transition-colors">
                      <td className="p-3.5 text-center font-mono tabular-nums font-medium text-slate-500">
                        {item.no}
                      </td>

                      <td className="p-3.5">
                        <div className="font-bold text-slate-900 text-sm">{item.description}</div>
                        <div className="text-[11px] text-slate-400 font-medium mt-0.5">
                          {item.category}
                        </div>
                      </td>

                      <td className="p-3.5">
                        <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                          <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{item.subcontractor}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">PO Verified</span>
                      </td>

                      <td className="p-3.5">
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-bold text-slate-900 font-mono tabular-nums">
                              Act: {item.actualPercent.toFixed(2)}%
                            </span>
                            <span className="text-slate-400 font-mono tabular-nums">
                              Plan: {item.planPercent.toFixed(2)}%
                            </span>
                          </div>

                          {/* Dual Progress Bar: background is plan indicator or full 100, bar is actual */}
                          <div className="relative w-full h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/80">
                            {/* Plan tick or marker */}
                            <div
                              className="absolute top-0 bottom-0 border-r-2 border-slate-400 z-10"
                              style={{ left: `${item.planPercent}%` }}
                              title={`Plan: ${item.planPercent}%`}
                            ></div>

                            {/* Actual Bar */}
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                              style={{ width: `${item.actualPercent}%` }}
                            ></div>
                          </div>

                          <div className="flex items-center justify-between text-[10px] text-slate-400">
                            <span>0%</span>
                            <span className="font-mono tabular-nums">
                              {item.actualPercent >= item.planPercent ? (
                                <span className="text-emerald-600 font-semibold">
                                  +{(item.actualPercent - item.planPercent).toFixed(2)}%
                                </span>
                              ) : (
                                <span className="text-rose-600 font-semibold">
                                  {(item.actualPercent - item.planPercent).toFixed(2)}%
                                </span>
                              )}
                            </span>
                            <span>100%</span>
                          </div>
                        </div>
                      </td>

                      <td className="p-3.5 text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badgeStyle}`}
                        >
                          {item.status}
                        </span>
                      </td>

                      <td className="p-3.5">
                        <div className="flex items-start gap-1.5">
                          {item.isObstacle ? (
                            <AlertCircle className="w-3.5 h-3.5 text-rose-500 mt-0.5 shrink-0" />
                          ) : item.status === 'Completed' ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
                          ) : (
                            <Clock className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />
                          )}
                          <span
                            className={`leading-relaxed text-xs ${
                              item.isObstacle
                                ? 'text-rose-700 font-medium'
                                : 'text-slate-600'
                            }`}
                          >
                            {item.notes}
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

