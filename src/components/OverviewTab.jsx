import React from 'react';
import {
  TrendingUp,
  Percent,
  CheckCircle2,
  AlertCircle,
  Building2,
  MapPin,
  Clock,
  ShieldCheck,
  Cpu,
  Layers,
  Wrench,
  Zap,
  Coins
} from 'lucide-react';
import { kpiOverview } from '../data/dashboardData';

export default function OverviewTab({ project, wbsRows, hseData, onNavigateTab }) {
  const categoryIcons = {
    Preparation: Clock,
    Engineering: Cpu,
    Procurement: Layers,
    Construction: Wrench,
    Commissioning: Zap,
    'Pre-Commissioning': Zap,
  };

  const planVal = Number(project?.planProgress || 0).toFixed(2);
  const actVal = Number(project?.actualProgress || 0).toFixed(2);
  const devNum = Number(project?.rawDeviation !== undefined ? project.rawDeviation : (actVal - planVal));
  const isAhead = devNum > 0;
  const isNeutral = devNum === 0;

  // Dynamic WBS categories breakdown if supplied from MySQL
  const categoriesList = wbsRows && wbsRows.length > 0
    ? wbsRows.map((r) => ({
        name: r.item,
        weight: `${r.weight}%`,
        plan: `${r.cumulative?.plan || 0}%`,
        act: `${r.cumulative?.actual || 0}%`,
        dev: `${Number(r.variance || 0) > 0 ? '+' : ''}${Number(r.variance || 0).toFixed(2)}%`,
        rawDev: Number(r.variance || 0),
        status: r.status,
      }))
    : kpiOverview.categories;

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* 3 Main KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* KPI 1: Contract Value / Base Cost (Satuan Rupiah) */}
        <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200/90 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Contract Value / Base Cost
            </span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-extrabold text-sm border border-emerald-200/80 font-mono tracking-tight shadow-xs">
              Rp
            </div>
          </div>

          <div className="mt-4">
            <div className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-baseline gap-1.5">
              <span>{project?.contractValue || "Rp 25,33 Miliar"}</span>
            </div>
            <p className="text-xs font-semibold text-emerald-600 mt-2 flex items-center gap-1.5">
              <span>↑</span>
              <span>100% Fixed Lump-Sum Budget</span>
              <span className="text-[10px] text-slate-400 font-normal">• Nilai Kontrak (IDR)</span>
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Funding: {project?.client || "Energy Equity Epic"}</span>
            <span className="font-mono font-medium text-slate-700">Kode: {project?.code || "#GBKB-55"}</span>
          </div>
        </div>

        {/* KPI 2: Plan vs Actual */}
        <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200/90 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Plan vs Actual ({project?.currentWeek || 'Selected Week'})
            </span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-base border border-blue-100">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>

          <div className="mt-4">
            <div className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-baseline gap-2">
              <span className="text-slate-400 text-2xl font-semibold">{planVal}%</span>
              <span className="text-slate-300">/</span>
              <span className={`text-2xl font-extrabold ${isAhead ? 'text-emerald-600' : isNeutral ? 'text-blue-600' : 'text-rose-600'}`}>
                {actVal}%
              </span>
            </div>
            <p className={`text-xs font-semibold mt-2 flex items-center gap-1.5 ${isAhead ? 'text-emerald-600' : isNeutral ? 'text-blue-600' : 'text-rose-600'}`}>
              {isAhead ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Physical progress ahead of schedule</span>
                </>
              ) : isNeutral ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Physical progress on track with plan</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                  <span className="text-rose-600">Physical progress behind planned schedule</span>
                </>
              )}
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Cutoff: {project?.lastUpdate || '29 Aug 2025'}</span>
            <span className="text-blue-600 font-medium cursor-pointer hover:underline" onClick={() => onNavigateTab('scurve')}>
              View in S-Curve →
            </span>
          </div>
        </div>

        {/* KPI 3: Deviation */}
        <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200/90 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Deviation Status
            </span>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-base border ${
              isAhead ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : isNeutral ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-rose-50 text-rose-600 border-rose-100'
            }`}>
              <Percent className="w-5 h-5" />
            </div>
          </div>

          <div className="mt-4">
            <div className={`text-3xl font-extrabold tracking-tight ${isAhead ? 'text-emerald-600' : isNeutral ? 'text-slate-800' : 'text-rose-600'}`}>
              {project?.deviation || `${devNum > 0 ? '+' : ''}${devNum.toFixed(2)}%`}
            </div>
            <div className="mt-2 flex items-center gap-2">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                isAhead ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : isNeutral ? 'bg-blue-100 text-blue-800 border-blue-200' : 'bg-rose-100 text-rose-800 border-rose-200'
              }`}>
                {project?.statusLabel || (isAhead ? 'Ahead of Schedule' : isNeutral ? 'On Track' : 'Delayed')}
              </span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Variance Status</span>
            <span className={`font-semibold ${isAhead ? 'text-emerald-700' : isNeutral ? 'text-blue-700' : 'text-rose-700'}`}>
              {isAhead ? 'Positive Variance (+)' : isNeutral ? 'Zero Variance (0.00%)' : 'Negative Variance (-)'}
            </span>
          </div>
        </div>
      </div>

      {/* Mini Breakdown Cards by Phase */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">
            Progress Breakdown by Phase ({project?.currentWeek || 'Current Week'})
          </h3>
          <span className="text-xs text-slate-400 font-medium">Weighted Cumulative Progress</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {categoriesList.map((cat, idx) => {
            const Icon = categoryIcons[cat.name] || Layers;
            const catDevNum = Number(cat.rawDev !== undefined ? cat.rawDev : parseFloat(cat.dev));
            const catAhead = catDevNum > 0;
            const catNeutral = catDevNum === 0;

            return (
              <div
                key={idx}
                className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md hover:border-slate-300 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5 truncate max-w-[140px]" title={cat.name}>
                      <Icon className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span className="truncate">{cat.name}</span>
                    </span>
                    <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                      {cat.weight}
                    </span>
                  </div>

                  <div className="space-y-2 mt-4 text-xs">
                    <div className="flex justify-between items-center py-1 border-b border-slate-100">
                      <span className="text-slate-500">Plan</span>
                      <span className="font-mono font-semibold text-slate-700">{cat.plan}</span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-slate-100">
                      <span className="text-slate-500">Actual</span>
                      <span className="font-mono font-bold text-slate-900">{cat.act}</span>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <span className="text-slate-500">Deviasi</span>
                      <span
                        className={`font-mono font-bold ${
                          catAhead
                            ? 'text-emerald-600'
                            : catNeutral
                            ? 'text-slate-600'
                            : 'text-rose-600'
                        }`}
                      >
                        {cat.dev}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Status</span>
                  <span
                    className={`font-semibold ${
                      catAhead
                        ? 'text-emerald-600'
                        : catNeutral
                        ? 'text-slate-600'
                        : 'text-rose-600'
                    }`}
                  >
                    {catAhead ? 'Ahead' : catNeutral ? 'On Track' : 'Delayed'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Project Executive Highlights Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-md border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-blue-500/20 text-blue-300 text-xs font-semibold border border-blue-400/30">
              <Building2 className="w-3.5 h-3.5" />
              Enterprise Project Control Overview • {project?.currentWeek}
            </div>
            <h4 className="text-lg font-bold text-white">
              {project?.name}
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              EPC facility installation to augment gas intake compression capacity for Sengkang Power Plant. All critical path procurement items monitored; engineering & construction milestones updated per weekly cutoff.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 border-t md:border-t-0 md:border-l border-slate-800 pt-4 md:pt-0 md:pl-6 text-xs">
            <div>
              <span className="text-slate-400 block text-[11px]">Client</span>
              <span className="font-semibold text-slate-200">{project?.client || 'Energy Equity Epic'}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Location</span>
              <span className="font-semibold text-slate-200">{project?.location || 'Sengkang, Wajo'}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Contractor</span>
              <span className="font-semibold text-slate-200 truncate">{project?.contractorName || 'PT TIP'}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Safe Manhours</span>
              <span className="font-semibold text-emerald-400 font-mono">
                {hseData?.totalManhours || '186,056 hrs'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Current Period</span>
              <span className="font-semibold text-blue-400 font-mono">{project?.currentWeek}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Cutoff Update</span>
              <span className="font-semibold text-slate-200">{project?.lastUpdate || '29 Aug 2025'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
