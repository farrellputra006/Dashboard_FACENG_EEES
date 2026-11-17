import React, { useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  ComposedChart,
  Area,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceDot,
  ReferenceLine
} from 'recharts';
import {
  TrendingUp,
  AlertCircle,
  Calendar,
  CheckCircle2,
  Info,
  Clock,
  Sparkles,
  Target,
  Flag,
  BarChart3,
  Layers,
  ChevronRight
} from 'lucide-react';
import {
  scurveData,
  forecastMetrics,
  forecastDetailedSeries
} from '../data/dashboardData';

// Custom Tooltip for Primary S-Curve
const CustomSCurveTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const dataPoint = scurveData.find((d) => d.week === label);
    const planVal = payload.find((p) => p.dataKey === 'plan')?.value;
    const actVal = payload.find((p) => p.dataKey === 'actual')?.value;
    const forecastVal = payload.find((p) => p.dataKey === 'forecast')?.value;
    const diff = actVal !== undefined && planVal !== undefined ? (actVal - planVal).toFixed(2) : null;

    return (
      <div className="bg-slate-900 text-white p-3.5 rounded-xl shadow-xl border border-slate-700 text-xs min-w-[200px]">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2 font-mono">
          <span className="font-bold text-slate-200">{label}</span>
          <span className="text-slate-400">{dataPoint?.date}</span>
        </div>
        <div className="space-y-1.5 font-medium">
          <div className="flex items-center justify-between text-blue-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
              Plan:
            </span>
            <span className="font-mono">{planVal !== undefined ? `${planVal.toFixed(2)}%` : '-'}</span>
          </div>
          {actVal !== undefined && actVal !== null && (
            <div className="flex items-center justify-between text-emerald-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                Actual:
              </span>
              <span className="font-mono font-bold">{actVal.toFixed(2)}%</span>
            </div>
          )}
          {forecastVal !== undefined && forecastVal !== null && (
            <div className="flex items-center justify-between text-rose-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-1 bg-rose-500"></span>
                Forecast:
              </span>
              <span className="font-mono">{forecastVal.toFixed(2)}%</span>
            </div>
          )}
          {diff !== null && (
            <div className="pt-2 mt-2 border-t border-slate-800 flex items-center justify-between">
              <span className="text-slate-400">Variance:</span>
              <span className={`font-mono font-bold ${Number(diff) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {Number(diff) > 0 ? `+${diff}%` : `${diff}%`}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }
  return null;
};

// Custom Tooltip for Forecast Diagram
const CustomForecastTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const item = forecastDetailedSeries.find((d) => d.week === label);
    return (
      <div className="bg-slate-900 text-white p-4 rounded-xl shadow-2xl border border-slate-700 text-xs min-w-[240px]">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2 font-mono">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-cyan-300">{label}</span>
            <span className="text-slate-400">({item?.date})</span>
          </div>
          {item?.isCutoff && (
            <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] border border-emerald-500/30">
              Cutoff
            </span>
          )}
        </div>

        {item?.milestone && (
          <div className="mb-2 p-1.5 rounded bg-slate-800/80 border border-slate-700 text-[11px] text-amber-300 flex items-center gap-1">
            <Flag className="w-3 h-3 text-amber-400 shrink-0" />
            <span className="font-medium truncate">{item.milestone}</span>
          </div>
        )}

        <div className="space-y-1.5 font-mono">
          {payload.map((p, idx) => (
            <div key={idx} className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-sans text-slate-300">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }}></span>
                {p.name}:
              </span>
              <span className="font-bold" style={{ color: p.color }}>
                {p.value !== null && p.value !== undefined ? `${p.value.toFixed(2)}%` : '-'}
              </span>
            </div>
          ))}
          {item?.weeklyDelta !== undefined && (
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-slate-400 text-[11px]">
              <span className="font-sans">Weekly Velocity:</span>
              <span className="text-cyan-400 font-bold">+{item.weeklyDelta.toFixed(2)}% / wk</span>
            </div>
          )}
        </div>
      </div>
    );
  }
  return null;
};

export default function SCurveTab({ dbMetrics, project, selectedWeek }) {
  const [forecastViewMode, setForecastViewMode] = useState('cumulative'); // 'cumulative' | 'velocity'

  const activeSCurve = dbMetrics && dbMetrics.length > 0 ? dbMetrics : scurveData;

  // Filter weeks up to current week for the table view
  const currentWkLabel = selectedWeek || project?.currentWeek || 'Week 12';
  const planVal = Number(project?.planProgress || 89.82).toFixed(2);
  const actVal = Number(project?.actualProgress || 93.45).toFixed(2);
  const devText = project?.deviation || '+3.63%';
  const statusBadge = project?.statusLabel || 'Ahead';
  const isAhead = (project?.rawDeviation !== undefined ? project.rawDeviation : 3.63) >= 0;

  const weeklyTableData = activeSCurve.filter(d => d.actual !== null && d.actual !== undefined);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Horizontal Summary Card */}
      <div className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 divide-y md:divide-y-0 md:divide-x divide-slate-100">
          {/* Plan Cumulative Progress */}
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-lg border border-blue-100 shrink-0">
              <span className="font-mono">P</span>
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                Plan Cumulative Progress
              </span>
              <div className="text-2xl font-extrabold text-slate-900 tracking-tight font-mono mt-0.5">
                {planVal}%
              </div>
              <span className="text-[11px] text-slate-400">Baseline Target {currentWkLabel}</span>
            </div>
          </div>

          {/* Actual Cumulative Progress */}
          <div className="flex items-center gap-4 pt-4 md:pt-0 md:pl-6">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg border shrink-0 ${
              isAhead ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'
            }`}>
              <span className="font-mono">A</span>
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                Actual Cumulative Progress
              </span>
              <div className={`text-2xl font-extrabold tracking-tight font-mono mt-0.5 ${
                isAhead ? 'text-emerald-600' : 'text-rose-600'
              }`}>
                {actVal}%
              </div>
              <span className={`text-[11px] font-medium ${isAhead ? 'text-emerald-600' : 'text-rose-600'}`}>
                Cutoff: {project?.lastUpdate || '29-Aug-2025'}
              </span>
            </div>
          </div>

          {/* Deviation Progress */}
          <div className="flex items-center gap-4 pt-4 md:pt-0 md:pl-6">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg border shrink-0 ${
              isAhead ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-rose-50 text-rose-600 border-rose-100'
            }`}>
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                Deviation Progress
              </span>
              <div className={`text-2xl font-extrabold tracking-tight font-mono mt-0.5 flex items-center gap-2 ${
                isAhead ? 'text-emerald-600' : 'text-rose-600'
              }`}>
                <span>{devText}</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
                  isAhead ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-rose-100 text-rose-800 border-rose-200'
                }`}>
                  {statusBadge}
                </span>
              </div>
              <span className="text-[11px] text-slate-500">
                {isAhead ? 'Exceeding baseline plan' : 'Behind baseline schedule'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* DIAGRAM 1: Main S-Curve Progress (Base Cost) */}
      <div className="bg-white rounded-xl p-6 border border-slate-200/90 shadow-sm">
        {/* Header & Legend */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-bold rounded uppercase tracking-wider border border-blue-200">
                Diagram 1
              </span>
              <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                S-Curve — Progress (Base Cost) • {currentWkLabel}
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Cumulative Planned vs Actual S-Curve with Cutoff Annotation at Week 46 (29-Aug-2025)
            </p>
          </div>

          {/* Interactive Legend matching specs */}
          <div className="flex flex-wrap items-center gap-4 text-xs font-semibold">
            <div className="flex items-center gap-2 text-blue-600">
              <span className="w-4 h-1 bg-blue-500 rounded-full"></span>
              <span>CUM PLAN PROGRESS</span>
            </div>
            <div className="flex items-center gap-2 text-emerald-700">
              <span className="w-4 h-1 bg-emerald-600 rounded-full"></span>
              <span>CUM ACTUAL PROGRESS</span>
            </div>
            <div className="flex items-center gap-2 text-rose-600">
              <span className="w-4 h-0.5 border-t-2 border-dashed border-rose-500"></span>
              <span>CUM FORECAST PROGRESS</span>
            </div>
          </div>
        </div>

        {/* Chart 1 Render */}
        <div className="h-[380px] w-full pt-6 relative">
          {/* Visual Annotation Badge for W-46 */}
          <div className="absolute right-12 top-4 z-10 bg-slate-900/90 backdrop-blur-sm text-white px-3.5 py-2 rounded-xl text-xs shadow-lg border border-slate-700 pointer-events-none hidden md:block">
            <div className="flex items-center gap-1.5 text-emerald-400 font-bold mb-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              <span>W-46 Cutoff (29-Aug-25)</span>
            </div>
            <div className="grid grid-cols-2 gap-x-3 text-[11px] font-mono">
              <span className="text-slate-300">Plan: 89.82%</span>
              <span className="text-emerald-300 font-bold">Act: 93.45%</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-1">Variance: +3.63% (Ahead)</div>
          </div>

          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={activeSCurve}
              margin={{ top: 20, right: 30, left: 10, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              
              <XAxis
                dataKey="week"
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#cbd5e1' }}
                tickMargin={8}
              />
              
              <YAxis
                domain={[0, 100]}
                ticks={[0, 20, 40, 60, 80, 100]}
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#cbd5e1' }}
                tickFormatter={(val) => `${val}%`}
              />
              
              <Tooltip content={<CustomSCurveTooltip />} />
              
              {/* Reference line at W-46 cutoff */}
              <ReferenceLine
                x="W-46"
                stroke="#0f172a"
                strokeDasharray="4 4"
                strokeWidth={1.5}
                label={{
                  value: 'Cutoff W-46',
                  position: 'insideTopLeft',
                  fill: '#0f172a',
                  fontSize: 10,
                  fontWeight: 600
                }}
              />

              {/* Baseline Plan Line */}
              <Line
                type="monotone"
                dataKey="plan"
                name="CUM PLAN PROGRESS"
                stroke="#2563eb"
                strokeWidth={2.5}
                dot={{ r: 3, fill: '#2563eb' }}
                activeDot={{ r: 6, fill: '#2563eb', stroke: '#ffffff', strokeWidth: 2 }}
              />

              {/* Actual Progress Line */}
              <Line
                type="monotone"
                dataKey="actual"
                name="CUM ACTUAL PROGRESS"
                stroke="#059669"
                strokeWidth={3.5}
                dot={{ r: 4, fill: '#059669' }}
                activeDot={{ r: 7, fill: '#059669', stroke: '#ffffff', strokeWidth: 2 }}
                connectNulls={false}
              />

              {/* Forecast Line (Dashed Red) */}
              <Line
                type="monotone"
                dataKey="forecast"
                name="CUM FORECAST PROGRESS"
                stroke="#e11d48"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ r: 3, fill: '#e11d48' }}
                connectNulls={true}
              />

              {/* Exact Reference Dots at W-46 */}
              <ReferenceDot
                x="W-46"
                y={93.45}
                r={6}
                fill="#059669"
                stroke="#ffffff"
                strokeWidth={2}
              />
              <ReferenceDot
                x="W-46"
                y={89.82}
                r={5}
                fill="#2563eb"
                stroke="#ffffff"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* DIAGRAM 2: Diagram Forecast (Completion & Lookahead Forecast Analysis) */}
      <div className="bg-white rounded-xl p-6 border border-slate-200/90 shadow-sm space-y-6">
        {/* Header & View Switcher */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-rose-50 text-rose-700 text-[10px] font-bold rounded uppercase tracking-wider border border-rose-200">
                Diagram 2
              </span>
              <h3 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <span>Diagram Forecast — Completion & Lookahead Trajectory</span>
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Earned Value Schedule Projection from W-46 to Commercial Operation Date (COD) with Multi-Scenario Sensitivity
            </p>
          </div>

          {/* Toggle between Cumulative Trajectory and Weekly Required Velocity */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl self-start md:self-auto">
            <button
              type="button"
              onClick={() => setForecastViewMode('cumulative')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                forecastViewMode === 'cumulative'
                  ? 'bg-white text-slate-900 shadow-sm font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5 text-rose-500" />
              <span>Completion Trajectory</span>
            </button>
            <button
              type="button"
              onClick={() => setForecastViewMode('velocity')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                forecastViewMode === 'velocity'
                  ? 'bg-white text-slate-900 shadow-sm font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5 text-blue-500" />
              <span>Weekly Velocity (%/Wk)</span>
            </button>
          </div>
        </div>

        {/* 4 Forecast KPI Micro-cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* ECD */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
            <div className="flex items-center justify-between text-slate-500 text-[11px] font-bold uppercase tracking-wider">
              <span>Estimated Completion (ECD)</span>
              <Target className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-lg font-black text-slate-900 font-mono mt-1">
              {forecastMetrics.estimatedCompletionDate}
            </div>
            <p className="text-[11px] text-emerald-600 font-semibold mt-1">
              {forecastMetrics.earlyVarianceDays}
            </p>
          </div>

          {/* SPI */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
            <div className="flex items-center justify-between text-slate-500 text-[11px] font-bold uppercase tracking-wider">
              <span>Forecast SPI Index</span>
              <TrendingUp className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-lg font-black text-blue-700 font-mono mt-1">
              {forecastMetrics.spi}
            </div>
            <p className="text-[11px] text-blue-600 font-medium mt-1">
              {forecastMetrics.spiStatus}
            </p>
          </div>

          {/* Required Velocity */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
            <div className="flex items-center justify-between text-slate-500 text-[11px] font-bold uppercase tracking-wider">
              <span>Required Run-Rate</span>
              <Clock className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="text-lg font-black text-slate-900 font-mono mt-1">
              {forecastMetrics.requiredRunRate}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Actual pace: <span className="font-semibold text-emerald-600">{forecastMetrics.currentRunRate}</span>
            </p>
          </div>

          {/* Confidence Level */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
            <div className="flex items-center justify-between text-slate-500 text-[11px] font-bold uppercase tracking-wider">
              <span>P80 Confidence</span>
              <Sparkles className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-lg font-black text-emerald-600 font-mono mt-1">
              {forecastMetrics.confidenceLevel}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Planned Target: <span className="font-semibold text-slate-700">26 Sep 2025</span>
            </p>
          </div>
        </div>

        {/* Forecast Chart Render */}
        <div className="h-[360px] w-full relative pt-2">
          {forecastViewMode === 'cumulative' ? (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={forecastDetailedSeries}
                margin={{ top: 25, right: 35, left: 10, bottom: 20 }}
              >
                <defs>
                  <linearGradient id="forecastBand" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.02} />
                  </linearGradient>
                </defs>

                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />

                <XAxis
                  dataKey="week"
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#cbd5e1' }}
                  tickMargin={8}
                />

                <YAxis
                  domain={[85, 102]}
                  ticks={[85, 90, 95, 100]}
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#cbd5e1' }}
                  tickFormatter={(val) => `${val}%`}
                />

                <Tooltip content={<CustomForecastTooltip />} />

                {/* Reference Lines for Cutoff and COD */}
                <ReferenceLine
                  x="W-46"
                  stroke="#0f172a"
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                  label={{
                    value: 'Cutoff W-46 (93.45%)',
                    position: 'insideTopLeft',
                    fill: '#0f172a',
                    fontSize: 10,
                    fontWeight: 700
                  }}
                />

                <ReferenceLine
                  x="W-50"
                  stroke="#2563eb"
                  strokeDasharray="3 3"
                  strokeWidth={1.5}
                  label={{
                    value: 'Contract COD (26-Sep)',
                    position: 'insideTopRight',
                    fill: '#2563eb',
                    fontSize: 10,
                    fontWeight: 700
                  }}
                />

                {/* Confidence Band Area between Optimistic & Pessimistic */}
                <Area
                  type="monotone"
                  dataKey="forecastOptimistic"
                  name="Best Case Scenario"
                  stroke="none"
                  fill="url(#forecastBand)"
                />

                {/* Baseline Planned Line */}
                <Line
                  type="monotone"
                  dataKey="plan"
                  name="Baseline Plan"
                  stroke="#2563eb"
                  strokeWidth={2}
                  dot={{ r: 3, fill: '#2563eb' }}
                />

                {/* Historical Actual line up to W-46 */}
                <Line
                  type="monotone"
                  dataKey="actual"
                  name="Verified Actual"
                  stroke="#059669"
                  strokeWidth={3}
                  dot={{ r: 5, fill: '#059669' }}
                  connectNulls={false}
                />

                {/* Most Likely Forecast Trend Line */}
                <Line
                  type="monotone"
                  dataKey="forecastTrend"
                  name="Forecast Trend (Most Likely)"
                  stroke="#e11d48"
                  strokeWidth={2.5}
                  strokeDasharray="6 4"
                  dot={{ r: 4, fill: '#e11d48' }}
                />

                {/* Optimistic Line (Early Finish W-49) */}
                <Line
                  type="monotone"
                  dataKey="forecastOptimistic"
                  name="Early Finish Forecast (W-49)"
                  stroke="#10b981"
                  strokeWidth={1.5}
                  strokeDasharray="3 3"
                  dot={{ r: 3, fill: '#10b981' }}
                />

                {/* Delay Risk Scenario */}
                <Line
                  type="monotone"
                  dataKey="forecastPessimistic"
                  name="Conservative / Delay Risk"
                  stroke="#f59e0b"
                  strokeWidth={1.5}
                  strokeDasharray="2 2"
                  dot={{ r: 3, fill: '#f59e0b' }}
                />

                {/* Pin Point Early 100% at W-49 */}
                <ReferenceDot
                  x="W-49"
                  y={100.0}
                  r={6}
                  fill="#10b981"
                  stroke="#ffffff"
                  strokeWidth={2}
                />

                {/* Pin Point Baseline 100% at W-50 */}
                <ReferenceDot
                  x="W-50"
                  y={100.0}
                  r={6}
                  fill="#2563eb"
                  stroke="#ffffff"
                  strokeWidth={2}
                />
              </ComposedChart>
            </ResponsiveContainer>
          ) : (
            /* Weekly Velocity View (Bar Chart) */
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={forecastDetailedSeries}
                margin={{ top: 25, right: 35, left: 10, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="week"
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#cbd5e1' }}
                  tickMargin={8}
                />
                <YAxis
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#cbd5e1' }}
                  tickFormatter={(val) => `+${val}%`}
                />
                <Tooltip content={<CustomForecastTooltip />} />
                <ReferenceLine
                  y={1.64}
                  stroke="#e11d48"
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                  label={{
                    value: 'Req. Velocity (1.64%/wk)',
                    fill: '#e11d48',
                    fontSize: 10,
                    fontWeight: 600,
                    position: 'insideTopLeft'
                  }}
                />
                <Bar
                  dataKey="weeklyDelta"
                  name="Weekly Progress Increment"
                  fill="#38bdf8"
                  radius={[6, 6, 0, 0]}
                />
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Forecast Milestones & Scenario Legend Bar */}
        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex flex-wrap items-center gap-4 font-medium">
            <div className="flex items-center gap-1.5 text-blue-700">
              <span className="w-3.5 h-1 bg-blue-600 rounded"></span>
              <span>Baseline Plan (100% W-50)</span>
            </div>
            <div className="flex items-center gap-1.5 text-emerald-700">
              <span className="w-3.5 h-1 bg-emerald-600 rounded"></span>
              <span>Verified Actual</span>
            </div>
            <div className="flex items-center gap-1.5 text-rose-600">
              <span className="w-3.5 h-0.5 border-t-2 border-dashed border-rose-500"></span>
              <span>Forecast Trend (Most Likely)</span>
            </div>
            <div className="flex items-center gap-1.5 text-emerald-600">
              <span className="w-3.5 h-0.5 border-t-2 border-dotted border-emerald-500"></span>
              <span>Early Finish Target (W-49)</span>
            </div>
            <div className="flex items-center gap-1.5 text-amber-600">
              <span className="w-3.5 h-0.5 border-t-2 border-dashed border-amber-500"></span>
              <span>Delay Risk (W-51)</span>
            </div>
          </div>

          <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1.5">
            <Flag className="w-3.5 h-3.5 text-emerald-600" />
            <span>Target COD: 19 Sep 2025 (W-49 Early RFSU)</span>
          </div>
        </div>

        {/* Forecast Lookahead Milestone Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2">
          <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-200/80 text-xs">
            <div className="flex items-center justify-between text-slate-400 font-mono text-[10px] mb-1">
              <span>W-47 (05-Sep)</span>
              <span className="text-blue-600 font-semibold font-mono">95.80%</span>
            </div>
            <div className="font-bold text-slate-800">Mechanical Completion</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Vessels & GEC #6 mounted</div>
          </div>

          <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-200/80 text-xs">
            <div className="flex items-center justify-between text-slate-400 font-mono text-[10px] mb-1">
              <span>W-48 (12-Sep)</span>
              <span className="text-blue-600 font-semibold font-mono">97.60%</span>
            </div>
            <div className="font-bold text-slate-800">Pre-Commissioning</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Loop check & leak test</div>
          </div>

          <div className="bg-emerald-50/60 p-3 rounded-xl border border-emerald-200 text-xs">
            <div className="flex items-center justify-between text-emerald-600 font-mono text-[10px] mb-1">
              <span>W-49 (19-Sep)</span>
              <span className="text-emerald-700 font-bold font-mono">100.00%</span>
            </div>
            <div className="font-bold text-emerald-900">RFSU & First Gas</div>
            <div className="text-[11px] text-emerald-700 mt-0.5">Early Completion Target</div>
          </div>

          <div className="bg-blue-50/60 p-3 rounded-xl border border-blue-200 text-xs">
            <div className="flex items-center justify-between text-blue-600 font-mono text-[10px] mb-1">
              <span>W-50 (26-Sep)</span>
              <span className="text-blue-700 font-bold font-mono">100.00%</span>
            </div>
            <div className="font-bold text-blue-900">Contractual COD</div>
            <div className="text-[11px] text-blue-700 mt-0.5">Official Baseline Target</div>
          </div>
        </div>
      </div>

      {/* S-Curve Data Table (Horizontal from W-28 to W-46) */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-bold text-xs uppercase tracking-wider text-slate-700">
              Weekly S-Curve Progress Data Table (W-28 to W-46)
            </span>
          </div>
          <span className="text-xs text-slate-500 font-medium">Unit: Percentage (%)</span>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-semibold">
                <th className="p-3 sticky left-0 bg-slate-100 z-10 min-w-[190px] border-r border-slate-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                  Progress Metric
                </th>
                {weeklyTableData.map((d) => (
                  <th key={d.week} className="p-3 text-center min-w-[68px] font-mono whitespace-nowrap">
                    <div>{d.week}</div>
                    <div className="text-[10px] text-slate-400 font-normal">{d.date}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {/* Cum Plan Progress */}
              <tr className="hover:bg-blue-50/30 transition-colors">
                <td className="p-3 sticky left-0 bg-white font-sans font-semibold text-blue-700 border-r border-slate-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600 shrink-0"></span>
                    <span>CUM PLAN PROGRESS</span>
                  </div>
                </td>
                {weeklyTableData.map((d) => (
                  <td
                    key={d.week}
                    className={`p-3 text-center font-medium ${
                      d.week === 'W-46' ? 'bg-blue-50 text-blue-800 font-bold' : 'text-slate-600'
                    }`}
                  >
                    {d.plan.toFixed(2)}%
                  </td>
                ))}
              </tr>

              {/* Cum Actual Progress */}
              <tr className="hover:bg-emerald-50/30 transition-colors">
                <td className="p-3 sticky left-0 bg-white font-sans font-semibold text-emerald-800 border-r border-slate-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 shrink-0"></span>
                    <span>CUM ACTUAL PROGRESS</span>
                  </div>
                </td>
                {weeklyTableData.map((d) => (
                  <td
                    key={d.week}
                    className={`p-3 text-center font-medium ${
                      d.week === 'W-46'
                        ? 'bg-emerald-50 text-emerald-800 font-bold ring-1 ring-inset ring-emerald-300'
                        : d.actual !== null
                        ? 'text-slate-900 font-semibold'
                        : 'text-slate-400'
                    }`}
                  >
                    {d.actual !== null ? `${d.actual.toFixed(2)}%` : '-'}
                  </td>
                ))}
              </tr>

              {/* Variance row */}
              <tr className="hover:bg-slate-50 transition-colors bg-slate-50/30">
                <td className="p-3 sticky left-0 bg-slate-50 font-sans font-semibold text-slate-700 border-r border-slate-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                  VARIANCE (ACT - PLAN)
                </td>
                {weeklyTableData.map((d) => {
                  const diff = d.actual !== null ? (d.actual - d.plan).toFixed(2) : null;
                  const isPos = Number(diff) >= 0;
                  return (
                    <td
                      key={d.week}
                      className={`p-3 text-center font-semibold ${
                        diff === null
                          ? 'text-slate-400'
                          : isPos
                          ? 'text-emerald-600'
                          : 'text-rose-600'
                      }`}
                    >
                      {diff !== null ? (isPos ? `+${diff}%` : `${diff}%`) : '-'}
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
